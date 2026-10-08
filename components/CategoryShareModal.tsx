import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { BUDGET_CATEGORIES, getCategoryDefinition } from "../constants/categories";
import type { CategoryId, CategoryShares } from "../types/models";
import { getExplicitTotal, getUnusedCategoryIds, validateSharePercentage } from "../utils/categories";

// Edits ONE category's share of the monthly budget. It only reports the change to the form
// (a local draft); nothing is saved until the screen's "Save Changes" button is pressed.
// "Other" can never be added or edited here: it is always whatever the other categories leave.

export type CategoryShareMode = { kind: "edit"; id: CategoryId } | { kind: "add" };

type CategoryShareModalProps = {
  mode: CategoryShareMode;
  /** The draft shares currently on the form. */
  shares: CategoryShares;
  onClose: () => void;
  onApply: (id: CategoryId, percentage: number) => void;
  onRemove: (id: CategoryId) => void;
};

// Mount this only while it is needed: its state starts fresh each time it opens.
export function CategoryShareModal({ mode, shares, onClose, onApply, onRemove }: CategoryShareModalProps) {
  const isEdit = mode.kind === "edit";
  const [selectedId, setSelectedId] = useState<CategoryId | null>(isEdit ? mode.id : null);
  const [text, setText] = useState(isEdit ? String(shares[mode.id] ?? "") : "");
  const [error, setError] = useState<string | null>(null);

  const unusedIds = getUnusedCategoryIds(shares);
  const selected = selectedId ? getCategoryDefinition(selectedId) : null;

  // How much of the 100% is free for the selected category: everything the OTHER categories leave.
  const totalWithoutSelected = getExplicitTotal(shares) - (selectedId ? (shares[selectedId] ?? 0) : 0);
  const maxAllowed = 100 - totalWithoutSelected;
  const typed = /^\d+$/.test(text.trim()) ? Number(text.trim()) : null;
  const otherAfter = typed !== null && typed >= 1 && typed <= maxAllowed ? maxAllowed - typed : null;

  const handleApply = () => {
    if (!selectedId) {
      setError("Choose a category first.");
      return;
    }
    const message = validateSharePercentage(text, maxAllowed);
    if (message) {
      setError(message);
      return;
    }
    onApply(selectedId, Number(text.trim()));
  };

  const canPickNothing = !isEdit && unusedIds.length === 0;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={styles.overlayDismiss} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.title}>{isEdit && selected ? `${selected.emoji} ${selected.label}` : "Add category"}</Text>
              <Text style={styles.subtitle}>
                {isEdit ? "Share of this month's budget" : "Pick a category and set its share"}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {!isEdit ? (
            <>
              <Text style={styles.fieldLabel}>CATEGORY</Text>
              {canPickNothing ? (
                <Text style={styles.noteText}>Every category has already been added.</Text>
              ) : (
                <View style={styles.pillWrap}>
                  {BUDGET_CATEGORIES.filter((category) => unusedIds.includes(category.id)).map((category) => {
                    const active = selectedId === category.id;
                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => {
                          setSelectedId(category.id);
                          setError(null);
                        }}
                        style={[styles.optionPill, active && styles.optionPillActive]}
                      >
                        <Text style={[styles.optionPillText, active && styles.optionPillTextActive]}>
                          {category.emoji} {category.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </>
          ) : null}

          {!canPickNothing ? (
            <>
              <Text style={styles.fieldLabel}>SHARE OF BUDGET</Text>
              <View style={styles.percentInputWrap}>
                <TextInput
                  style={styles.percentInput}
                  value={text}
                  onChangeText={(value) => {
                    setText(value.replace(/\D/g, "").slice(0, 3));
                    setError(null);
                  }}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#a9b1bb"
                  maxLength={3}
                />
                <Text style={styles.percentSuffix}>%</Text>
              </View>
              <Text style={styles.noteText}>
                {selectedId === null
                  ? `${100 - getExplicitTotal(shares)}% of the budget is still unassigned.`
                  : otherAfter !== null
                    ? `Other will be ${otherAfter}%. Up to ${maxAllowed}% is available here.`
                    : `Up to ${maxAllowed}% is available here. The rest goes to Other.`}
              </Text>
            </>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actionsRow}>
            {isEdit ? (
              <Pressable onPress={() => selectedId && onRemove(selectedId)} style={styles.removeButton}>
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            ) : (
              <Pressable onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleApply}
              disabled={canPickNothing}
              style={[styles.saveButton, canPickNothing && styles.saveButtonDisabled]}
            >
              <Text style={styles.saveButtonText}>{isEdit ? "Apply" : "Add"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  pillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionPill: {
    height: 36,
    borderRadius: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1e5ea",
  },
  optionPillActive: {
    backgroundColor: "#e8f8f0",
    borderColor: "#9de3c0",
  },
  optionPillText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#5d6673",
  },
  optionPillTextActive: {
    color: "#00854b",
  },
  percentInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#00c46a",
    backgroundColor: "#f7f9fa",
  },
  percentInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#0e1116",
  },
  percentSuffix: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8a93a0",
  },
  noteText: {
    marginTop: 8,
    fontSize: 11.5,
    fontWeight: "400",
    color: "#8a93a0",
  },
  errorText: {
    marginTop: 12,
    fontSize: 12,
    color: "#c2410c",
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
  removeButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f3c5b3",
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#c2410c",
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
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#04240f",
  },
});
