import { ColorPalette } from "@/constants/Colors";
import {
  modelSource,
  tokenizerConfigSource,
  tokenizerSource,
} from "@/constants/Model";
import { MODES } from "@/constants/Modes";
import { systemPrompt } from "@/constants/Prompt";
import { cleanResponse, parseResponse } from "@/utils/functions";
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
import { Message, useLLM } from "react-native-executorch";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";
import ModeActionSheet from "./ActionSheet";
import CopyButton from "./CopyButton";
import KeyboardTouchableOpacity from "./KeyboardTouchable";
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

  const [userInput, setUserInput] = useState<string>("");
  const [modeId, setModeId] = useState<number>(mode);
  const [responses, setResponses] = useState<string[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);

  const [showModeModal, setShowModeModal] = useState(false);
  const changeMode = () => setShowModeModal(true);

  const keyboard = useAnimatedKeyboard();
  const textInputAnimatedStyle = useAnimatedStyle(() => {
    const maxHeight = 525;
    const height = maxHeight - keyboard.height.value;
    return {
      height: height,
    };
  });

  const llm = useLLM({
    modelSource,
    tokenizerSource,
    tokenizerConfigSource,
  });

  const { configure } = llm;
  useEffect(() => {
    const prompt = systemPrompt({ mode: MODES[modeId].label });
    configure({
      chatConfig: {
        systemPrompt: prompt,
      },
    });
  }, [configure, modeId]);

  const generateResponse = async (
    input: string,
    assistantInput: string | null = null,
    num_words = 3
  ) => {
    input = input.trim();
    if (!input || !llm.isReady || llm.isGenerating) return "";

    try {
      llm.deleteMessage(0);
      await llm.sendMessage(input + assistantInput);
      const response = cleanResponse(
        llm.response,
        assistantInput ? assistantInput : input,
        num_words
      );
      return response;
    } catch (error) {
      console.error("Generation error:", error);
      return null;
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
    }, 250);
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
              source={require("@/assets/images/llama_head.png")}
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
                style={{
                  color: ColorPalette.primary,
                  fontFamily: "AeonikRegular",
                }}
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
                  setSelectedResponse(null);
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
                value={userInput}
              />
            </Animated.View>
            {responses.length > 0 && (
              <Text style={styles.instructionText}>
                {selectedResponse && selectedResponse.split(/\s+/).length > 15
                  ? "The hint is already long - click to accept it or start typing."
                  : "Accept hint on click, develop it on long click"}
              </Text>
            )}
          </View>
        </View>
        <ModeActionSheet
          visible={showModeModal}
          onClose={() => setShowModeModal(false)}
          onSelectMode={(id) => setModeId(id)}
          selectedMode={MODES[modeId].label}
        />
        <KeyboardTouchableOpacity
          texts={responses}
          selectedText={selectedResponse}
          onPress={(text: string) => {
            setSelectedResponse(null);
            setUserInput((prev) => prev.trim() + " " + text);
            setResponses([]);
          }}
          onLongPress={async (hint: string) => {
            if (responses.length < NUMBER_HINTS || !hint) {
              return;
            }
            if (hint !== selectedResponse) {
              setSelectedResponse(hint);
            }
            const n_words = hint.trim().split(/\s+/).filter(Boolean).length;
            if (n_words > 15) {
              // Limit for length of hint
              return;
            }
            try {
              llm.interrupt();
              const response = await generateResponse(userInput.trim(), hint);
              if (response) {
                setSelectedResponse(hint.trim() + " " + response);
              }
            } catch (error) {
              console.error("Error on long press:", error);
            }
          }}
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
    alignSelf: "flex-start",
    marginTop: 100,
  },
  bottomContainer: {
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerText: {
    fontFamily: "AeonikRegular",
    fontWeight: 600,
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
    color: ColorPalette.primary,
  },
  headerStyleText: {
    fontFamily: "AeonikRegular",
    fontSize: 16,
    lineHeight: 28,
    color: ColorPalette.primary,
    marginRight: 10,
    marginTop: 4,
  },
  instructionText: {
    fontFamily: "AeonikRegular",
    color: ColorPalette.primary,
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
    fontFamily: "AeonikRegular",
    fontSize: 16,
    padding: 16,
    height: 400,
    maxHeight: 400,
    width: "90%",
    color: "#fff",
    alignSelf: "flex-start",
  },
});
