import { ColorPalette } from "@/constants/Colors";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

import LinearGradient from "react-native-linear-gradient";
// import Animated from "react-native-reanimated";

export type AnimatedTouchableOpacityProps = {
  backgroundColor?: string;
  color1?: string;
  color2?: string;
  delay?: number;
  text: string;
  animate: boolean;
  disabled?: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

const TEXT_PADDING = 16;
const SCREEN_WIDTH = Dimensions.get("window").width;
const MAX_WIDTH = SCREEN_WIDTH * 0.9;

const AnimatedTouchableOpacity: React.FC<AnimatedTouchableOpacityProps> = ({
  backgroundColor = ColorPalette.seaBlueDark,
  color1 = ColorPalette.primary,
  delay = 3000,
  text,
  animate,
  disabled = false,
  onPress,
  onLongPress,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [textSize, setTextSize] = useState({ width: 0, height: 0 });
  const prevTextRef = useRef<string | null>(null);

  const handleTextLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (!animate && (width !== textSize.width || height !== textSize.height)) {
      setTextSize({ width, height });
    }
  };

  useEffect(() => {
    let animation: Animated.CompositeAnimation;
    const startAnimation = () => {
      animatedValue.setValue(0);
      animation = Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: delay,
          easing: Easing.quad,
          useNativeDriver: true,
        })
      );
      animation.start();
    };

    startAnimation();

    return () => {
      animation?.stop();
    };
  }, [text, delay]);

  useEffect(() => {
    if (text !== prevTextRef.current) {
      prevTextRef.current = text;
      console.log(prevTextRef.current);
    }
  }, [text]);

  const rotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "540deg"],
  });

  const animatedBackgroundColor = animatedValue.interpolate({
    inputRange: [0, 0.5, 0.75, 1],
    outputRange: [
      "rgb(135, 204, 232)",
      "rgb(184, 161, 212)",
      "rgb(187, 189, 192)",
      "rgb(135, 204, 232)",
    ],
  });

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: textSize.width + 1,
          height: textSize.height + 1,
          backgroundColor,
        },
        animate && { borderWidth: 2, borderColor: "#fff" },
      ]}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      {animate && (
        <>
          <Animated.View
            style={[
              {
                position: "absolute",
                width: textSize.width * 1.5,
                height: textSize.width * 1.5,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: animatedBackgroundColor,
                transform: [{ rotate }],
              },
            ]}
          >
            <LinearGradient
              colors={[`${color1}20`, `${color1}20`, `${color1}80`, color1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: textSize.width / 2,
              }}
            />
          </Animated.View>
        </>
      )}
      <Text onLayout={handleTextLayout} style={styles.text}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 24,
    marginBottom: 10,
  },
  animatedView: {
    position: "absolute",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    padding: TEXT_PADDING,
    maxWidth: MAX_WIDTH - TEXT_PADDING,
  },
});

export default AnimatedTouchableOpacity;
