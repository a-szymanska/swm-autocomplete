import { ColorPalette } from "@/constants/Colors";
import { MODES } from "@/constants/Modes";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectMode: (index: number) => void;
  selectedMode: string;
};

export default function ModeActionSheet({
  visible,
  onClose,
  onSelectMode,
  selectedMode,
}: Props) {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modal}>
              {MODES.map((mode, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.option]}
                  onPress={() => {
                    onSelectMode(index);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      mode.label === selectedMode && styles.selectedText,
                    ]}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    width: "98%",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: ColorPalette.primary,
    marginBottom: 12,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  optionText: {
    fontSize: 16,
    fontFamily: "AeonikRegular",
    color: "#333",
  },
  selectedText: {
    color: ColorPalette.primary,
    fontFamily: "AeonikMedium",
    fontWeight: "bold",
  },
  cancelButton: {
    paddingVertical: 20,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontFamily: "AeonikMedium",
    color: ColorPalette.seaBlueDark,
    fontWeight: "bold",
  },
});
