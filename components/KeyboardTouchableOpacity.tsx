import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";
import AnimatedDots from "./AnimatedDots";

export type KeyboardTouchableHintProps = {
  text: string | null;
  onPress: () => void;
  onLongPress: () => void;
};

export type KeyboardTouchableOpacityProps = {
  texts: string[];
  onPress: (text: string) => void;
  onLongPress: (text: string) => void;
};

function KeyboardTouchableHint({
  text,
  onPress,
  onLongPress,
}: KeyboardTouchableHintProps) {
  return (
    <View style={styles.halfBox}>
      {!!text ? (
        <TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
          <Text>{text}</Text>
        </TouchableOpacity>
      ) : (
        <AnimatedDots
          size={6}
          numberDots={3}
          jumpHeight={4}
          delay={750}
          color={"#fff"}
        />
      )}
    </View>
  );
}

export default function KeyboardTouchableOpacity({
  texts,
  onPress,
  onLongPress,
}: KeyboardTouchableOpacityProps) {
  const keyboard = useAnimatedKeyboard();
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  useDerivedValue(() => {
    runOnJS(setKeyboardHeight)(keyboard.height.value);
  }, [keyboard.height]);
  const hintAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -keyboard.height.value }],
      opacity: keyboardHeight > 0 ? 1 : 0,
    };
  });

  return (
    <Animated.View style={[styles.keyboardContainer, hintAnimatedStyle]}>
      {!texts.length ? (
        <View style={[styles.fullBox, { padding: 5, marginTop: 5 }]}>
          <AnimatedDots
            size={6}
            numberDots={3}
            jumpHeight={4}
            delay={750}
            color={"#fff"}
          />
        </View>
      ) : (
        <View style={styles.fullBox}>
          <KeyboardTouchableHint
            text={texts.length > 0 ? texts[0] : null}
            onPress={() => onPress(texts[0])}
            onLongPress={() => onLongPress(texts[0])}
          />
          <KeyboardTouchableHint
            text={texts.length > 1 ? texts[1] : null}
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
    backgroundColor: "#d1d6da",
  },
  fullBox: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  halfBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: "#fff",
  },
});
