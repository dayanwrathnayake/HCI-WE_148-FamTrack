import { StyleSheet, Text, View } from "react-native";

import { MemberInitialsAvatar } from "./MemberInitialsAvatar";

type ExpenseActivityRowProps = {
  initials: string;
  avatarColor: string;
  avatarTextColor: string;
  name: string;
  subtitle: string;
  amount: string;
  statusLabel: string;
  statusColor: string;
  statusBackground: string;
  showDivider?: boolean;
};

export function ExpenseActivityRow({
  initials,
  avatarColor,
  avatarTextColor,
  name,
  subtitle,
  amount,
  statusLabel,
  statusColor,
  statusBackground,
  showDivider = true,
}: ExpenseActivityRowProps) {
  return (
    <View style={[styles.row, showDivider && styles.divider]}>
      <MemberInitialsAvatar
        initials={initials}
        backgroundColor={avatarColor}
        textColor={avatarTextColor}
        size={34}
      />
      <View style={styles.textGroup}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.amountGroup}>
        <Text style={styles.amount}>{amount}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBackground }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f6",
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0e1116",
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "400",
    color: "#8a93a0",
  },
  amountGroup: {
    alignItems: "flex-end",
    gap: 4,
  },
  amount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0e1116",
  },
  statusBadge: {
    height: 18,
    borderRadius: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: "600",
  },
});
