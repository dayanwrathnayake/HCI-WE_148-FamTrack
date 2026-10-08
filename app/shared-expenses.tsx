import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddFamilyMemberModal } from "../components/AddFamilyMemberModal";
import { AddSharedExpenseModal } from "../components/AddSharedExpenseModal";
import { AppBottomNav } from "../components/AppBottomNav";
import { ExpenseActionSheet, type ExpenseSheetOption } from "../components/ExpenseActionSheet";
import { ExpenseActivityRow } from "../components/ExpenseActivityRow";
import { Icon } from "../components/Icon";
import { MemberInitialsAvatar } from "../components/MemberInitialsAvatar";
import { useExpenses } from "../context/ExpenseContext";
import { useFamily } from "../context/FamilyContext";
import { getExpenseErrorMessage } from "../services/expenseService";
import { getDeleteLabel, type ExpenseAction } from "../utils/expenseActions";
import {
  getContributionPercent,
  getExpenseCategoryLabel,
  getSplitText,
  groupExpensesByDay,
  type ExpenseRecord,
} from "../utils/expenses";
import {
  getAvatarPalette,
  getInitials,
  getMemberSubtitle,
  getMonthYearLabel,
  getRoleLabel,
} from "../utils/members";

type Tab = "members" | "expenses";

type MemberData = {
  key: string;
  initials: string;
  avatarColor: string;
  avatarTextColor: string;
  name: string;
  roleSuffix?: string;
  subtitle: string;
  amount: string;
  percent: string;
  highlighted?: boolean;
};

// Members and expenses come from the shared backends (FamilyContext and ExpenseContext). Only SHARED
// expenses count toward contributed amounts and percentages; Pending ones wait for the admin.

const ALL_FILTER = "all";

const STATUS_STYLES: Record<ExpenseRecord["status"], { color: string; background: string }> = {
  Shared: { color: "#00a85c", background: "#e8f8f0" },
  Pending: { color: "#b4530a", background: "#fff1e6" },
};

export default function SharedExpensesScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [filter, setFilter] = useState<string>(ALL_FILTER);
  const [addMemberVisible, setAddMemberVisible] = useState(false);
  const [addExpenseVisible, setAddExpenseVisible] = useState(false);
  // The expense whose action sheet is open, and the one being edited in the modal.
  const [actionExpense, setActionExpense] = useState<ExpenseRecord | null>(null);
  const [editExpense, setEditExpense] = useState<ExpenseRecord | null>(null);

  const { status: familyStatus, family, members, activeMembers, currentMember, isAdmin } = useFamily();
  const {
    status: expenseStatus,
    expenses,
    totals,
    approveExpense,
    deleteExpense,
    getActions,
  } = useExpenses();

  const memberRows = useMemo<MemberData[]>(
    () =>
      members.map((member) => {
        const isYou = member.id === currentMember?.id;
        const palette = getAvatarPalette(member.id);
        const paid = totals.byMember[member.id] ?? { amount: 0, count: 0 };
        return {
          key: member.id,
          initials: getInitials(member.displayName),
          avatarColor: palette.background,
          avatarTextColor: palette.text,
          name: isYou ? "You" : member.displayName,
          roleSuffix: member.status === "active" && member.role === "admin" ? getRoleLabel(member) : undefined,
          subtitle: getMemberSubtitle(member, isYou, paid.count),
          amount: `Rs ${paid.amount.toLocaleString("en-US")}`,
          percent: `${getContributionPercent(paid.amount, totals.spent)}%`,
          highlighted: isYou,
        };
      }),
    [members, currentMember, totals],
  );

  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const nameOf = (memberId: string) => {
    const member = memberById.get(memberId);
    if (!member) return "Someone";
    return member.id === currentMember?.id ? "You" : member.displayName;
  };

  // The chips: everyone, then each member who has joined.
  const filters = useMemo(
    () => [
      { key: ALL_FILTER, label: "All" },
      ...activeMembers.map((member) => ({
        key: member.id,
        label: member.id === currentMember?.id ? "You" : member.displayName.split(" ")[0],
      })),
    ],
    [activeMembers, currentMember],
  );

  const handleBack = () => router.back();
  // TODO: build real search once there's a real data source to search over.
  const handleSearchPress = () => {};

  const visibleGroups = useMemo(() => {
    const filtered = filter === ALL_FILTER ? expenses : expenses.filter((expense) => expense.paidBy === filter);
    return groupExpensesByDay(filtered);
  }, [filter, expenses]);

  // Tapping an expense opens its actions. Which ones appear depends on who you are and on the expense:
  // the admin can approve (Pending), edit and delete/decline; a member can edit and withdraw their OWN
  // Pending expense; nothing else. Only the current month can be changed (see utils/expenseActions.ts).
  const handleExpensePress = (expense: ExpenseRecord) => {
    if (getActions(expense).length === 0) return;
    setActionExpense(expense);
  };

  const describe = (expense: ExpenseRecord) =>
    `${getExpenseCategoryLabel(expense.categoryId)} · Rs ${expense.amount.toLocaleString("en-US")} paid by ${nameOf(expense.paidBy)}`;

  const confirmApprove = (expense: ExpenseRecord) => {
    Alert.alert(
      "Approve expense?",
      `${describe(expense)}.\n\nApproving adds it to the family's spending.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () => {
            approveExpense(expense.id).catch((error) =>
              Alert.alert("Couldn't approve", getExpenseErrorMessage(error)),
            );
          },
        },
      ],
    );
  };

  const confirmDelete = (expense: ExpenseRecord) => {
    const label = getDeleteLabel({ isAdmin, status: expense.status });
    Alert.alert(
      `${label}?`,
      `${describe(expense)}.\n\nThis can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: label.split(" ")[0],
          style: "destructive",
          onPress: () => {
            deleteExpense(expense).catch((error) =>
              Alert.alert("Couldn't delete", getExpenseErrorMessage(error)),
            );
          },
        },
      ],
    );
  };

  const handleActionSelected = (action: ExpenseAction) => {
    const expense = actionExpense;
    setActionExpense(null);
    if (!expense) return;
    // iOS drops an alert or a second modal shown while the sheet is still dismissing.
    setTimeout(() => {
      if (action === "approve") confirmApprove(expense);
      else if (action === "edit") setEditExpense(expense);
      else confirmDelete(expense);
    }, 350);
  };

  const sheetOptions: ExpenseSheetOption[] = actionExpense
    ? getActions(actionExpense).map((action) => ({
        action,
        label:
          action === "approve"
            ? "Approve expense"
            : action === "edit"
              ? "Edit expense"
              : getDeleteLabel({ isAdmin, status: actionExpense.status }),
      }))
    : [];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
              <Icon name="arrowLeft" size={16} />
            </Pressable>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle}>Shared Expenses</Text>
              <Text style={styles.headerSubtitle}>
                {family ? `${family.name} · ` : ""}
                {getMonthYearLabel()}
              </Text>
            </View>
            <Pressable onPress={handleSearchPress} style={styles.searchButton}>
              <Text style={styles.searchEmoji}>🔍</Text>
            </Pressable>
          </View>

          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => setActiveTab("members")}
              style={[styles.togglePill, activeTab === "members" && styles.togglePillActive]}
            >
              <Text
                style={[styles.toggleText, activeTab === "members" && styles.toggleTextActive]}
              >
                Family members
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("expenses")}
              style={[styles.togglePill, activeTab === "expenses" && styles.togglePillActive]}
            >
              <Text
                style={[styles.toggleText, activeTab === "expenses" && styles.toggleTextActive]}
              >
                Expenses
              </Text>
            </Pressable>
          </View>

          {activeTab === "members" ? (
            <>
              <View style={styles.summaryCard}>
                <View>
                  <Text style={styles.summaryLabel}>Total contributed</Text>
                  <Text style={styles.summaryValue}>Rs {totals.spent.toLocaleString("en-US")}</Text>
                </View>
                <View style={styles.summaryRight}>
                  <Text style={styles.summaryLabel}>Members</Text>
                  <Text style={styles.summaryValue}>{activeMembers.length}</Text>
                </View>
              </View>

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Family members</Text>
                <Text style={styles.sectionSubtitle}>contributed</Text>
              </View>

              {familyStatus === "loading" || familyStatus === "idle" ? (
                <View style={styles.memberStateBox}>
                  <ActivityIndicator color="#8a93a0" />
                </View>
              ) : null}
              {familyStatus === "error" || familyStatus === "missing" ? (
                <View style={styles.memberStateBox}>
                  <Text style={styles.memberStateText}>
                    Couldn&apos;t load your family members. Please try again later.
                  </Text>
                </View>
              ) : null}

              <View style={styles.memberList}>
                {memberRows.map((member) => (
                  <View
                    key={member.key}
                    style={[styles.memberCard, member.highlighted && styles.memberCardHighlighted]}
                  >
                    <MemberInitialsAvatar
                      initials={member.initials}
                      backgroundColor={member.avatarColor}
                      textColor={member.avatarTextColor}
                      size={38}
                    />
                    <View style={styles.memberTextGroup}>
                      <Text style={styles.memberName}>
                        {member.name}
                        {member.roleSuffix ? (
                          <Text style={styles.memberRole}> · {member.roleSuffix}</Text>
                        ) : null}
                      </Text>
                      <Text style={styles.memberSubtitle}>{member.subtitle}</Text>
                    </View>
                    <View style={styles.memberAmountGroup}>
                      <Text style={styles.memberAmount}>{member.amount}</Text>
                      <Text style={styles.memberPercent}>{member.percent}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => setAddMemberVisible(true)}
                disabled={!isAdmin}
                style={[styles.addMemberButton, !isAdmin && styles.addMemberButtonDisabled]}
              >
                <Text style={styles.addMemberText}>+ Add family member</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.filterRow}>
                {filters.map((item) => {
                  const active = filter === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => setFilter(item.key)}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                    >
                      <Text style={[styles.filterText, active && styles.filterTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {expenseStatus === "loading" || expenseStatus === "idle" ? (
                <View style={styles.memberStateBox}>
                  <ActivityIndicator color="#8a93a0" />
                </View>
              ) : null}
              {expenseStatus === "error" ? (
                <View style={styles.memberStateBox}>
                  <Text style={styles.memberStateText}>
                    Couldn&apos;t load this month&apos;s expenses. Please try again later.
                  </Text>
                </View>
              ) : null}
              {expenseStatus === "ready" && visibleGroups.length === 0 ? (
                <View style={styles.memberStateBox}>
                  <Text style={styles.memberStateText}>No expenses yet this month.</Text>
                </View>
              ) : null}

              {visibleGroups.map((group) => (
                <View key={group.label} style={styles.expenseGroup}>
                  <Text style={styles.expenseGroupLabel}>{group.label.toUpperCase()}</Text>
                  <View style={styles.expenseCard}>
                    {group.expenses.map((expense, index) => {
                      const payer = memberById.get(expense.paidBy);
                      const palette = getAvatarPalette(expense.paidBy);
                      const details = [nameOf(expense.paidBy), expense.note, getSplitText(expense.splitAmong)]
                        .filter((part) => part.length > 0)
                        .join(" · ");
                      return (
                        <Pressable
                          key={expense.id}
                          onPress={() => handleExpensePress(expense)}
                          disabled={getActions(expense).length === 0}
                        >
                          <ExpenseActivityRow
                            initials={getInitials(payer?.displayName ?? "?")}
                            avatarColor={palette.background}
                            avatarTextColor={palette.text}
                            name={getExpenseCategoryLabel(expense.categoryId)}
                            subtitle={details}
                            amount={`Rs ${expense.amount.toLocaleString("en-US")}`}
                            statusLabel={expense.status}
                            statusColor={STATUS_STYLES[expense.status].color}
                            statusBackground={STATUS_STYLES[expense.status].background}
                            showDivider={index < group.expenses.length - 1}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}

              <Pressable
                onPress={() => setAddExpenseVisible(true)}
                style={styles.addExpenseButton}
              >
                <Text style={styles.addExpenseText}>+ Add shared expense</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <AppBottomNav activeRouteName="budget" />

      <AddFamilyMemberModal
        visible={addMemberVisible}
        onClose={() => setAddMemberVisible(false)}
      />
      <AddSharedExpenseModal
        key={editExpense?.id ?? "add"}
        visible={addExpenseVisible || editExpense !== null}
        expense={editExpense}
        onClose={() => {
          setAddExpenseVisible(false);
          setEditExpense(null);
        }}
      />
      <ExpenseActionSheet
        visible={actionExpense !== null}
        title={actionExpense ? describe(actionExpense) : ""}
        options={sheetOptions}
        onSelect={handleActionSelected}
        onClose={() => setActionExpense(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  memberStateBox: {
    alignItems: "center",
    paddingVertical: 16,
  },
  memberStateText: {
    fontSize: 12.5,
    color: "#8a93a0",
    textAlign: "center",
  },
  addMemberButtonDisabled: {
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
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0e1116",
  },
  headerTextGroup: {
    flex: 1,
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
  searchButton: {
    height: 36,
    width: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    shadowColor: "#0e1116",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchEmoji: {
    fontSize: 15,
  },
  toggleRow: {
    marginTop: 16,
    flexDirection: "row",
    height: 43,
    borderRadius: 14,
    padding: 4,
    backgroundColor: "#e7eaee",
  },
  togglePill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },
  togglePillActive: {
    backgroundColor: "#14171a",
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5d6673",
  },
  toggleTextActive: {
    color: "#ffffff",
  },
  summaryCard: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 81,
    borderRadius: 20,
    paddingHorizontal: 18,
    backgroundColor: "#1dcd9f",
    shadowColor: "#00c46a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 11,
    elevation: 4,
  },
  summaryRight: {
    alignItems: "flex-end",
  },
  summaryLabel: {
    fontSize: 11.5,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
  },
  summaryValue: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
  },
  sectionHeaderRow: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: "600",
    color: "#0e1116",
  },
  sectionSubtitle: {
    fontSize: 11.5,
    fontWeight: "400",
    color: "#8a93a0",
  },
  memberList: {
    marginTop: 12,
    gap: 10,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    height: 64,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
    shadowColor: "#0e1116",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  memberCardHighlighted: {
    borderWidth: 1,
    borderColor: "#00c46a",
  },
  memberTextGroup: {
    flex: 1,
    gap: 3,
  },
  memberName: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#0e1116",
  },
  memberRole: {
    fontWeight: "400",
    color: "#8a93a0",
  },
  memberSubtitle: {
    fontSize: 11,
    fontWeight: "400",
    color: "#8a93a0",
  },
  memberAmountGroup: {
    alignItems: "flex-end",
  },
  memberAmount: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#0e1116",
  },
  memberPercent: {
    marginTop: 2,
    fontSize: 10.5,
    fontWeight: "400",
    color: "#00a85c",
  },
  addMemberButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#c6ccd4",
    borderStyle: "dashed",
  },
  addMemberText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#5d6673",
  },
  filterRow: {
    marginTop: 20,
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    height: 32,
    borderRadius: 20,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1e5ea",
  },
  filterChipActive: {
    backgroundColor: "#1dcd9f",
    borderColor: "#1dcd9f",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5d6673",
  },
  filterTextActive: {
    color: "#04240f",
  },
  expenseGroup: {
    marginTop: 20,
  },
  expenseGroupLabel: {
    marginBottom: 8,
    fontSize: 11.5,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: "#8a93a0",
  },
  expenseCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
    shadowColor: "#0e1116",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  addExpenseButton: {
    marginTop: 20,
    height: 50,
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
  addExpenseText: {
    fontSize: 14.5,
    fontWeight: "600",
    color: "#04240f",
  },
});
