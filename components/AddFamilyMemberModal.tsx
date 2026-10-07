import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "../constants/colors";
import { useFamily } from "../context/FamilyContext";
import { getInviteErrorMessage } from "../services/familyService";

type MemberType = "Parent" | "Child" | "Other";
const MEMBER_TYPES: MemberType[] = ["Parent", "Child", "Other"];

type AddFamilyMemberModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function AddFamilyMemberModal({ visible, onClose: closeModal }: AddFamilyMemberModalProps) {
  const [name, setName] = useState("");
  const [memberType, setMemberType] = useState<MemberType>("Parent");
  const [contact, setContact] = useState("");
  const [canAddExpenses, setCanAddExpenses] = useState(true);

  const { inviteMember, isAdmin } = useFamily();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Every close path (overlay, X, Cancel, Android back) goes through here.
  const onClose = () => {
    if (submitting) return;
    setError(null);
    closeModal();
  };

  // Creates a pending member + invitation in ONE atomic batch (see services/familyService.ts).
  // The invited person is linked when they REGISTER with this email; people who already have
  // an account are not linked by an invitation yet.
  const handleSaveAndInvite = async () => {
    if (submitting) return;
    if (!isAdmin) {
      setError("Only the family admin can invite members.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await inviteMember({ name, relationship: memberType, contact, canAddExpenses });
      setName("");
      setContact("");
      setMemberType("Parent");
      setCanAddExpenses(true);
      closeModal();
    } catch (e) {
      setError(getInviteErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.title}>Add family member</Text>
              <Text style={styles.subtitle}>They get an invite to join the budget</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>MEMBER NAME</Text>
          <TextInput
            style={styles.focusedInput}
            value={name}
            onChangeText={setName}
            placeholder="Nimal Perera"
            placeholderTextColor="#a9b1bb"
          />

          <Text style={styles.fieldLabel}>MEMBER TYPE</Text>
          <View style={styles.pillRow}>
            {MEMBER_TYPES.map((type) => {
              const active = memberType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setMemberType(type)}
                  style={[styles.typePill, active && styles.typePillActive]}
                >
                  <Text style={[styles.typePillText, active && styles.typePillTextActive]}>
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>EMAIL OR PHONE</Text>
          <TextInput
            style={styles.plainInput}
            value={contact}
            onChangeText={setContact}
            placeholder="nimal@gmail.com"
            placeholderTextColor="#a9b1bb"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Can add shared expenses</Text>
            <Switch
              value={canAddExpenses}
              onValueChange={setCanAddExpenses}
              trackColor={{ false: "#d8dde3", true: "#00c46a" }}
              thumbColor="#ffffff"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actionsRow}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSaveAndInvite}
              disabled={submitting}
              style={[styles.saveButton, submitting && styles.saveButtonBusy]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.black} />
              ) : (
                <Text style={styles.saveButtonText}>Save & invite</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  errorText: {
    marginTop: 12,
    fontSize: 12,
    color: colors.error,
  },
  saveButtonBusy: {
    opacity: 0.6,
  },
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
  focusedInput: {
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#00c46a",
    backgroundColor: "#f7f9fa",
    fontSize: 14,
    fontWeight: "500",
    color: "#0e1116",
  },
  plainInput: {
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e1e5ea",
    backgroundColor: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    color: "#0e1116",
  },
  pillRow: {
    flexDirection: "row",
    gap: 10,
  },
  typePill: {
    flex: 1,
    height: 39,
    borderRadius: 12,
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
    fontSize: 12.5,
    fontWeight: "600",
    color: "#5d6673",
  },
  typePillTextActive: {
    color: "#00854b",
  },
  toggleRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 47,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: "#f4f6f8",
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0e1116",
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
