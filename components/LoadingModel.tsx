import { StyleSheet, View } from "react-native";
import Spinner from "react-native-loading-spinner-overlay";

interface ModelProps {
  model: {
    isReady: boolean;
    downloadProgress: number;
  };
}

export default function LoadingModel({ model }: ModelProps) {
  return (
    <View style={styles.container}>
      <Spinner
        visible={!model.isReady}
        textContent={
          model.downloadProgress
            ? `Loading the model ${(model.downloadProgress * 100).toFixed(0)} %`
            : `Loading the model`
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    flexDirection: "column",
  },
});
