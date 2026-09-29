import { StyleSheet, Text, View } from "react-native";

type SharedActivityRowProps = {
  emoji: string;
  iconBackground: string;
  name: string;
  subtitle: string;
  amount: string;
  showDivider?: boolean;
};

export function SharedActivityRow({
  emoji,
  iconBackground,
  name,
  subtitle,
  amount,
  showDivider = true,
}: SharedActivityRowProps) {
  return (
    <View style={[styles.row, showDivider && styles.divider]}>
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <View style={styles.textGroup}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      <Text style={styles.amount}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f6",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    height: 30,
    width: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 14,
  },
  textGroup: {
    gap: 1,
  },
  name: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0e1116",
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "500",
    color: "#8a93a0",
  },
  amount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0e1116",
  },
});
