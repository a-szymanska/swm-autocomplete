import { ColorPalette } from "@/constants/Colors";
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

function KeyboardTouchableText({
  text,
  onPress,
  onLongPress,
}: KeyboardTouchableTextProps) {
  const [backgroundColor, setBackgroudnColor] = useState<string>(
    ColorPalette.keyboardGray
  );
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => setBackgroudnColor(ColorPalette.gray)}
      onPressOut={() => setBackgroudnColor(ColorPalette.keyboardGray)}
      style={[styles.halfBox, { backgroundColor }]}
      activeOpacity={1}
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

export type AniamtedKeyboardTouchableTextProps = KeyboardTouchableTextProps & {
  setOnPressColor: (color: string) => void;
};
function AnimatedKeyboardTouchableText({
  text,
  onPress,
  onLongPress,
  setOnPressColor,
}: AniamtedKeyboardTouchableTextProps) {
  return (
    <View>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => setOnPressColor(ColorPalette.gray)}
        onPressOut={() => setOnPressColor(ColorPalette.keyboardGray)}
        activeOpacity={1}
        style={[styles.fullBox, { marginBottom: 5, marginTop: 10 }]}
      >
        <Text style={styles.fullBoxText}>{text}</Text>
      </TouchableOpacity>
    </View>
  );
}

// === Main Component ===
export type KeyboardTouchableOpacityProps = {
  texts: string[];
  selectedText: string | null;
  onPress: (text: string) => void;
  onLongPress: (text: string) => Promise<void> | void;
};

export default function KeyboardTouchableOpacity({
  texts,
  selectedText,
  onPress,
  onLongPress,
}: KeyboardTouchableOpacityProps) {
  const keyboard = useAnimatedKeyboard();
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  useDerivedValue(() => {
    runOnJS(setKeyboardHeight)(keyboard.height.value);
  }, [keyboard.height]);

  const [backgroundColor, setBackgroudnColor] = useState<string>(
    ColorPalette.keyboardGray
  );
  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -keyboard.height.value }],
      opacity: keyboardHeight > 0 ? 1 : 0,
    };
  });

  if (!texts.length) {
    return (
      <Animated.View style={[styles.keyboardContainer, textAnimatedStyle]}>
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

  return (
    <Animated.View
      style={[
        styles.keyboardContainer,
        styles.fullBox,
        textAnimatedStyle,
        { backgroundColor },
      ]}
    >
      {selectedText ? (
        <AnimatedKeyboardTouchableText
          text={selectedText}
          onPress={() => onPress(selectedText)}
          onLongPress={() => onLongPress(selectedText)}
          setOnPressColor={setBackgroudnColor}
        />
      ) : (
        <View style={styles.fullBox}>
          <KeyboardTouchableText
            text={texts[0] ?? null}
            onPress={() => onPress(texts[0])}
            onLongPress={() => onLongPress(texts[0])}
          />
          <KeyboardTouchableText
            text={texts[1] ?? null}
            onPress={() => onPress(texts[1])}
            onLongPress={() => onLongPress(texts[1])}
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    width: "100%",
    backgroundColor: ColorPalette.keyboardGray,
    overflow: "hidden",
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
  fullBoxText: {
    width: "95%",
    alignSelf: "center",
    textAlign: "center",
  },
});
