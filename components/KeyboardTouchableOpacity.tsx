import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";
import AnimatedDots from "./AnimatedDots";

export type KeyboardTouchableTextProps = {
  text: string | null;
  onPress: () => void;
  onLongPress: () => void;
};

export type KeyboardTouchableOpacityProps = {
  texts: string[];
  selectedText: string | null;
  onPress: (text: string) => void;
  onLongPress: (text: string) => Promise<void> | void;
};

function KeyboardTouchableText({
  text,
  onPress,
  onLongPress,
}: KeyboardTouchableTextProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.halfBox}
      disabled={!text}
    >
      {!!text ? (
        <View>
          <Text>{text}</Text>
        </View>
      ) : (
        <AnimatedDots
          size={6}
          numberDots={3}
          jumpHeight={2.5}
          delay={700}
          color={"#fff"}
        />
      )}
    </TouchableOpacity>
  );
}

type AnimatedKeyboardTouchableTextProps = KeyboardTouchableTextProps & {
  generating: boolean;
};

function AnimatedKeyboardTouchableText({
  text,
  onPress,
  onLongPress,
  generating,
}: AnimatedKeyboardTouchableTextProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.fullBox}
    >
      <View style={styles.groupBox}>
        <View style={styles.textDotsBox}>
          <Text>{text}</Text>
          {generating && (
            <AnimatedDots
              size={1.6}
              gap={4}
              numberDots={3}
              jumpHeight={0.6}
              delay={500}
              color={"#000"}
              style={{ marginTop: 7 }}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// === Main Component ===
export default function KeyboardTouchableOpacity({
  texts,
  selectedText,
  onPress,
  onLongPress,
}: KeyboardTouchableOpacityProps) {
  const keyboard = useAnimatedKeyboard();
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [generating, setGenerating] = useState<boolean>(false);

  useDerivedValue(() => {
    runOnJS(setKeyboardHeight)(keyboard.height.value);
  }, [keyboard.height]);

  const hintAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -keyboard.height.value }],
      opacity: keyboardHeight > 0 ? 1 : 0,
    };
  });

  const handleLongPress = async (text: string) => {
    setGenerating(true);
    try {
      await Promise.resolve(onLongPress(text));
    } finally {
      setGenerating(false);
    }
  };

  if (!texts.length) {
    return (
      <Animated.View style={[styles.keyboardContainer, hintAnimatedStyle]}>
        <View style={[styles.fullBox, { padding: 5, marginTop: 5 }]}>
          <AnimatedDots
            size={6}
            numberDots={3}
            jumpHeight={2.5}
            delay={700}
            color={"#fff"}
          />
        </View>
      </Animated.View>
    );
  }

  return selectedText ? (
    <Animated.View style={[styles.keyboardContainer, hintAnimatedStyle]}>
      <View style={styles.fullBox}>
        <AnimatedKeyboardTouchableText
          text={selectedText}
          onPress={() => onPress(selectedText)}
          onLongPress={() => handleLongPress(selectedText)}
          generating={generating}
        />
      </View>
    </Animated.View>
  ) : (
    <Animated.View style={[styles.keyboardContainer, hintAnimatedStyle]}>
      <View style={styles.fullBox}>
        <KeyboardTouchableText
          text={texts[0] ?? null}
          onPress={() => onPress(texts[0])}
          onLongPress={() => handleLongPress(texts[0])}
        />
        <KeyboardTouchableText
          text={texts[1] ?? null}
          onPress={() => onPress(texts[1])}
          onLongPress={() => handleLongPress(texts[1])}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#d1d6da",
  },
  fullBox: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
  halfBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#fff",
    padding: 5,
  },
  groupBox: {
    justifyContent: "center",
    alignItems: "center",
  },
  textDotsBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
});
