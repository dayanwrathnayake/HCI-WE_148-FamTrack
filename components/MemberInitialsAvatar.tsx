import { StyleSheet, Text, View } from "react-native";

type MemberInitialsAvatarProps = {
  initials: string;
  backgroundColor: string;
  textColor?: string;
  size?: number;
};

export function MemberInitialsAvatar({
  initials,
  backgroundColor,
  textColor = "#ffffff",
  size = 32,
}: MemberInitialsAvatarProps) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.3125, color: textColor }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontWeight: "700",
  },
});
