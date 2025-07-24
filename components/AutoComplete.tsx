// TODO podpowiedzi na klawiaturze
// TODO generowanie w pętli??
// TODO rozwijanie do 2 zdan
// TODO potestować modele
// TODO prompt

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
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";
import ModeActionSheet from "./ActionSheet";
import CopyButton from "./CopyButton";
import KeyboardTouchableOpacity from "./KeyboardTouchableOpacity";
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
  const generationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const selectedHintRef = useRef<string | null>(null);

  const [userInput, setUserInput] = useState<string>("");
  const [modeId, setModeId] = useState<number>(mode);
  const [responses, setResponses] = useState<string[]>([]);

  const [showModeModal, setShowModeModal] = useState(false);
  const changeMode = () => setShowModeModal(true);

  const keyboard = useAnimatedKeyboard();
  const textInputAnimatedStyle = useAnimatedStyle(() => {
    const maxHeight = 600;
    const height = maxHeight - keyboard.height.value;
    return {
      height: height,
    };
  });

  const llm = useLLM({
    modelSource: LLAMA3_2_1B,
    tokenizerSource: LLAMA3_2_1B_TOKENIZER,
    tokenizerConfigSource: LLAMA3_2_TOKENIZER_CONFIG,
  });

  function cleanResponse(response: string) {
    console.log("\tBefore:", response);

    const input = userInput.trim().toLowerCase();
    let clean = response.trim();

    if (!/[.?!]$/.test(input)) {
      clean = clean.toLowerCase();
    }

    const inputWords = input.split(/\s+/);
    const responseWords = clean.split(/\s+/);

    let overlapIndex = 0;
    let matchedPhrase = "";

    for (let i = 0; i < responseWords.length; i++) {
      const phrase = responseWords.slice(0, i + 1).join(" ");
      if (input.endsWith(phrase)) {
        overlapIndex = i + 1;
        matchedPhrase = phrase;
      }
    }

    console.log("\tMatched:", matchedPhrase);

    const trimmedResponseWords = responseWords.slice(overlapIndex);
    const finalWords = trimmedResponseWords.slice(0, 3);
    const finalResponse = finalWords.join(" ");

    console.log("\tAfter:", finalResponse);
    return finalResponse;
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
      console.log(`Hint for "${input}": "${llm.response}"`);
      return cleanResponse(llm.response);
    } catch (error) {
      console.error("Generation error:", error);
    }
  };

  useEffect(() => {
    if (!userInput || responses.length >= NUMBER_HINTS) return;

    if (generationIntervalRef.current) {
      clearInterval(generationIntervalRef.current);
    }

    generationIntervalRef.current = setInterval(async () => {
      const response = await generateResponse(userInput);
      if (response && !responses.includes(response)) {
        setResponses((prev) => [...prev, response]);
      }
    }, 500);
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
              style={styles.icon}
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
              <Text
                style={{ color: ColorPalette.primary, fontFamily: "Nunito" }}
              >
                {MODES[modeId].label}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.textInputWrapper}>
            <Animated.View
              style={[styles.textInputContainer, textInputAnimatedStyle]}
            >
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
                  selectedHintRef.current = null;
                  if (generationIntervalRef.current) {
                    clearInterval(generationIntervalRef.current);
                    generationIntervalRef.current = null;
                  }
                }}
                value={userInput}
              />
              <CopyButton
                style={{
                  padding: 20,
                  position: "absolute",
                  top: 0,
                  right: 0,
                }}
                onPress={() => {
                  if (userInput) {
                    Clipboard.setString(userInput);
                  }
                }}
              />
            </Animated.View>
          </View>
        </View>
        <ModeActionSheet
          visible={showModeModal}
          onClose={() => setShowModeModal(false)}
          onSelectMode={(id) => setModeId(id)}
          selectedModeIndex={modeId}
        />
        <KeyboardTouchableOpacity
          texts={responses}
          onPress={(text: string) => {
            setUserInput((prev) => prev.trim() + " " + text);
            setResponses([]);
          }}
          onLongPress={() => {}}
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
  icon: {
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
    fontFamily: "Nunito",
    fontWeight: 600,
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
    color: ColorPalette.primary,
  },
  headerStyleText: {
    fontFamily: "Nunito",
    fontSize: 16,
    lineHeight: 28,
    color: ColorPalette.primary,
    marginRight: 10,
    marginTop: 4,
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
    fontFamily: "Nunito",
    fontSize: 16,
    padding: 16,
    height: 400,
    maxHeight: 400,
    width: "90%",
    color: "#fff",
    alignSelf: "flex-start",
  },
});
