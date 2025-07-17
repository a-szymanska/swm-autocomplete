import LlamaIcon from "@/assets/icons/llama_icon.svg";
import { ColorPalette } from "@/constants/Colors";
import { MODES } from "@/constants/Modes";
import Clipboard from "@react-native-clipboard/clipboard";
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
import Icon from "react-native-vector-icons/Ionicons";

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
      console.log("Pause in typing", userInput);
      Keyboard.dismiss();
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
        console.log("Hint:", llm.response);
      } catch (error) {
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
        <View style={styles.headerContainer}>
          <View style={styles.headerIcon}>
            <LlamaIcon width={24} height={24} fill={ColorPalette.primary} />
          </View>
          <Text style={styles.headerText}>
            Let me help you with your writing
          </Text>
        </View>
        <View style={styles.bottomContainer}>
          <View style={{ flexDirection: "row" }}>
            <TouchableOpacity
              style={[styles.headerModeText, { marginRight: 0.65 * width }]}
              onPress={changeMode}
            >
              <Text>{MODES[modeId].label}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => {
                if (userInput) {
                  Clipboard.setString(userInput);
                }
              }}
            >
              <Icon
                name="copy-outline"
                size={20}
                color={ColorPalette.primary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.textInputWrapper}>
            <Text style={styles.autocompleteText}>
              {userInput}
              {showHint && <Text style={styles.hintText}> {llm.response}</Text>}
            </Text>
            <Animated.View
              style={[styles.textInputContainer, textInputAnimatedStyle]}
            >
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
                  const lastChar = text.slice(-1);
                  setUserInput(text);
                  if (lastChar === "\t") {
                    console.log("User pressed Tab", llm.response);
                    setUserInput((prev) => prev.trim() + " " + llm.response);
                  }
                  setShowHint(false);
                }}
                value={userInput}
              />
            </Animated.View>
          </View>
        </View>
        <Animated.View style={[styles.keyboardContainer, hintAnimatedStyle]}>
          <TouchableOpacity style={styles.keyboardBox}>
            <Text>Some thoughtful hints</Text>
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
    padding: 10,
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
    padding: 50,
    marginTop: 50,
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
  textInputWrapper: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    marginTop: 20,
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
    zIndex: 0,
  },
  hintText: {
    color: ColorPalette.blueLight,
  },
  textInputContainer: {
    alignItems: "center",
    width: "100%",
    backgroundColor: "transparent",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    fontFamily: "regular",
    fontSize: 14,
    color: ColorPalette.primary,
    padding: 16,
    maxHeight: 540,
    minHeight: 100,
    height: 540,
    width: "100%",
    backgroundColor: "transparent",
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
    color: "red",
  },
});
