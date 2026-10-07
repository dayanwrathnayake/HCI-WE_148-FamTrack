import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBottomNav } from "../components/AppBottomNav";
import { CategoryShareModal, type CategoryShareMode } from "../components/CategoryShareModal";
import { Icon } from "../components/Icon";
import { DEFAULT_CATEGORY_SHARES, getCategoryDefinition } from "../constants/categories";
import { useBudget } from "../context/BudgetContext";
import { useFamily } from "../context/FamilyContext";
import { getBudgetErrorMessage } from "../services/budgetService";
import {
  clampAlertPercentage,
  DEFAULT_ALERT_PERCENTAGE,
  formatAmountInput,
  getAlertAmount,
  getPreviousMonthKey,
  parseBudgetAmount,
} from "../utils/budget";
import {
  getOtherPercentage,
  getShareIds,
  validateCategoryShares,
  withoutShare,
  withShare,
} from "../utils/categories";
import { getMonthYearLabel } from "../utils/members";
import type { CategoryId, CategoryShares } from "../types/models";

const monthDate = (monthKey: string) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
};

export default function EditFamilyBudgetScreen() {
  const { status: budgetStatus, budgetId } = useBudget();
  const loaded = budgetStatus === "ready" || budgetStatus === "none";

  // The form takes its initial values from the saved budget (or defaults) when it mounts, so it is
  // re-mounted once the budget has loaded. Later snapshots never overwrite what the admin is typing.
  return <EditFamilyBudgetForm key={`${budgetId ?? "none"}:${loaded}`} />;
}

function EditFamilyBudgetForm() {
  const { status: familyStatus, family, activeMembers, isAdmin } = useFamily();
  const { status: budgetStatus, budget, monthKey, saveBudget, loadPrefill } = useBudget();

  const loaded = budgetStatus === "ready" || budgetStatus === "none";

  const [budgetName, setBudgetName] = useState(
    () => budget?.name ?? (family ? `${family.name} Budget` : ""),
  );
  const [monthlyBudget, setMonthlyBudget] = useState(() =>
    budget ? formatAmountInput(String(budget.amount)) : "",
  );
  const [alertPercent, setAlertPercent] = useState(
    () => budget?.alertPercentage ?? DEFAULT_ALERT_PERCENTAGE,
  );
  const [membersCanAddExpenses, setMembersCanAddExpenses] = useState(
    () => budget?.membersCanAddExpenses ?? true,
  );
  // Local draft only: nothing is saved until "Save Changes". "Other" is never stored; it is
  // whatever the explicit categories leave of the 100%.
  const [categoryShares, setCategoryShares] = useState<CategoryShares>(
    () => budget?.categories ?? { ...DEFAULT_CATEGORY_SHARES },
  );
  const [categoryModal, setCategoryModal] = useState<CategoryShareMode | null>(null);
  const [prefillLabel, setPrefillLabel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const canEdit = isAdmin && loaded && !saving;

  // When this month has no budget yet, pre-fill the form from last month's (name, amount, alert,
  // the members toggle and the category shares only), unless the admin has already started typing. Nothing is written.
  const touched = useRef(false);
  useEffect(() => {
    if (budgetStatus !== "none" || !isAdmin) return;
    void loadPrefill().then((prefill) => {
      if (!prefill || touched.current) return;
      setBudgetName(prefill.name);
      setMonthlyBudget(formatAmountInput(String(prefill.amount)));
      setAlertPercent(prefill.alertPercentage);
      setMembersCanAddExpenses(prefill.membersCanAddExpenses);
      setCategoryShares(prefill.categories);
      setPrefillLabel(getMonthYearLabel(monthDate(getPreviousMonthKey(monthKey))));
    });
  }, [budgetStatus, isAdmin, loadPrefill, monthKey]);

  // Drag (or tap) on the alert slider, through a transparent touch area around the existing track.
  const trackRef = useRef<View>(null);
  const trackBounds = useRef({ left: 0, width: 0 });
  const setAlertFromPageX = (pageX: number) => {
    const { left, width } = trackBounds.current;
    if (width <= 0) return;
    touched.current = true;
    setAlertPercent(clampAlertPercentage(((pageX - left) / width) * 100));
  };

  const handleBack = () => router.back();
  const handleCancel = () => router.back();
  const handleSaveChanges = async () => {
    if (!canEdit) return;
    const categoriesError = validateCategoryShares(categoryShares);
    if (categoriesError) {
      setErrorText(categoriesError);
      return;
    }
    setErrorText(null);
    setSaving(true);
    try {
      await saveBudget({
        name: budgetName,
        amountText: monthlyBudget,
        alertPercentage: alertPercent,
        membersCanAddExpenses,
        categories: categoryShares,
      });
      router.back();
    } catch (error) {
      setErrorText(getBudgetErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };
  // The period is Monthly only and the start date is the 1st of the current month for now.
  const handleBudgetPeriodPress = () => {};
  const handleStartDatePress = () => {};
  const handleAddCategory = () => {
    if (canEdit) setCategoryModal({ kind: "add" });
  };
  const handleCategoryPress = (id: CategoryId) => {
    if (canEdit) setCategoryModal({ kind: "edit", id });
  };
  const handleApplyShare = (id: CategoryId, percentage: number) => {
    touched.current = true;
    setErrorText(null);
    setCategoryShares((prev) => withShare(prev, id, percentage));
    setCategoryModal(null);
  };
  const handleRemoveShare = (id: CategoryId) => {
    touched.current = true;
    setErrorText(null);
    setCategoryShares((prev) => withoutShare(prev, id));
    setCategoryModal(null);
  };

  const shareIds = getShareIds(categoryShares);
  const otherPercentage = getOtherPercentage(categoryShares);
  // "Other" counts toward the total but isn't shown as its own pill, matching the Figma design.
  const selectedCount = shareIds.length + (otherPercentage > 0 ? 1 : 0);

  const alertAmount = getAlertAmount(parseBudgetAmount(monthlyBudget) ?? 0, alertPercent);

  const monthLabel = getMonthYearLabel(monthDate(monthKey));
  const startDateLabel = `01 ${monthLabel.slice(0, 3)} ${monthLabel.split(" ")[1]}`;
  const memberCount = activeMembers.length;
  const subtitle =
    memberCount > 1 ? `Changes apply to all ${memberCount} members` : "Changes apply to your whole family";

  const noteText =
    budgetStatus === "error" || familyStatus === "error" || familyStatus === "missing"
      ? "Couldn't load the budget. Please try again later."
      : !loaded
        ? "Loading this month's budget…"
        : !isAdmin
          ? "Only the family admin can edit the budget."
          : prefillLabel
            ? `Pre-filled from ${prefillLabel}. Save to set ${monthLabel}'s budget.`
            : budgetStatus === "none"
              ? `No budget set for ${monthLabel} yet.`
              : null;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
              <Icon name="arrowLeft" size={16} />
            </Pressable>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle}>Edit Family Budget</Text>
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            </View>
          </View>
          {noteText ? <Text style={styles.noteText}>{noteText}</Text> : null}

          <Text style={styles.fieldLabel}>BUDGET NAME</Text>
          <TextInput
            style={styles.textInput}
            value={budgetName}
            onChangeText={(text) => {
              touched.current = true;
              setBudgetName(text);
            }}
            editable={canEdit}
            maxLength={100}
            placeholder="Budget name"
          />

          <Text style={styles.fieldLabel}>MONTHLY BUDGET</Text>
          <View style={styles.monthlyBudgetInputWrap}>
            <View style={styles.currencyPrefix}>
              <Text style={styles.currencyPrefixText}>Rs</Text>
            </View>
            <TextInput
              style={styles.monthlyBudgetInput}
              value={monthlyBudget}
              onChangeText={(text) => {
                touched.current = true;
                setMonthlyBudget(formatAmountInput(text));
              }}
              editable={canEdit}
              placeholder="0"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>BUDGET PERIOD</Text>
              <Pressable onPress={handleBudgetPeriodPress} style={styles.dropdownField}>
                <Text style={styles.dropdownText}>Monthly</Text>
                <Text style={styles.dropdownChevron}>▾</Text>
              </Pressable>
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>START DATE</Text>
              <Pressable onPress={handleStartDatePress} style={styles.dropdownField}>
                <Text style={styles.dropdownText}>{startDateLabel}</Text>
                <Text style={styles.dropdownEmoji}>📅</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.categoriesHeaderRow}>
            <Text style={styles.fieldLabel}>BUDGET CATEGORIES</Text>
            <Text style={styles.selectedCountText}>{selectedCount} selected</Text>
          </View>
          <View style={styles.categoryPillsWrap}>
            {shareIds.map((id) => {
              const category = getCategoryDefinition(id);
              return (
                <Pressable
                  key={id}
                  onPress={() => handleCategoryPress(id)}
                  disabled={!canEdit}
                  style={styles.categoryPill}
                >
                  <Text style={styles.categoryPillText}>
                    {category.emoji} {category.label} · {categoryShares[id]}%
                  </Text>
                </Pressable>
              );
            })}
            <Pressable onPress={handleAddCategory} style={styles.addCategoryPill}>
              <Text style={styles.addCategoryText}>+ Add category</Text>
            </Pressable>
          </View>
          <Text style={styles.otherCaption}>Other · {otherPercentage}% (the rest of the budget)</Text>

          <Text style={styles.fieldLabel}>ALERT WHEN SPENDING REACHES</Text>
          <View style={styles.alertCard}>
            <View style={styles.alertHeaderRow}>
              <Text style={styles.alertLabel}>{alertPercent}% of budget</Text>
              <Text style={styles.alertAmount}>Rs {alertAmount.toLocaleString("en-US")}</Text>
            </View>
            {/* Invisible padding around the track gives the slider a comfortable touch area. */}
            <View
              style={styles.sliderTouchArea}
              onStartShouldSetResponder={() => canEdit}
              onMoveShouldSetResponder={() => canEdit}
              onResponderTerminationRequest={() => false}
              onResponderGrant={(event) => {
                const pageX = event.nativeEvent.pageX;
                trackRef.current?.measure((_x, _y, width, _height, left) => {
                  trackBounds.current = { left, width };
                  setAlertFromPageX(pageX);
                });
              }}
              onResponderMove={(event) => setAlertFromPageX(event.nativeEvent.pageX)}
            >
              <View ref={trackRef} style={styles.sliderTrack}>
                <View style={[styles.sliderFill, { width: `${alertPercent}%` }]} />
                <View style={[styles.sliderThumb, { left: `${alertPercent}%` }]} />
              </View>
            </View>
          </View>

          <View style={styles.toggleCard}>
            <View style={styles.toggleTextGroup}>
              <Text style={styles.toggleLabel}>Members can add expenses</Text>
              <Text style={styles.toggleSubtitle}>Off means admin approval needed</Text>
            </View>
            <Switch
              value={membersCanAddExpenses}
              onValueChange={(value) => {
                touched.current = true;
                setMembersCanAddExpenses(value);
              }}
              disabled={!canEdit}
              trackColor={{ false: "#d8dde3", true: "#00c46a" }}
              thumbColor="#ffffff"
            />
          </View>

          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

          <View style={styles.actionsRow}>
            <Pressable onPress={handleCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSaveChanges}
              disabled={!canEdit}
              style={[styles.saveButton, !canEdit && styles.saveButtonDisabled]}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      <AppBottomNav activeRouteName="budget" />

      {categoryModal ? (
        <CategoryShareModal
          key={categoryModal.kind === "edit" ? categoryModal.id : "add"}
          mode={categoryModal}
          shares={categoryShares}
          onClose={() => setCategoryModal(null)}
          onApply={handleApplyShare}
          onRemove={handleRemoveShare}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  otherCaption: {
    marginTop: 8,
    fontSize: 11.5,
    fontWeight: "500",
    color: "#8a93a0",
  },
  noteText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    color: "#8a93a0",
  },
  errorText: {
    marginTop: 16,
    fontSize: 12.5,
    fontWeight: "500",
    textAlign: "center",
    color: "#c2410c",
  },
  sliderTouchArea: {
    // Padding and negative margin cancel out, so the layout is unchanged.
    paddingVertical: 14,
    marginVertical: -14,
    paddingHorizontal: 12,
    marginHorizontal: -12,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },

  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerRow: {
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0e1116",
  },
  headerTextGroup: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#222222",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 11.5,
    fontWeight: "400",
    color: "#8a93a0",
  },
  fieldLabel: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.76,
    color: "#5d6673",
  },
  textInput: {
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
  monthlyBudgetInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 51,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#00c46a",
    backgroundColor: "#ffffff",
    shadowColor: "rgba(0,196,106,0.4)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  currencyPrefix: {
    height: 27,
    width: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f6f8",
  },
  currencyPrefixText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#8a93a0",
  },
  monthlyBudgetInput: {
    flex: 1,
    fontSize: 16.5,
    fontWeight: "700",
    color: "#0e1116",
  },
  rowFields: {
    flexDirection: "row",
    gap: 16,
  },
  halfField: {
    flex: 1,
  },
  dropdownField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e1e5ea",
    backgroundColor: "#ffffff",
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0e1116",
  },
  dropdownChevron: {
    fontSize: 11.5,
    color: "#8a93a0",
  },
  dropdownEmoji: {
    fontSize: 12.5,
  },
  categoriesHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedCountText: {
    marginTop: 20,
    fontSize: 11,
    fontWeight: "600",
    color: "#00c46a",
  },
  categoryPillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryPill: {
    height: 32,
    borderRadius: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ddf8f1",
    borderWidth: 1,
    borderColor: "#9de3c0",
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#00854b",
  },
  addCategoryPill: {
    height: 32,
    borderRadius: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#c6ccd4",
    borderStyle: "dashed",
  },
  addCategoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5d6673",
  },
  alertCard: {
    gap: 14,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e1e5ea",
    backgroundColor: "#ffffff",
  },
  alertHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alertLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0e1116",
  },
  alertAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#135f3c",
  },
  sliderTrack: {
    height: 6,
    borderRadius: 5,
    backgroundColor: "#edf0f3",
    justifyContent: "center",
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 5,
    backgroundColor: "#1dcd9f",
  },
  sliderThumb: {
    position: "absolute",
    marginLeft: -11,
    height: 22,
    width: 22,
    borderRadius: 11,
    backgroundColor: "#ffffff",
    borderWidth: 3,
    borderColor: "#1dcd9f",
  },
  toggleCard: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e1e5ea",
    backgroundColor: "#ffffff",
  },
  toggleTextGroup: {
    flex: 1,
    gap: 2,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0e1116",
  },
  toggleSubtitle: {
    fontSize: 11,
    fontWeight: "400",
    color: "#8a93a0",
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
    shadowColor: "#757575",
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
