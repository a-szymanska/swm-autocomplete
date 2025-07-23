// import { ColorPalette } from "@/constants/Colors";
// import React, { useEffect, useRef } from "react";
// import { Animated, Easing, Image, StyleSheet, View } from "react-native";
// import Svg, { Path as SvgPath } from "react-native-svg";

// const AnimatedPath = Animated.createAnimatedComponent(SvgPath);

// export default function RunningLlama() {
//   const amplitude = 5;
//   const wavelength = 15;
//   const width = 300;
//   const height = 30;

//   const createPathForLlama = () => {
//     let path = `M 0 ${height / 2}`;
//     let x = 0;

//     while (x < width) {
//       const dx = wavelength;
//       const dy = Math.random() * amplitude * 2 - amplitude;
//       const controlX = x + dx / 2;
//       const controlY = height / 2 + dy;
//       const endX = x + dx;
//       const endY = height / 2;

//       path += ` Q ${controlX} ${controlY}, ${endX} ${endY}`;
//       x += dx;
//     }

//     return path;
//   };

//   const animatedValue = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     let animation: Animated.CompositeAnimation;
//     const startAnimation = () => {
//       animatedValue.setValue(0);
//       animation = Animated.loop(
//         Animated.timing(animatedValue, {
//           toValue: 1,
//           duration: 5000,
//           easing: Easing.quad,
//           useNativeDriver: false,
//         })
//       );
//       animation.start();
//     };

//     startAnimation();

//     return () => {
//       animation?.stop();
//     };
//   }, []);

//   //   const animatedStroke = animatedValue.interpolate({
//   //     inputRange: [0, 0.25, 1],
//   //     outputRange: [
//   //       "rgb(135, 204, 232)",
//   //       "rgb(40, 87, 218)",
//   //       "rgb(135, 204, 232)",
//   //     ],
//   //   });

//   return (
//     <View>
//       <Image
//         source={require("@/assets/images/llama.gif")}
//         style={styles.llama}
//       />
//       <Svg height="71" width="180">
//         <AnimatedPath
//           d={createPathForLlama()}
//           fill="none"
//           stroke={ColorPalette.seaBlueMedium}
//           strokeWidth={"1.6"}
//         />
//       </Svg>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   llama: {
//     height: 110,
//     width: 160,
//     position: "absolute",
//     left: 0,
//     bottom: 50,
//   },
// });

import { ColorPalette } from "@/constants/Colors";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  View,
} from "react-native";
import Svg, { Path as SvgPath } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(SvgPath);
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export default function RunningLlama() {
  const { width } = Dimensions.get("window");
  const amplitude = 5;
  const wavelength = 15;
  const segmentWidth = 4000;
  const height = 30;

  const translateX = useRef(new Animated.Value(0)).current;
  const [path, setPath] = useState<string | null>(null);

  const createPathForLlama = () => {
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
    const p1 = createPathForLlama();
    setPath(p1);

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
          height="71"
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
            stroke={ColorPalette.seaBlueMedium}
            strokeWidth={"1.6"}
          />
        </AnimatedSvg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  llama: {
    height: 110,
    width: 160,
    position: "absolute",
    left: 50,
    bottom: 70,
    zIndex: 2,
  },
});
