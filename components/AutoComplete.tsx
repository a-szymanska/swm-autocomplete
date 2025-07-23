// TODO remove repeated prefix
// TODO why so slow?
// TODO skip first 2s

import { ColorPalette } from "@/constants/Colors";
import { MODES } from "@/constants/Modes";
import { systemPrompt } from "@/constants/Prompt";
import Clipboard from "@react-native-clipboard/clipboard";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
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
import Animated from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import Icon from "react-native-vector-icons/Ionicons";
import ModeActionSheet from "./ActionSheet";
import AnimatedDots from "./AnimatedDots";
import AnimatedTouchableOpacity from "./AnimatedTouchableOpacity";
import LoadingModel from "./LoadingModel";

type LLMScreenWrapperProps = {
  mode: number;
};

const NUMBER_HINTS = 2;

export default function LLMScreenWrapper({ mode }: LLMScreenWrapperProps) {
  const isFocused = useIsFocused();
  return isFocused ? <LLMScreen mode={mode} /> : null;
}

function LLMScreen({ mode }: LLMScreenWrapperProps) {
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const generatedHintRef = useRef<string | null>(null);

  const [userInput, setUserInput] = useState<string>("");
  const [modeId, setModeId] = useState<number>(mode);
  const [showModeModal, setShowModeModal] = useState(false);
  const [responses, setResponses] = useState<string[]>([]);

  const changeMode = () => setShowModeModal(true);

  const llm = useLLM({
    modelSource: LLAMA3_2_1B,
    tokenizerSource: LLAMA3_2_1B_TOKENIZER,
    tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
  });
  const amplitude = 5; // small height of waves
  const wavelength = 15; // how long each wave is
  const width = 300;
  const height = 30;

  const createPathForLlama = () => {
    let path = `M 0 ${height / 2}`;
    let x = 0;

    while (x < width) {
      const dx = wavelength;
      const dy = Math.random() * amplitude * 2 - amplitude; // random vertical shift
      const controlX = x + dx / 2;
      const controlY = height / 2 + dy;
      const endX = x + dx;
      const endY = height / 2;

      path += ` Q ${controlX} ${controlY}, ${endX} ${endY}`;
      x += dx;
    }

    return path;
  };

  function cleanResponse(response: string) {
    // console.log("Cleaning...");
    // console.log("\t Before:", response);
    const input = userInput;
    let cleanResponse = response.trim();
    if (!/[.?!]$/.test(input.trim())) {
      cleanResponse = cleanResponse.toLowerCase();
    }
    // console.log("\t After:", cleanResponse);
    return cleanResponse;
  }

  const generateResponse = async (input: string) => {
    input = input.trim();
    if (!input || !llm.isReady || llm.isGenerating) return null;
    console.log(`Generate hint for "${input}"`);

    try {
      await llm.generate([
        {
          role: "system",
          content: systemPrompt({ mode: MODES[modeId].label }),
        },
        { role: "user", content: input },
      ]);
      return cleanResponse(llm.response);
    } catch (error) {
      console.error("Generation error:", error);
    }
  };

  useEffect(() => {
    if (!userInput || generatedHintRef.current) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(async () => {
      const response = await generateResponse(userInput);
      if (response && !responses.includes(response)) {
        setResponses((prev) => [...prev, response]);
      }
    }, 500);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userInput]);

  useEffect(() => {
    if (responses.length >= NUMBER_HINTS || generatedHintRef.current) return;

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
    <LoadingModel model={llm} />
  ) : (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.bottomContainer}>
          <View style={styles.headerContainer}>
            <Image
              source={require("@/assets/images/llama_portrait.png")}
              style={styles.llamaIcon}
            />
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
                  llm.interrupt();
                  setUserInput(text);
                  setResponses([]);
                  generatedHintRef.current = null;
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
                <AnimatedTouchableOpacity
                  text={hint}
                  animate={generatedHintRef.current === hint}
                  onPress={() => {
                    setUserInput((prev) => prev.trim() + " " + hint);
                    setResponses([]);
                  }}
                  onLongPress={async () => {
                    if (responses.length < NUMBER_HINTS) return;
                    generatedHintRef.current = hint;
                    console.log(`Elaborate on "${generatedHintRef.current}"`);
                    try {
                      llm.interrupt();
                      const response = await generateResponse(
                        userInput.trim() + " " + hint
                      );
                      console.log(
                        `Generated "${
                          userInput.trim() + " " + hint
                        }" + "${response}"`
                      );
                      if (response) {
                        setResponses((prevResponses) =>
                          prevResponses.map((res) =>
                            res === hint ? hint + " " + response : res
                          )
                        );
                      }
                    } catch (error) {
                      console.error("Error on long press:", error);
                    } finally {
                      generatedHintRef.current = null;
                    }
                  }}
                />
              ))}
            </View>
            {responses.length < NUMBER_HINTS && !generatedHintRef.current && (
              <View
                style={[styles.chatResponse, styles.chatResponseGenerating]}
              >
                <AnimatedDots
                  size={6}
                  numberDots={3}
                  jumpHeight={4}
                  delay={750}
                  color={"#fff"}
                />
              </View>
            )}
          </View>
        </View>
        {responses.length < NUMBER_HINTS && !generatedHintRef.current && (
          <View style={{ position: "absolute", left: 0, bottom: 0 }}>
            <Image
              source={require("@/assets/images/llama.gif")}
              style={styles.llama}
            />
            <Svg height="72" width="180">
              <Path
                d={createPathForLlama()}
                fill="none"
                stroke={ColorPalette.seaBlueMedium}
                strokeWidth="1.5"
              />
            </Svg>
          </View>
        )}
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
  llamaIcon: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ColorPalette.seaBlueLight,
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
    minHeight: 50,
    padding: 16,
    marginVertical: 5,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  chatResponseGenerating: {
    backgroundColor: "#d1d6da",
    height: 50,
  },
  chatResponseReady: {
    fontFamily: "regular",
    fontSize: 16,
    minWidth: 100,
    color: "#fff",
    backgroundColor: ColorPalette.seaBlueDark,
  },
  llama: {
    height: 110,
    width: 160,
    position: "absolute",
    left: 0,
    bottom: 50,
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
