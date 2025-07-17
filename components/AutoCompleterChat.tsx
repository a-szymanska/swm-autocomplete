import LlamaIcon from "@/assets/icons/llama_icon.svg";
import { ColorPalette } from "@/constants/Colors";
import { MODES } from "@/constants/Modes";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Dimensions,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  LLAMA3_2_1B_QLORA,
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

type LLMScreenWrapperProps = {
  mode: number;
};

export default function LLMScreenWrapper({ mode }: LLMScreenWrapperProps) {
  const isFocused = useIsFocused();
  return isFocused ? <LLMScreen mode={mode} /> : null;
}

function LLMScreen({ mode }: LLMScreenWrapperProps) {
  const { width } = Dimensions.get("window");
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userInput, setUserInput] = useState<string>("");
  const [showHint, setShowHint] = useState<boolean>(false);
  const [modeId, setModeId] = useState<number>(mode);
  const keyboard = useAnimatedKeyboard();
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  useDerivedValue(() => {
    runOnJS(setKeyboardHeight)(keyboard.height.value);
  }, [keyboard.height]);

  const textInputAnimatedStyle = useAnimatedStyle(() => {
    const maxHeight = 540;
    const height = maxHeight - keyboard.height.value;
    return {
      height: height,
    };
  });

  const hintAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -keyboard.height.value }],
      opacity: keyboardHeight > 0 ? 1 : 0,
    };
  });

  const llm = useLLM({
    modelSource: LLAMA3_2_1B_QLORA,
    tokenizerSource: LLAMA3_2_TOKENIZER,
    tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
  });

  const changeMode = () =>
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ["Cancel", ...MODES.map((item) => item.label)],
        cancelButtonIndex: 0,
        destructiveButtonIndex: modeId + 1,
      },
      (id) => {
        if (id > 0) {
          setModeId(id - 1);
        }
      }
    );

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
      // console.log("Pause in typing", userInput);
      // Keyboard.dismiss();
      if (!userInput.trim()) return;
      try {
        await llm.generate([
          {
            content: `You are an autocompleter - give answer of 1-5 words! Give only suffix to user input!! Do not repeat user input!! Style: ${MODES[modeId].label}`,
            role: "system",
          },
          { content: userInput.trim(), role: "user" },
        ]);
        setShowHint(!!llm.response);
        // console.log("Hint:", llm.response);
      } catch (error) {
        // ("LLM error:", llm.error);
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
                onFocus={() => setIsTextInputFocused(true)}
                onBlur={() => setIsTextInputFocused(false)}
                style={[
                  styles.textInput,
                  {
                    borderColor: isTextInputFocused
                      ? ColorPalette.blueDark
                      : ColorPalette.blueLight,
                  },
                ]}
                placeholder="Start typing..."
                placeholderTextColor={ColorPalette.blueLight}
                multiline={true}
                onChangeText={(text: string) => {
                  setUserInput(text);
                  setShowHint(false);
                }}
                value={userInput}
              />
            </Animated.View>
          </View>
          <View style={styles.chatResponseContainer}>
            <TouchableOpacity
              style={styles.chatResponse}
              onPress={acceptHint}
              disabled={!llm.response}
            >
              {llm.response && showHint ? (
                <Text style={{ color: "#fff" }}>{llm.response}</Text>
              ) : (
                <Text style={{ color: "#fff" }}>thinking...</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <Animated.View style={[styles.keyboardContainer, hintAnimatedStyle]}>
          <TouchableOpacity style={styles.keyboardBox} onPress={acceptHint}>
            <Text>{llm.response}</Text>
          </TouchableOpacity>
        </Animated.View>
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
    height: "100%",
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
    padding: 6,
    color: ColorPalette.blueLight,
    borderRadius: 4,
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
    backgroundColor: "transparent",
  },
  textInput: {
    // adjust size to multiline input up to maxHeight
    borderRadius: 24,
    fontFamily: "regular",
    fontSize: 16,
    padding: 16,
    height: 200,
    width: "100%",
    color: "#fff",
    backgroundColor: ColorPalette.primary,
  },
  chatResponseContainer: {
    padding: 20,
    alignSelf: "flex-end",
  },
  responseAcceptButton: {
    backgroundColor: ColorPalette.seaBlueDark,
    height: 50,
    width: 50,
    borderRadius: 24,
    marginHorizontal: 10,
  },
  chatResponse: {
    // align container (not its content) to the right
    borderRadius: 24,
    fontFamily: "regular",
    fontSize: 16,
    padding: 16,
    height: 50,
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
