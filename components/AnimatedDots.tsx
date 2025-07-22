import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const PI2 = 2 * Math.PI;

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

export default function AnimatedDots({
  size,
  numberDots,
  jumpHeight,
  delay,
  color,
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
    <View style={styles.container}>
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
    gap: 8,
    alignItems: "flex-end",
    justifyContent: "center",
    padding: 10,
  },
});
