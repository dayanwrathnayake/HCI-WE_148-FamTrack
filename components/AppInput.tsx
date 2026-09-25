import { useState } from "react";
import { Pressable, TextInput, View, type KeyboardTypeOptions } from "react-native";

import { Icon } from "./Icon";
import { colors } from "../constants/colors";
import type { IconName } from "../constants/icons";

type AppInputProps = {
  icon: IconName;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  isPassword?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

export function AppInput({
  icon,
  placeholder,
  value,
  onChangeText,
  isPassword,
  keyboardType,
  autoCapitalize = "none",
}: AppInputProps) {
  const [secure, setSecure] = useState(isPassword);
  const filled = value.length > 0;

  return (
    <View
      className="h-[52px] w-full flex-row items-center gap-3 rounded-[22px] bg-white px-4"
      style={{
        borderWidth: filled ? 2 : 1,
        borderColor: filled ? "#232323" : colors.textFaint,
      }}
    >
      <Icon name={icon} size={18} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        className="flex-1 text-[14px]"
        style={{ color: "#040c22" }}
      />
      {isPassword ? (
        <Pressable onPress={() => setSecure((s) => !s)} hitSlop={8}>
          <Icon name="eyeClosed" size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}
