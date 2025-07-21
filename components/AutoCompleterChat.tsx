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
import LinearGradient from "react-native-linear-gradient";
import Spinner from "react-native-loading-spinner-overlay";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
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
  const generationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const AnimatedLinearGradient =
    Animated.createAnimatedComponent(LinearGradient);
  const translateX = useSharedValue(0);

  React.useEffect(() => {
    translateX.value = withRepeat(withTiming(1, { duration: 3000 }), -1, false);
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 100 }],
  }));

  const [userInput, setUserInput] = useState<string>("");
  const [modeId, setModeId] = useState<number>(mode);
  const [showModeModal, setShowModeModal] = useState(false);
  const [responses, setResponses] = useState<string[]>([]);
  const [elaborateOnHint, setElaborateOnHint] = useState<string | null>(null);

  const changeMode = () => setShowModeModal(true);

  const llm = useLLM({
    modelSource: LLAMA3_2_1B,
    tokenizerSource: LLAMA3_2_1B_TOKENIZER,
    tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
  });

  const generateResponse = async (text: string) => {
    text = text.trim();
    if (!text || !llm.isReady || llm.isGenerating) return;

    try {
      await llm.generate([
        {
          role: "system",
          content: systemPrompt({ mode: MODES[modeId].label }),
        },
        { role: "user", content: text },
      ]);
      return llm.response;
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
    typingTimeoutRef.current = setTimeout(async () => {
      const response = await generateResponse(userInput);
      if (response && !responses.includes(response)) {
        setResponses((prev) => [...prev, response]);
      }
    }, 200);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userInput]);

  useEffect(() => {
    if (responses.length >= 3 || elaborateOnHint) return;

    if (generationIntervalRef.current) {
      clearInterval(generationIntervalRef.current);
    }

    generationIntervalRef.current = setInterval(async () => {
      const response = await generateResponse(userInput);
      if (response && !responses.includes(response)) {
        setResponses((prev) => [...prev, response]);
      }
    }, 1000);
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
                  setUserInput(text);
                  setResponses([]);
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
            <View style={{ alignItems: "flex-end" }}>
              {responses.map((hint, _) => (
                // <AnimatedTouchableOpacity text={hint} />
                <TouchableOpacity
                  activeOpacity={1}
                  style={[
                    styles.chatResponse,
                    styles.chatResponseReady,
                    elaborateOnHint === hint && {
                      borderWidth: 2,
                      borderColor: "#fff",
                    },
                    { overflow: "hidden" },
                  ]}
                  disabled={!responses.length}
                  onPress={() => {
                    setUserInput((prev) => prev.trim() + " " + hint);
                    setResponses([]);
                  }}
                  onLongPress={async () => {
                    console.log("Long press:", hint);
                    setElaborateOnHint(hint);
                    try {
                      while (llm.isGenerating) {
                        await new Promise((resolve) =>
                          setTimeout(resolve, 100)
                        );
                      }
                      const combinedInput = userInput.trim() + " " + hint;
                      await generateResponse(combinedInput);
                      const newHint = llm.response?.trim() || "";
                      if (newHint) {
                        setResponses((prevResponses) =>
                          prevResponses.map((res) =>
                            res === hint ? hint + " " + newHint : res
                          )
                        );
                      }
                    } catch (error) {
                      console.error("Error on long press generation:", error);
                    } finally {
                      setElaborateOnHint(null);
                    }
                  }}
                >
                  {elaborateOnHint === hint && (
                    <AnimatedLinearGradient
                      colors={[
                        ColorPalette.seaBlueDark,
                        ColorPalette.seaBlueMedium,
                        ColorPalette.seaBlueDark,
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[StyleSheet.absoluteFill, animatedStyle]}
                    />
                  )}
                  <Text style={{ color: "#fff", zIndex: 1 }}>{hint}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {responses.length < 3 && (
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
