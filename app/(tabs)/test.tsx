import AnimatedTouchableOpacity from "@/components/AnimatedTouchableOpacity";
import React, { useState } from "react";
import { View } from "react-native";

const App = () => {
  const [animate, setAnimate] = useState<boolean>(false);
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <AnimatedTouchableOpacity
        text={"Clickableeeeeee...."}
        animate={animate}
        onPress={() => {}}
        onLongPress={() => {
          setAnimate(true);
        }}
      />
    </View>
  );
};

export default App;
