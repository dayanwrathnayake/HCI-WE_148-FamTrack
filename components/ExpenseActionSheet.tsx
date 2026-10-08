import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { ExpenseAction } from "../utils/expenseActions";

export type ExpenseSheetOption = {
  action: ExpenseAction;
  label: string;
};

type ExpenseActionSheetProps = {
  visible: boolean;
  /** e.g. "Groceries · Rs 4,500 · paid by You" */
  title: string;
  options: ExpenseSheetOption[];
  onSelect: (action: ExpenseAction) => void;
  onClose: () => void;
};

// A small bottom sheet instead of Alert.alert, because an alert shows at most 3 buttons on Android
// and a Pending expense can have Approve, Edit and Decline.
export function ExpenseActionSheet({ visible, title, options, onSelect, onClose }: ExpenseActionSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          {options.map((option) => (
            <Pressable
              key={option.action}
              onPress={() => onSelect(option.action)}
              style={styles.option}
              accessibilityRole="button"
            >
              <Text style={[styles.optionText, option.action === "delete" && styles.optionTextDanger]}>
                {option.label}
              </Text>
            </Pressable>
          ))}

          <Pressable onPress={onClose} style={styles.cancelButton} accessibilityRole="button">
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
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
  title: {
    marginBottom: 8,
    fontSize: 13.5,
    fontWeight: "600",
    color: "#5d6673",
  },
  option: {
    height: 52,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f2f4",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0e1116",
  },
  optionTextDanger: {
    color: "#d93025",
  },
  cancelButton: {
    marginTop: 14,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f6f8",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5d6673",
  },
});
