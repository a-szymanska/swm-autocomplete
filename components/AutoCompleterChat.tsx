import LlamaIcon from "@/assets/icons/llama_icon.svg";
import { ColorPalette } from "@/constants/Colors";
import { MODES } from "@/constants/Modes";
import { systemPrompt } from "@/constants/Prompt";
import Clipboard from "@react-native-clipboard/clipboard";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  LLAMA3_2_1B,
  LLAMA3_2_1B_TOKENIZER,
  LLAMA3_2_TOKENIZER_CONFIG,
  useLLM,
} from "react-native-executorch";
import Spinner from "react-native-loading-spinner-overlay";
import Animated from "react-native-reanimated";
import Icon from "react-native-vector-icons/Ionicons";
import ModeActionSheet from "./ActionSheet";
import AnimatedDots from "./AnimatedDots";

type LLMScreenWrapperProps = {
  mode: number;
};

export default function LLMScreenWrapper({ mode }: LLMScreenWrapperProps) {
  const isFocused = useIsFocused();
  return isFocused ? <LLMScreen mode={mode} /> : null;
}

function LLMScreen({ mode }: LLMScreenWrapperProps) {
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userInput, setUserInput] = useState<string>("");
  const [modeId, setModeId] = useState<number>(mode);
  const [showModeModal, setShowModeModal] = useState(false);
  const [responses, setResponses] = useState<string[]>([]);
  const [generatedCount, setGeneratedCount] = useState<number>(0);
  const [lastTypedAt, setLastTypedAt] = useState<number>(Date.now());
  const generationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pauseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [pauseSeconds, setPauseSeconds] = useState<number>(0);

  const changeMode = () => setShowModeModal(true);

  const llm = useLLM({
    modelSource: LLAMA3_2_1B,
    tokenizerSource: LLAMA3_2_1B_TOKENIZER,
    tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
  });

  const generateResponse = async () => {
    if (!userInput.trim() || !llm.isReady || llm.isGenerating) return;

    try {
      console.log("Generating new response...");
      await llm.generate([
        {
          role: "system",
          content: systemPrompt({ mode: MODES[modeId].label }),
        },
        { role: "user", content: userInput.trim() },
      ]);

      if (llm.response && !responses.includes(llm.response)) {
        setResponses((prev) => [...prev, llm.response]);
      }
    } catch (err) {
      console.error("Generation error:", err);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (llm.isReady || llm.downloadProgress === 1) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [llm]);

  useEffect(() => {
    if (!userInput) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setResponses([]);
      generateResponse();
    }, 500);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userInput]);

  useEffect(() => {
    if (responses.length >= 5) return;

    if (generationIntervalRef.current) {
      clearInterval(generationIntervalRef.current);
    }

    generationIntervalRef.current = setInterval(() => {
      if (llm.isReady && !llm.isGenerating && userInput.trim()) {
        generateResponse();
      }
    }, 1500);
    return () => {
      clearInterval(generationIntervalRef.current!);
    };
  }, [responses, llm.isGenerating, llm.isReady, userInput]);

  return !llm.isReady ? (
    <View style={styles.container}>
      <Spinner
        visible={!llm.isReady}
        textContent={`Loading the model ${(llm.downloadProgress * 100).toFixed(
          0
        )} %`}
      />
    </View>
  ) : (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.bottomContainer}>
          <View style={styles.headerContainer}>
            <View style={styles.headerIcon}>
              <LlamaIcon width={24} height={24} fill={ColorPalette.primary} />
            </View>
            <Text style={styles.headerText}>
              Let me help you with your writing
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              paddingVertical: 25,
              paddingHorizontal: 10,
              alignSelf: "flex-start",
            }}
          >
            <Text style={styles.headerStyleText}>Writing style:</Text>
            <TouchableOpacity
              style={styles.headerModeText}
              onPress={changeMode}
            >
              <Text style={{ color: ColorPalette.primary }}>
                {MODES[modeId].label}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.textInputWrapper}>
            <Animated.View style={styles.textInputContainer}>
              <TextInput
                autoCorrect={false}
                autoComplete={"off"}
                keyboardType="ascii-capable"
                style={styles.textInput}
                placeholder="Start typing..."
                placeholderTextColor={ColorPalette.blueLight}
                multiline={true}
                onChangeText={(text: string) => {
                  setUserInput(text); // TODO generate based on new input
                  setResponses([]);
                  setLastTypedAt(Date.now());
                  setGeneratedCount(0);

                  if (generationIntervalRef.current) {
                    clearInterval(generationIntervalRef.current);
                    generationIntervalRef.current = null;
                  }
                }}
                value={userInput}
              />
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => {
                  if (userInput) {
                    Clipboard.setString(userInput);
                  }
                }}
              >
                <Icon name="copy-outline" size={20} color={"#fff"} />
              </TouchableOpacity>
            </Animated.View>
          </View>
          <View style={styles.chatResponseContainer}>
            <View>
              {responses.map((hint, _) => (
                <TouchableOpacity
                  style={[styles.chatResponse, styles.chatResponseReady]}
                  onPress={() => {
                    setUserInput((prev) => prev.trim() + " " + hint);
                    setResponses([]);
                  }}
                  disabled={!responses.length}
                >
                  <Text style={{ color: "#fff" }}>{hint}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {responses.length < 5 && (
              <View
                style={[styles.chatResponse, styles.chatResponseGenerating]}
              >
                <AnimatedDots
                  size={6}
                  numberDots={3}
                  jumpHeight={6}
                  delay={320}
                  color={"#fff"}
                />
              </View>
            )}
          </View>
        </View>
        <ModeActionSheet
          visible={showModeModal}
          onClose={() => setShowModeModal(false)}
          onSelectMode={(id) => setModeId(id)}
          selectedModeIndex={modeId}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    flexDirection: "column",
  },
  headerModeText: {
    backgroundColor: ColorPalette.seaBlueMedium,
    color: ColorPalette.primary,
    borderRadius: 20,
    padding: 8,
    justifyContent: "center",
  },
  headerIcon: {
    backgroundColor: ColorPalette.seaBlueLight,
    height: 32,
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    marginHorizontal: 10,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 100,
  },
  bottomContainer: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerText: {
    fontFamily: "regular",
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
    color: ColorPalette.primary,
  },
  headerStyleText: {
    fontFamily: "regular",
    fontSize: 18,
    lineHeight: 28,
    color: ColorPalette.primary,
    marginRight: 10,
  },
  copyButton: {
    padding: 15,
    color: ColorPalette.blueLight,
    borderRadius: 4,
    position: "absolute",
    top: 0,
    right: 0,
  },
  textInputWrapper: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 20,
    flexDirection: "column",
    borderTopWidth: 1,
    borderTopColor: ColorPalette.seaBlueMedium,
  },
  textInputContainer: {
    alignItems: "center",
    width: "100%",
    backgroundColor: ColorPalette.primary,
    borderRadius: 24,
    flexDirection: "row",
    position: "relative",
  },
  textInput: {
    fontFamily: "regular",
    fontSize: 16,
    padding: 16,
    maxHeight: 200,
    width: "90%",
    color: "#fff",
    alignSelf: "flex-start",
  },
  chatResponseContainer: {
    alignSelf: "flex-end",
    marginTop: 10,
  },
  chatResponse: {
    borderRadius: 24,
    height: 50,
    padding: 16,
    marginVertical: 5,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  chatResponseGenerating: {
    backgroundColor: "#d1d6da",
  },
  chatResponseReady: {
    fontFamily: "regular",
    fontSize: 16,
    minWidth: 100,
    color: "#fff",
    backgroundColor: ColorPalette.seaBlueDark,
  },
  keyboardContainer: {
    position: "absolute",
    alignItems: "center",
    bottom: 0,
    width: "100%",
    backgroundColor: "#d1d6da",
  },
  keyboardBox: {
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    width: "100%",
  },
});
