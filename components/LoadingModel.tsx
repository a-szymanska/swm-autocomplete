import { ColorPalette } from "@/constants/Colors";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Text,
  StyleSheet,
  View,
} from "react-native";
import Svg, { Path as SvgPath } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(SvgPath);
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export function RunningLlama() {
  const { width } = Dimensions.get("window");
  const amplitude = 5;
  const wavelength = 15;
  const segmentWidth = 4000;
  const height = 30;

  const translateX = useRef(new Animated.Value(0)).current;
  const [path, setPath] = useState<string | null>(null);

  const createPath = () => {
    let p = `M 0 ${height / 2}`;
    let x = 0;

    while (x < segmentWidth) {
      const dx = wavelength;
      const dy = Math.random() * amplitude * 2 - amplitude;
      const controlX = x + dx / 2;
      const controlY = height / 2 + dy;
      const endX = x + dx;
      const endY = height / 2;

      p += ` Q ${controlX} ${controlY}, ${endX} ${endY}`;
      x += dx;
    }

    return p;
  };

  useEffect(() => {
    const path = createPath();
    setPath(path);

    Animated.loop(
      Animated.timing(translateX, {
        toValue: -segmentWidth + width,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  return (
    <View style={{ height: 100 }}>
      <Image
        source={require("@/assets/images/llama.gif")}
        style={styles.llama}
      />

      {path && (
        <AnimatedSvg
          height="72"
          width={segmentWidth * 2}
          style={{
            transform: [{ translateX }],
            position: "absolute",
            bottom: 20,
          }}
        >
          <AnimatedPath
            d={path}
            fill="none"
            stroke={ColorPalette.seaBlueDark}
            strokeWidth={"1.8"}
          />
        </AnimatedSvg>
      )}
    </View>
  );
}

interface ModelProps {
  model: {
    isReady: boolean;
    downloadProgress: number;
  };
}

export default function LoadingModel({ model }: ModelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {model.downloadProgress
          ? `Loading the model ${(model.downloadProgress * 100).toFixed(0)}%`
          : `Loading the model`}
      </Text>
      <View style={styles.llamaContainer}>
        <RunningLlama />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  text: {
    color: "black",
    fontSize: 18,
    fontFamily: "AeonikRegular",
  },
  llamaContainer: {
    position: "absolute",
    bottom: 50,
    left: 80,
  },
  llama: {
    height: 110,
    width: 160,
    position: "absolute",
    left: 50,
    bottom: 70,
    zIndex: 2,
  },
});
