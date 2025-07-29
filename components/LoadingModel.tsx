import { StyleSheet, Text, View } from "react-native";
import RunningLlama from "./Llama";

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
    fontFamily: "Nunito",
  },
  llamaContainer: {
    position: "absolute",
    bottom: 50,
    left: 80,
  },
});
