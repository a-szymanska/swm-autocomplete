import LlamaIcon from "@/assets/icons/llama_icon.svg";
import { ColorPalette } from "@/constants/Colors";
import { MODES } from "@/constants/Modes";
import Clipboard from "@react-native-clipboard/clipboard";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
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
import Icon from "react-native-vector-icons/Ionicons";

type LLMScreenWrapperProps = {
  mode: number;
};

export default function LLMScreenWrapper({ mode }: LLMScreenWrapperProps) {
  const isFocused = useIsFocused();
  return isFocused ? <LLMScreen mode={mode} /> : null;
}

function LLMScreen({ mode }: LLMScreenWrapperProps) {
  const [isTextInputFocused, setIsTextInputFocused] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userInput, setUserInput] = useState<string>("");
  const [showHint, setShowHint] = useState<boolean>(false);
  const [modeId, setModeId] = useState<number>(mode);

  const llm = useLLM({
    modelSource: LLAMA3_2_1B,
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
      <KeyboardAvoidingView
        style={styles.container}
        collapsable={false}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 40}
      >
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
            <TouchableOpacity
              style={styles.headerModeText}
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
                color={ColorPalette.blueLight}
              />
            </TouchableOpacity>
            <View style={styles.textInputWrapper}>
              <Text style={styles.autocompleteText}>
                {userInput}
                {showHint && (
                  <Text style={styles.hintText}> {llm.response}</Text>
                )}
              </Text>
              <TextInput
                autoCorrect={false}
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
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    paddingBottom: Platform.OS === "android" ? 20 : 0,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
  },
  headerModeText: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
    borderColor: ColorPalette.blueLight,
    borderRadius: 20,
    borderWidth: 1,
    padding: 10,
    position: "absolute",
    left: 20,
    top: 70,
  },
  headerIcon: {
    backgroundColor: ColorPalette.seaBlueLight,
    height: 32,
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    marginHorizontal: 7,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 120,
    gap: 8,
  },
  bottomContainer: {
    height: 800,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    position: "absolute",
    bottom: 0,
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
    backgroundColor: "transparent",
  },
  headerText: {
    fontFamily: "regular",
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
    color: ColorPalette.primary,
  },
  textInputWrapper: {
    position: "relative",
    flex: 1,
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
  copyButton: {
    position: "absolute",
    right: 12,
    top: 80,
    padding: 6,
    color: ColorPalette.blueLight,
    borderRadius: 4,
  },
});
