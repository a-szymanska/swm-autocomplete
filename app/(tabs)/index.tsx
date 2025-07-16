import LLMScreenWrapper from "@/components/AutoCompleter";
import { ColorPalette } from "@/constants/Colors";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
const MODES = ["casual", "formal", "academic"];

export default function App() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  return selectedMode ? (
    <LLMScreenWrapper mode={selectedMode} />
  ) : (
    <View style={styles.container}>
      <View style={styles.helloMessageContainer}>
        <Text style={styles.helloText}>Hello! 👋</Text>
        <Text style={styles.bottomHelloText}>Choose your writing style</Text>
      </View>
      <View style={styles.choiceList}>
        {MODES.map((item) => (
          <TouchableOpacity
            key={item}
            style={styles.button}
            onPress={() => setSelectedMode(item)}
          >
            <Text style={styles.buttonText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    alignItems: "center",
  },
  helloMessageContainer: {
    alignItems: "center",
    marginBottom: 20,
    top: 50,
  },
  helloText: {
    fontFamily: "medium",
    fontSize: 30,
    color: ColorPalette.primary,
  },
  bottomHelloText: {
    fontFamily: "regular",
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
    color: ColorPalette.primary,
  },
  choiceList: {
    width: "80%",
    marginTop: 120,
  },
  button: {
    backgroundColor: ColorPalette.primary,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "regular",
  },
});
