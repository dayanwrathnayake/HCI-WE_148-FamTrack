import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { MemberInitialsAvatar } from "./MemberInitialsAvatar";

type ExpenseTypeOption = {
  key: string;
  emoji: string;
  label: string;
};

const EXPENSE_TYPES: ExpenseTypeOption[] = [
  { key: "groceries", emoji: "🛒", label: "Groceries" },
  { key: "electricity", emoji: "💡", label: "Electricity" },
  { key: "transport", emoji: "🚗", label: "Transport" },
];

type PayerOption = {
  key: string;
  initials: string;
  avatarColor: string;
  avatarTextColor: string;
  name: string;
};

const PAYERS: PayerOption[] = [
  { key: "mum", initials: "MU", avatarColor: "#ffcfe0", avatarTextColor: "#8c2453", name: "Mum" },
  { key: "dad", initials: "DA", avatarColor: "#cde3ff", avatarTextColor: "#1b4c88", name: "Dad" },
  { key: "you", initials: "YO", avatarColor: "#ffd8a8", avatarTextColor: "#7a4b00", name: "You" },
];

type AddSharedExpenseModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function AddSharedExpenseModal({ visible, onClose }: AddSharedExpenseModalProps) {
  const [amount, setAmount] = useState("20,000");
  const [expenseType, setExpenseType] = useState("groceries");
  const [paidBy, setPaidBy] = useState("dad");

  const numericAmount = Number(amount.replace(/,/g, "")) || 0;
  const splitMembersCount = 3;
  const eachShare = numericAmount / splitMembersCount;

  // TODO: wire up once there's a real shared-expense data source to save to.
  const handleSaveExpense = () => onClose();
  // TODO: build a real custom-split screen.
  const handleChangeSplit = () => {};

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.title}>Add shared expense</Text>
              <Text style={styles.subtitle}>Counts against the family budget</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>AMOUNT</Text>
          <View style={styles.amountInputWrap}>
            <Text style={styles.amountPrefix}>Rs</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.fieldLabel}>EXPENSE TYPE</Text>
          <View style={styles.pillWrap}>
            {EXPENSE_TYPES.map((type) => {
              const active = expenseType === type.key;
              return (
                <Pressable
                  key={type.key}
                  onPress={() => setExpenseType(type.key)}
                  style={[styles.typePill, active && styles.typePillActive]}
                >
                  <Text style={[styles.typePillText, active && styles.typePillTextActive]}>
                    {type.emoji} {type.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable style={styles.addTypePill}>
              <Text style={styles.addTypeText}>+ Other</Text>
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>PAID BY</Text>
          <View style={styles.payerRow}>
            {PAYERS.map((payer) => {
              const active = paidBy === payer.key;
              return (
                <Pressable
                  key={payer.key}
                  onPress={() => setPaidBy(payer.key)}
                  style={[styles.payerChip, active && styles.payerChipActive]}
                >
                  <MemberInitialsAvatar
                    initials={payer.initials}
                    backgroundColor={payer.avatarColor}
                    textColor={payer.avatarTextColor}
                    size={24}
                  />
                  <Text style={[styles.payerName, active && styles.payerNameActive]}>
                    {payer.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.splitCard}>
            <View>
              <Text style={styles.splitTitle}>Split equally · {splitMembersCount} members</Text>
              <Text style={styles.splitSubtitle}>
                Rs {eachShare.toLocaleString("en-US", { maximumFractionDigits: 2 })} each
              </Text>
            </View>
            <Pressable onPress={handleChangeSplit} hitSlop={8}>
              <Text style={styles.changeLink}>Change</Text>
            </Pressable>
          </View>

          <View style={styles.actionsRow}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSaveExpense} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save expense</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(10,14,18,0.45)",
  },
  overlayDismiss: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  dragHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 3,
    backgroundColor: "#e1e5ea",
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTextGroup: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 17.5,
    fontWeight: "700",
    color: "#0e1116",
  },
  subtitle: {
    fontSize: 11.5,
    fontWeight: "400",
    color: "#8a93a0",
  },
  closeButton: {
    height: 30,
    width: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f6f8",
  },
  closeButtonText: {
    fontSize: 14.5,
    fontWeight: "500",
    color: "#5d6673",
  },
  fieldLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.76,
    color: "#5d6673",
  },
  amountInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 61,
    borderRadius: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "#ffffff",
  },
  amountPrefix: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "rgba(0,0,0,0.6)",
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
  },
  pillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typePill: {
    height: 34,
    borderRadius: 20,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1e5ea",
  },
  typePillActive: {
    backgroundColor: "#e8f8f0",
    borderColor: "#9de3c0",
  },
  typePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5d6673",
  },
  typePillTextActive: {
    color: "#00854b",
  },
  addTypePill: {
    height: 34,
    borderRadius: 20,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#c6ccd4",
    borderStyle: "dashed",
  },
  addTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5d6673",
  },
  payerRow: {
    flexDirection: "row",
    gap: 10,
  },
  payerChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1e5ea",
  },
  payerChipActive: {
    backgroundColor: "#e8f8f0",
    borderColor: "#00c46a",
  },
  payerName: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#5d6673",
  },
  payerNameActive: {
    color: "#00854b",
  },
  splitCard: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#f4f6f8",
  },
  splitTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0e1116",
  },
  splitSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "400",
    color: "#8a93a0",
  },
  changeLink: {
    fontSize: 12,
    fontWeight: "600",
    color: "#00a85c",
  },
  actionsRow: {
    marginTop: 20,
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d8dde3",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5d6673",
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1dcd9f",
    shadowColor: "#00c46a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#04240f",
  },
});
