import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { ExpenseCategoryId } from "../types/models";
import { useExpenses } from "../context/ExpenseContext";
import { useFamily } from "../context/FamilyContext";
import { getExpenseErrorMessage } from "../services/expenseService";
import { formatAmountInput, parseBudgetAmount } from "../utils/budget";
import { formatExpenseDate, getEqualShare } from "../utils/expenses";
import { getAvatarPalette, getInitials } from "../utils/members";
import { MemberInitialsAvatar } from "./MemberInitialsAvatar";

type ExpenseTypeOption = {
  key: string;
  emoji: string;
  label: string;
  /** The canonical category this type is saved as. */
  categoryId: ExpenseCategoryId;
};

// Electricity is a bill; "+ Other" saves as the Other category.
const EXPENSE_TYPES: ExpenseTypeOption[] = [
  { key: "groceries", emoji: "🛒", label: "Groceries", categoryId: "groceries" },
  { key: "electricity", emoji: "💡", label: "Electricity", categoryId: "bills" },
  { key: "transport", emoji: "🚗", label: "Transport", categoryId: "transport" },
];
const OTHER_TYPE_KEY = "other";

type AddSharedExpenseModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function AddSharedExpenseModal({ visible, onClose }: AddSharedExpenseModalProps) {
  const { activeMembers, currentMember } = useFamily();
  const { addExpense, permission } = useExpenses();

  const [amount, setAmount] = useState("");
  const [expenseType, setExpenseType] = useState("groceries");
  const [paidByChoice, setPaidByChoice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Nobody chosen yet means the signed-in user.
  const paidBy = paidByChoice ?? currentMember?.id ?? null;

  const payers = useMemo(
    () =>
      activeMembers.map((member) => {
        const palette = getAvatarPalette(member.id);
        return {
          key: member.id,
          initials: getInitials(member.displayName),
          avatarColor: palette.background,
          avatarTextColor: palette.text,
          name: member.id === currentMember?.id ? "You" : member.displayName,
        };
      }),
    [activeMembers, currentMember],
  );

  const numericAmount = parseBudgetAmount(amount) ?? 0;
  // Shared equally between everyone in the family. Each share is derived, never stored.
  const splitMembersCount = activeMembers.length;
  const eachShare = getEqualShare(numericAmount, splitMembersCount);
  const canSave = permission.allowed && numericAmount > 0 && !saving;

  const resetForm = () => {
    setAmount("");
    setExpenseType("groceries");
    setPaidByChoice(null);
    setErrorText(null);
  };

  const handleClose = () => {
    if (saving) return;
    resetForm();
    onClose();
  };

  const handleSaveExpense = async () => {
    if (!canSave) return;
    const categoryId: ExpenseCategoryId =
      expenseType === OTHER_TYPE_KEY
        ? "other"
        : (EXPENSE_TYPES.find((type) => type.key === expenseType)?.categoryId ?? "other");

    setErrorText(null);
    setSaving(true);
    try {
      // Everything goes through the ONE expense backend (ExpenseContext -> expenseService).
      await addExpense({
        categoryId,
        amountText: amount,
        dateText: formatExpenseDate(new Date()),
        paidBy,
        splitAmong: [], // everyone, equally
        note: "",
      });
      resetForm();
      onClose();
    } catch (error) {
      setErrorText(getExpenseErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };
  // TODO: build a real custom-split screen.
  const handleChangeSplit = () => {};

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.title}>Add shared expense</Text>
              <Text style={styles.subtitle}>Counts against the family budget</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={8}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>AMOUNT</Text>
          <View style={styles.amountInputWrap}>
            <Text style={styles.amountPrefix}>Rs</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(text) => setAmount(formatAmountInput(text))}
              placeholder="0"
              placeholderTextColor="#a9b1bb"
              keyboardType="number-pad"
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
            <Pressable
              onPress={() => setExpenseType(OTHER_TYPE_KEY)}
              style={expenseType === OTHER_TYPE_KEY ? [styles.typePill, styles.typePillActive] : styles.addTypePill}
            >
              <Text style={expenseType === OTHER_TYPE_KEY ? [styles.typePillText, styles.typePillTextActive] : styles.addTypeText}>
                + Other
              </Text>
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>PAID BY</Text>
          <View style={styles.payerRow}>
            {payers.map((payer) => {
              const active = paidBy === payer.key;
              return (
                <Pressable
                  key={payer.key}
                  onPress={() => setPaidByChoice(payer.key)}
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

          {!permission.allowed ? (
            <Text style={styles.errorText}>{permission.reason}</Text>
          ) : permission.pending ? (
            <Text style={styles.noteText}>Your expense will be sent to the family admin for approval.</Text>
          ) : null}
          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

          <View style={styles.actionsRow}>
            <Pressable onPress={handleClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSaveExpense}
              disabled={!canSave}
              style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            >
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
    flexWrap: "wrap",
    gap: 10,
  },
  noteText: {
    marginTop: 12,
    fontSize: 12,
    color: "#8a93a0",
  },
  errorText: {
    marginTop: 12,
    fontSize: 12,
    color: "#c2410c",
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  payerChip: {
    flex: 1,
    minWidth: 96,
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
