import { router } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../../components/Icon";
import { MemberInitialsAvatar } from "../../components/MemberInitialsAvatar";
import { ProgressBar } from "../../components/ProgressBar";
import { SharedActivityRow } from "../../components/SharedActivityRow";
import { getExpenseCategory } from "../../constants/categories";
import { useBudget } from "../../context/BudgetContext";
import { useExpenses } from "../../context/ExpenseContext";
import { useFamily } from "../../context/FamilyContext";
import { getBudgetStanding, type BudgetStanding } from "../../utils/budget";
import { getContributionPercent, getSplitText } from "../../utils/expenses";
import { getAvatarPalette, getInitials, getMonthYearLabel } from "../../utils/members";

const STANDING_LABEL: Record<BudgetStanding, string> = {
  "not-set": "Not set",
  "on-track": "On track",
  "near-limit": "Near limit",
  over: "Over budget",
};

type MemberData = {
  initials: string;
  avatarColor: string;
  avatarTextColor: string;
  name: string;
  role: string;
  spentAmount: string;
  progress: number;
  progressColor: string;
};

// Members come from the shared family backend (FamilyContext); spending comes from the shared
// expense backend (ExpenseContext). Only SHARED expenses count; Pending ones wait for the admin.

export default function FamilyBudgetScreen() {
  const { status: familyStatus, family, members, currentMember, isAdmin } = useFamily();
  const { status: budgetStatus, budget } = useBudget();
  const { expenses, totals } = useExpenses();

  const monthlySpent = totals.spent;
  const monthlyBudget = budget?.amount ?? 0;
  // Never negative: with no budget, or once it is overspent, the badge says so and Left stays at 0.
  const monthlyLeft = Math.max(0, monthlyBudget - monthlySpent);
  const badgeText =
    budgetStatus === "loading" || budgetStatus === "idle"
      ? "Loading"
      : budgetStatus === "error"
        ? "Unavailable"
        : STANDING_LABEL[getBudgetStanding(budget, monthlySpent)];
  const budgetHint =
    budgetStatus === "none"
      ? isAdmin
        ? "Tap to set this month's budget"
        : "Your family admin hasn't set this month's budget yet"
      : budgetStatus === "error"
        ? "Couldn't load this month's budget"
        : null;

  const memberRows = useMemo<(MemberData & { key: string })[]>(
    () =>
      members.map((member) => {
        const palette = getAvatarPalette(member.id);
        const paid = totals.byMember[member.id]?.amount ?? 0;
        return {
          key: member.id,
          initials: getInitials(member.displayName),
          avatarColor: palette.background,
          avatarTextColor: palette.text,
          name: member.displayName,
          role: member.status === "pending" ? "Pending" : member.role === "admin" ? "Admin" : "Member",
          spentAmount: `Rs ${paid.toLocaleString("en-US")}`,
          progress: getContributionPercent(paid, totals.spent) / 100,
          progressColor: palette.progress,
        };
      }),
    [members, totals],
  );

  // The two most recent SHARED expenses.
  const recentActivity = useMemo(
    () =>
      expenses
        .filter((expense) => expense.status === "Shared")
        .slice(0, 2)
        .map((expense) => {
          const category = getExpenseCategory(expense.categoryId);
          const payer = members.find((member) => member.id === expense.paidBy);
          const payerName = !payer ? "Someone" : payer.id === currentMember?.id ? "You" : payer.displayName;
          return {
            id: expense.id,
            emoji: category.emoji,
            iconBackground: category.iconBackground,
            name: category.label,
            subtitle: [payerName, getSplitText(expense.splitAmong)].filter((part) => part.length > 0).join(" · "),
            amount: `Rs ${expense.amount.toLocaleString("en-US")}`,
          };
        }),
    [expenses, members, currentMember],
  );

  const handleBack = () => router.back();
  const handleEditBudget = () => router.push("/edit-family-budget");
  const handleInvite = () => router.push("/shared-expenses");
  const handleAddSharedExpense = () => router.push("/shared-expenses");
  const handleBillsReminders = () => router.push("/recurring-bills");
  // TODO: View Report belongs to another team member's module.
  const handleViewReport = () => {};
  const handleCategoryBudgets = () => router.push("/category-budget");

  const handleSeeAllActivity = () => router.push("/expense-history");

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
            <Icon name="arrowLeft" size={16} />
          </Pressable>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Family Budget</Text>
            <Text style={styles.headerSubtitle}>
              {family ? `${family.name} · ` : ""}
              {getMonthYearLabel()}
            </Text>
          </View>
        </View>

        {/* Monthly Shared Budget */}
        <Pressable
          onPress={handleEditBudget}
          disabled={!isAdmin}
          style={styles.monthlyCard}
        >
          <View style={styles.monthlyHeaderRow}>
            <Text style={styles.monthlyLabel}>Monthly Shared Budget</Text>
            <View style={styles.onTrackBadge}>
              <Text style={styles.onTrackText}>{badgeText}</Text>
            </View>
          </View>
          <Text style={styles.monthlyAmount}>
            Rs {monthlyBudget.toLocaleString("en-US")}
          </Text>
          <ProgressBar
            progress={monthlyBudget > 0 ? monthlySpent / monthlyBudget : 0}
            height={8}
            trackColor="rgba(255,255,255,0.14)"
            fillColor="#00c46a"
            fillGradientColors={["#00c46a", "#7be3ae"]}
          />
          <View style={styles.monthlyFooterRow}>
            <Text style={styles.monthlyFooterText}>
              Spent{" "}
              <Text style={styles.monthlyFooterBold}>
                Rs {monthlySpent.toLocaleString("en-US")}
              </Text>
            </Text>
            <Text style={styles.monthlyFooterText}>
              Left{" "}
              <Text style={styles.monthlyFooterBold}>
                Rs {monthlyLeft.toLocaleString("en-US")}
              </Text>
            </Text>
          </View>
          {budgetHint ? <Text style={styles.monthlyHint}>{budgetHint}</Text> : null}
        </Pressable>

        {/* Members */}
        <View style={styles.membersCard}>
          <View style={styles.membersHeaderRow}>
            <Text style={styles.sectionTitle}>Members</Text>
            <Pressable
              onPress={handleInvite}
              disabled={!isAdmin}
              style={[styles.inviteButton, !isAdmin && styles.inviteButtonDisabled]}
            >
              <Text style={styles.inviteButtonText}>+ Invite</Text>
            </Pressable>
          </View>

          {familyStatus === "loading" || familyStatus === "idle" ? (
            <View style={styles.membersStateBox}>
              <ActivityIndicator color="#8a93a0" />
            </View>
          ) : null}
          {familyStatus === "error" || familyStatus === "missing" ? (
            <View style={styles.membersStateBox}>
              <Text style={styles.membersStateText}>
                Couldn&apos;t load your family members. Please try again later.
              </Text>
            </View>
          ) : null}

          <View style={styles.membersList}>
            {memberRows.map((member) => (
              <View key={member.key} style={styles.memberRow}>
                <MemberInitialsAvatar
                  initials={member.initials}
                  backgroundColor={member.avatarColor}
                  textColor={member.avatarTextColor}
                />
                <View style={styles.memberDetails}>
                  <Text style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberRole}> · {member.role}</Text>
                  </Text>
                  <ProgressBar
                    progress={member.progress}
                    height={5}
                    trackColor="#edf0f3"
                    fillColor={member.progressColor}
                  />
                </View>
                <Text style={styles.memberAmount}>{member.spentAmount}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Shortcuts grid */}
        <View style={styles.shortcutsGrid}>
          <Pressable
            onPress={handleAddSharedExpense}
            style={[styles.shortcutCard, styles.addExpenseCard]}
          >
            <View style={styles.addExpenseIconWrap}>
              <Text style={styles.addExpensePlus}>+</Text>
            </View>
            <Text style={styles.addExpenseLabel}>Add Shared Expense</Text>
          </Pressable>

          <Pressable
            onPress={handleViewReport}
            style={[styles.shortcutCard, styles.shortcutShadow]}
          >
            <View
              style={[styles.shortcutIconWrap, { backgroundColor: "#eef2ff" }]}
            >
              <Text style={styles.shortcutEmoji}>📋</Text>
            </View>
            <Text style={styles.shortcutLabel}>View Report</Text>
          </Pressable>

          <Pressable
            onPress={handleCategoryBudgets}
            style={[styles.shortcutCard, styles.shortcutShadow]}
          >
            <View
              style={[styles.shortcutIconWrap, { backgroundColor: "#e8f8f0" }]}
            >
              <Text style={styles.shortcutEmoji}>🎯</Text>
            </View>
            <Text style={styles.shortcutLabel}>Category Budgets</Text>
          </Pressable>

          <Pressable
            onPress={handleBillsReminders}
            style={[styles.shortcutCard, styles.shortcutShadow]}
          >
            <View
              style={[styles.shortcutIconWrap, { backgroundColor: "#fff1e6" }]}
            >
              <Text style={styles.shortcutEmoji}>🔔</Text>
            </View>
            <Text style={styles.shortcutLabel}>Bills & Reminders</Text>
          </Pressable>
        </View>

        {/* Shared activity */}
        <View style={styles.activityHeaderRow}>
          <Text style={styles.sectionTitle}>Shared activity</Text>
          <Pressable onPress={handleSeeAllActivity} hitSlop={8}>
            <Text style={styles.seeAllText}>See all</Text>
          </Pressable>
        </View>

        <View style={styles.activityCard}>
          {recentActivity.map((activity, index) => (
            <SharedActivityRow
              key={activity.id}
              emoji={activity.emoji}
              iconBackground={activity.iconBackground}
              name={activity.name}
              subtitle={activity.subtitle}
              amount={activity.amount}
              showDivider={index < recentActivity.length - 1}
            />
          ))}
          {recentActivity.length === 0 ? (
            <Text style={styles.activityEmptyText}>No shared expenses yet this month.</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  membersStateBox: {
    alignItems: "center",
    paddingVertical: 8,
  },
  activityEmptyText: {
    paddingVertical: 14,
    fontSize: 12.5,
    color: "#8a93a0",
    textAlign: "center",
  },
  membersStateText: {
    fontSize: 12.5,
    color: "#8a93a0",
    textAlign: "center",
  },
  inviteButtonDisabled: {
    opacity: 0.4,
  },
  screen: {
    flex: 1,
    backgroundColor: "#ffffff",
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
    fontWeight: "500",
    color: "#8a93a0",
  },
  monthlyCard: {
    marginTop: 20,
    gap: 12,
    borderRadius: 24,
    padding: 18,
    backgroundColor: "#11b076",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  monthlyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthlyLabel: {
    fontSize: 13.5,
    fontWeight: "500",
    color: "#ffffff",
  },
  onTrackBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#05bf78",
  },
  onTrackText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#04240f",
  },
  monthlyAmount: {
    fontSize: 30,
    fontWeight: "700",
    color: "#ffffff",
  },
  monthlyFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthlyFooterText: {
    fontSize: 12.5,
    fontWeight: "500",
    color: "#ffffff",
  },
  monthlyFooterBold: {
    fontWeight: "700",
  },
  monthlyHint: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
  },
  membersCard: {
    marginTop: 16,
    gap: 14,
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#0e1116",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  membersHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: "600",
    color: "#0e1116",
  },
  inviteButton: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#e8f8f0",
  },
  inviteButtonText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#00a85c",
  },
  membersList: {
    gap: 14,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  memberDetails: {
    flex: 1,
    gap: 6,
  },
  memberNameRow: {
    fontSize: 13,
  },
  memberName: {
    fontWeight: "700",
    color: "#0e1116",
  },
  memberRole: {
    fontWeight: "400",
    color: "#8a93a0",
  },
  memberAmount: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#0e1116",
  },
  shortcutsGrid: {
    marginTop: 28,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 13,
  },
  shortcutCard: {
    width: "47%",
    height: 86,
    justifyContent: "flex-end",
    gap: 8,
    borderRadius: 18,
    padding: 14,
  },
  shortcutShadow: {
    backgroundColor: "#ffffff",
    shadowColor: "#0e1116",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 2,
  },
  addExpenseCard: {
    backgroundColor: "#05bf78",
    shadowColor: "#939896",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addExpenseIconWrap: {
    height: 32,
    width: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  addExpensePlus: {
    fontSize: 20,
    fontWeight: "400",
    color: "#ffffff",
  },
  addExpenseLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#04240f",
  },
  shortcutIconWrap: {
    height: 32,
    width: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutEmoji: {
    fontSize: 15,
  },
  shortcutLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0e1116",
  },
  activityHeaderRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  seeAllText: {
    fontSize: 13.5,
    fontWeight: "500",
    color: "#00a85c",
  },
  activityCard: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
    shadowColor: "#0e1116",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
});
