import { ColorPalette } from "@/constants/Colors";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

export interface CopyButtonProps {
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
}

export default function CopyButton({ style, onPress }: CopyButtonProps) {
  return (
    <TouchableOpacity style={[styles.copyButton, style]} onPress={onPress}>
      <Icon name="copy-outline" size={20} color={"#fff"} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  copyButton: {
    color: ColorPalette.blueLight,
    borderRadius: 4,
  },
});
