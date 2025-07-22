import { ColorPalette } from "@/constants/Colors";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface AnimatedTouchableOpacityProps {
  text: string;
  animate: boolean;
  disabled?: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export default function AnimatedTouchableOpacity({
  text,
  animate,
  disabled = false,
  onPress,
  onLongPress,
}: AnimatedTouchableOpacityProps) {
  const AnimatedLinearGradient =
    Animated.createAnimatedComponent(LinearGradient);
  const translateX = useSharedValue(0);

  React.useEffect(() => {
    translateX.value = withRepeat(withTiming(1, { duration: 3000 }), -1, false);
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 100 }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={[
        styles.chatResponse,
        styles.chatResponseReady,
        animate && {
          borderWidth: 2,
          borderColor: "#fff",
        },
        { overflow: "hidden" },
      ]}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {animate && (
        <AnimatedLinearGradient
          colors={[
            ColorPalette.seaBlueDark,
            ColorPalette.seaBlueMedium,
            ColorPalette.seaBlueDark,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, animatedStyle]}
        />
      )}
      <Text style={{ color: "#fff", zIndex: 1 }}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chatResponseContainer: {
    alignSelf: "flex-end",
    marginTop: 10,
  },
  chatResponse: {
    borderRadius: 24,
    minHeight: 50,
    padding: 16,
    marginVertical: 5,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  chatResponseGenerating: {
    backgroundColor: "#d1d6da",
  },
  chatResponseReady: {
    fontFamily: "regular",
    fontSize: 16,
    minWidth: 100,
    color: "#fff",
    backgroundColor: ColorPalette.seaBlueDark,
  },
});
