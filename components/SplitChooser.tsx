import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import {
  isSelected,
  toggleMember,
  validateSplitChoice,
  type SplitChoice,
} from "../utils/expenseSplit";
import { MemberInitialsAvatar } from "./MemberInitialsAvatar";

export type SplitChooserMember = {
  key: string;
  initials: string;
  avatarColor: string;
  avatarTextColor: string;
  name: string;
};

type SplitChooserProps = {
  members: SplitChooserMember[];
  /** What the expense has now. The chooser edits a local draft until Done. */
  initial: SplitChoice;
  /** Who owns the whole amount when it is not split, e.g. "yours" or "Mayee's". */
  ownerText: string;
  onApply: (choice: SplitChoice) => void;
  onCancel: () => void;
};

// Shown inside the Add Shared Expense sheet (not as a second modal, which iOS handles badly).
// Turn splitting off and only the payer bears the expense; turn it on and tick who shares it.
export function SplitChooser({ members, initial, ownerText, onApply, onCancel }: SplitChooserProps) {
  const [choice, setChoice] = useState<SplitChoice>(initial);
  const [error, setError] = useState<string | null>(null);

  const activeIds = members.map((member) => member.key);

  const handleDone = () => {
    const message = validateSplitChoice(choice, activeIds);
    if (message) {
      setError(message);
      return;
    }
    onApply(choice);
  };

  return (
    <View>
      <Text style={styles.title}>Split this expense</Text>
      <Text style={styles.subtitle}>Choose who shares the cost.</Text>

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={styles.switchTitle}>Split with others</Text>
          <Text style={styles.switchHint}>
            {choice.enabled
              ? "Shared equally between the people ticked below."
              : `Not split: the whole amount is ${ownerText}.`}
          </Text>
        </View>
        <Switch
          value={choice.enabled}
          onValueChange={(value) => {
            setError(null);
            setChoice((prev) => ({ ...prev, enabled: value }));
          }}
          trackColor={{ false: "#d8dde3", true: "#00c46a" }}
          thumbColor="#ffffff"
        />
      </View>

      {choice.enabled ? (
        <View style={styles.memberList}>
          {members.map((member) => {
            const ticked = isSelected(choice, member.key);
            return (
              <Pressable
                key={member.key}
                onPress={() => {
                  setError(null);
                  setChoice((prev) => toggleMember(prev, member.key));
                }}
                style={[styles.memberRow, ticked && styles.memberRowActive]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: ticked }}
              >
                <MemberInitialsAvatar
                  initials={member.initials}
                  backgroundColor={member.avatarColor}
                  textColor={member.avatarTextColor}
                  size={28}
                />
                <Text style={styles.memberName}>{member.name}</Text>
                <View style={[styles.checkbox, ticked && styles.checkboxActive]}>
                  {ticked ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actionsRow}>
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Back</Text>
        </Pressable>
        <Pressable onPress={handleDone} style={styles.doneButton}>
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17.5,
    fontWeight: "700",
    color: "#0e1116",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11.5,
    color: "#8a93a0",
  },
  switchRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#f4f6f8",
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0e1116",
  },
  switchHint: {
    fontSize: 11.5,
    color: "#8a93a0",
  },
  memberList: {
    marginTop: 12,
    gap: 8,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1e5ea",
  },
  memberRowActive: {
    backgroundColor: "#e8f8f0",
    borderColor: "#00c46a",
  },
  memberName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#0e1116",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#c6ccd4",
    backgroundColor: "#ffffff",
  },
  checkboxActive: {
    borderColor: "#00c46a",
    backgroundColor: "#00c46a",
  },
  checkmark: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
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
  doneButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1dcd9f",
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#04240f",
  },
});
