import React, { useEffect } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const PI2 = 2 * Math.PI;

type AnimatedDotProps = {
  size: number;
  jumpHeight: number;
  color: string;
  phase: number;
  clock: Animated.SharedValue<number>;
};

const AnimatedDot = ({
  size,
  jumpHeight,
  color,
  phase,
  clock,
}: AnimatedDotProps) => {
  const sine = useDerivedValue(() => {
    return Math.sin(clock.value * PI2 + phase);
  });

  const translateY = useDerivedValue(() => {
    return sine.value * -jumpHeight;
  });

  const scale = useDerivedValue(() => {
    return 1 + sine.value * 0.2;
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
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

type AnimatedDotsProps = {
  size: number;
  gap?: number;
  numberDots: number;
  jumpHeight: number;
  delay: number;
  color: string;
  style?: StyleProp<ViewStyle>;
};

export default function AnimatedDots({
  size,
  gap = 8,
  numberDots,
  jumpHeight,
  delay,
  color,
  style,
}: AnimatedDotsProps) {
  const clock = useSharedValue(0);

  useEffect(() => {
    clock.value = withRepeat(
      withTiming(1, {
        duration: delay * numberDots,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  return (
    <View style={[styles.container, { gap }, style]}>
      {Array.from({ length: numberDots }).map((_, i) => {
        const phaseShift = (i / numberDots) * PI2;
        return (
          <AnimatedDot
            key={i}
            size={size}
            jumpHeight={jumpHeight}
            color={color}
            phase={phaseShift}
            clock={clock}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: 5,
  },
});
