import LlamaIcon from "@/assets/icons/llama_icon.svg";
import AnimatedDots from "@/components/AnimatedDots";
import { ColorPalette } from "@/constants/Colors";
import { MODES } from "@/constants/Modes";
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
  LLAMA3_2_TOKENIZER,
  LLAMA3_2_TOKENIZER_CONFIG,
  useLLM,
} from "react-native-executorch";
import Spinner from "react-native-loading-spinner-overlay";
import Animated, {
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";
import Icon from "react-native-vector-icons/Ionicons";
import ModeActionSheet from "./ActionSheet";

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
  const [showHint, setShowHint] = useState<boolean>(false);
  const [modeId, setModeId] = useState<number>(mode);
  const keyboard = useAnimatedKeyboard();
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [showModeModal, setShowModeModal] = useState(false);

  const changeMode = () => setShowModeModal(true);

  useDerivedValue(() => {
    runOnJS(setKeyboardHeight)(keyboard.height.value);
  }, [keyboard.height]);

  const hintAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -keyboard.height.value }],
      opacity: keyboardHeight > 0 ? 1 : 0,
    };
  });

  const llm = useLLM({
    modelSource: LLAMA3_2_1B,
    tokenizerSource: LLAMA3_2_TOKENIZER,
    tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
  });

  // const changeMode = () =>
  //   ActionSheetIOS.showActionSheetWithOptions(
  //     {
  //       options: ["Cancel", ...MODES.map((item) => item.label)],
  //       cancelButtonIndex: 0,
  //       destructiveButtonIndex: modeId + 1,
  //     },
  //     (id) => {
  //       if (id > 0) {
  //         setModeId(id - 1);
  //       }
  //     }
  //   );

  const acceptHint = () => {
    // console.log("Accept", llm.response);
    setUserInput((prev) => prev.trim() + " " + llm.response);
    setShowHint(false);
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
      if (!userInput.trim() || !llm.isReady || llm.isGenerating) return;
      try {
        await llm.generate([
          {
            content: `You are an autocompleter - give answer of 1-5 words! Give only suffix to user input!! Do not repeat user input!! Style: ${MODES[modeId].label}`,
            role: "system",
          },
          { content: userInput.trim(), role: "user" },
        ]);
        setShowHint(!!llm.response);
      } catch (error) {
        console.log("error:", error);
        console.log("LLM error:", llm.error);
        setShowHint(false);
      }
    }, 1000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [userInput]);

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
          <View style={{ flexDirection: "row", padding: 20 }}>
            <Text style={styles.headerStyleText}>Writing style:</Text>
            <TouchableOpacity
              style={styles.headerModeText}
              onPress={changeMode}
            >
              <Text>{MODES[modeId].label}</Text>
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
                  setShowHint(false);
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
            <TouchableOpacity
              style={[
                styles.chatResponse,
                {
                  backgroundColor:
                    llm.response && showHint
                      ? ColorPalette.seaBlueDark
                      : "#d1d6da",
                },
              ]}
              onPress={acceptHint}
              disabled={!llm.response}
            >
              {llm.response && showHint ? (
                <Text style={{ color: "#fff" }}>{llm.response}</Text>
              ) : (
                <View style={{ justifyContent: "center" }}>
                  <AnimatedDots
                    size={5}
                    numberDots={3}
                    jumpHeight={6}
                    delay={250}
                    color={"#fff"}
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <Animated.View style={[styles.keyboardContainer, hintAnimatedStyle]}>
          <TouchableOpacity style={styles.keyboardBox} onPress={acceptHint}>
            <Text>{llm.response}</Text>
          </TouchableOpacity>
        </Animated.View>
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
    borderColor: ColorPalette.primary,
    backgroundColor: ColorPalette.seaBlueLight,
    color: ColorPalette.primary,
    borderRadius: 20,
    borderWidth: 1,
    padding: 5,
    height: 30,
    marginRight: 200,
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
    textAlign: "center",
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
  autocompleteText: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    fontFamily: "regular",
    fontSize: 14,
    color: "transparent",
    backgroundColor: "transparent",
  },
  hintText: {
    color: ColorPalette.seaBlueMedium,
  },
  textInputWrapper: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
    flexDirection: "column",
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
    padding: 5,
    marginTop: 10,
  },
  chatResponse: {
    borderRadius: 24,
    fontFamily: "regular",
    fontSize: 16,
    height: 50,
    minWidth: 100,
    color: "#fff",
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
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
