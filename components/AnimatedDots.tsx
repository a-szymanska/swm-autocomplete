import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type AnimatedDotsProps = {
  size: number;
  numberDots: number;
  jumpHeight: number;
  delay: number;
  color: string;
};

type AnimatedDotProps = {
  size: number;
  jumpHeight: number;
  delay: number;
  duration: number;
  color: string;
};

const AnimatedDot = ({
  size,
  jumpHeight,
  delay,
  duration,
  color,
}: AnimatedDotProps) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(
          jumpHeight,
          {
            duration: duration * 1.2,
            easing: Easing.out(Easing.linear),
          },
          () =>
            withTiming(0, {
              duration: duration,
              easing: Easing.in(Easing.ease),
            })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

export default function AnimatedDots({
  size,
  numberDots,
  jumpHeight,
  delay,
  color,
}: AnimatedDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: numberDots }).map((_, i) => (
        <AnimatedDot
          key={i}
          size={size}
          jumpHeight={jumpHeight}
          delay={i * delay}
          duration={delay * numberDots}
          color={color}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
    justifyContent: "center",
    padding: 20,
  },
});
