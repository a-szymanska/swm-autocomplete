import LLMScreenWrapper from "@/components/AutoComplete";
import { ColorPalette } from "@/constants/Colors";
import { MODES } from "@/constants/Modes";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function App() {
  const [selectedMode, setSelectedMode] = useState<number | null>(null);

  return selectedMode !== null ? (
    <LLMScreenWrapper mode={selectedMode} />
  ) : (
    <View style={styles.container}>
      <View style={styles.helloMessageContainer}>
        <Image
          source={require("@/assets/images/hand.png")}
          style={styles.icon}
        />
        <Text style={styles.bottomHelloText}>Choose your writing style</Text>
      </View>
      <View style={styles.choiceList}>
        {MODES.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.button}
            onPress={() => setSelectedMode(item.id)}
          >
            <Text style={styles.buttonText}>{item.label}</Text>
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
    flexDirection: "row",
  },
  helloText: {
    fontFamily: "medium",
    fontSize: 30,
    color: ColorPalette.primary,
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: ColorPalette.seaBlueLight,
  },
  bottomHelloText: {
    fontFamily: "Nunito",
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
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito",
  },
});
