import { ColorPalette } from "@/constants/Colors";
import Clipboard from "@react-native-clipboard/clipboard";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

export interface CopyButtonProps {
  style?: StyleProp<ViewStyle>;
  value: string | null;
}

export default function CopyButton({ style, value }: CopyButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.copyButton, style]}
      onPress={() => {
        if (value) {
          Clipboard.setString(value);
        }
      }}
    >
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
