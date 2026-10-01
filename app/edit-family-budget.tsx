import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBottomNav } from "../components/AppBottomNav";
import { Icon } from "../components/Icon";

type CategoryPillData = {
  label: string;
};

const SELECTED_CATEGORIES: CategoryPillData[] = [
  { label: "🍔 Food · 20%" },
  { label: "🛍 Shopping · 30%" },
  { label: "🩺 Health · 15%" },
  { label: "🚗 Transport · 15%" },
  { label: "🧾 Bills · 12%" },
];

const ALERT_THRESHOLD_PERCENT = 80;
// "Other" counts toward the total but isn't shown as its own pill, matching the Figma design.
const SELECTED_CATEGORIES_COUNT = 6;

export default function EditFamilyBudgetScreen() {
  const [budgetName, setBudgetName] = useState("Perera Family Budget");
  const [monthlyBudget, setMonthlyBudget] = useState("100,000");
  const [membersCanAddExpenses, setMembersCanAddExpenses] = useState(true);

  const handleBack = () => router.back();
  const handleCancel = () => router.back();
  // TODO: wire up once there's a real budget data source to save to.
  const handleSaveChanges = () => router.back();
  // TODO: build a real period picker.
  const handleBudgetPeriodPress = () => {};
  // TODO: build a real date picker.
  const handleStartDatePress = () => {};
  // TODO: build real category add/remove.
  const handleAddCategory = () => {};

  const alertAmount = Math.round(
    (Number(monthlyBudget.replace(/,/g, "")) || 0) * (ALERT_THRESHOLD_PERCENT / 100),
  );

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
              <Text style={styles.headerSubtitle}>Changes apply to all 4 members</Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>BUDGET NAME</Text>
          <TextInput
            style={styles.textInput}
            value={budgetName}
            onChangeText={setBudgetName}
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
              onChangeText={setMonthlyBudget}
              keyboardType="numeric"
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
                <Text style={styles.dropdownText}>01 Sep 2026</Text>
                <Text style={styles.dropdownEmoji}>📅</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.categoriesHeaderRow}>
            <Text style={styles.fieldLabel}>BUDGET CATEGORIES</Text>
            <Text style={styles.selectedCountText}>{SELECTED_CATEGORIES_COUNT} selected</Text>
          </View>
          <View style={styles.categoryPillsWrap}>
            {SELECTED_CATEGORIES.map((category) => (
              <View key={category.label} style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{category.label}</Text>
              </View>
            ))}
            <Pressable onPress={handleAddCategory} style={styles.addCategoryPill}>
              <Text style={styles.addCategoryText}>+ Add category</Text>
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>ALERT WHEN SPENDING REACHES</Text>
          <View style={styles.alertCard}>
            <View style={styles.alertHeaderRow}>
              <Text style={styles.alertLabel}>{ALERT_THRESHOLD_PERCENT}% of budget</Text>
              <Text style={styles.alertAmount}>Rs {alertAmount.toLocaleString("en-US")}</Text>
            </View>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${ALERT_THRESHOLD_PERCENT}%` }]} />
              <View style={[styles.sliderThumb, { left: `${ALERT_THRESHOLD_PERCENT}%` }]} />
            </View>
          </View>

          <View style={styles.toggleCard}>
            <View style={styles.toggleTextGroup}>
              <Text style={styles.toggleLabel}>Members can add expenses</Text>
              <Text style={styles.toggleSubtitle}>Off means admin approval needed</Text>
            </View>
            <Switch
              value={membersCanAddExpenses}
              onValueChange={setMembersCanAddExpenses}
              trackColor={{ false: "#d8dde3", true: "#00c46a" }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.actionsRow}>
            <Pressable onPress={handleCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSaveChanges} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      <AppBottomNav activeRouteName="budget" />
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 10,
    fontWeight: "400",
    color: "#8a93a0",
  },
  fieldLabel: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 9.5,
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
    fontSize: 12.5,
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
    fontSize: 11,
    fontWeight: "600",
    color: "#8a93a0",
  },
  monthlyBudgetInput: {
    flex: 1,
    fontSize: 15,
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
    fontSize: 12.5,
    fontWeight: "500",
    color: "#0e1116",
  },
  dropdownChevron: {
    fontSize: 10,
    color: "#8a93a0",
  },
  dropdownEmoji: {
    fontSize: 11,
  },
  categoriesHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedCountText: {
    marginTop: 20,
    fontSize: 9.5,
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
    fontSize: 10.5,
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
    fontSize: 10.5,
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
    fontSize: 11.5,
    fontWeight: "600",
    color: "#0e1116",
  },
  alertAmount: {
    fontSize: 11.5,
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
    fontSize: 11.5,
    fontWeight: "600",
    color: "#0e1116",
  },
  toggleSubtitle: {
    fontSize: 9.5,
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
    fontSize: 12.5,
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
    fontSize: 12.5,
    fontWeight: "600",
    color: "#04240f",
  },
});
