import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../../components/Icon";
import { MemberInitialsAvatar } from "../../components/MemberInitialsAvatar";
import { ProgressBar } from "../../components/ProgressBar";
import { SharedActivityRow } from "../../components/SharedActivityRow";

const FAMILY_NAME = "Perera family";
const PERIOD_LABEL = "September 2026";

const MONTHLY_BUDGET = 100000;
const MONTHLY_SPENT = 65000;
const MONTHLY_LEFT = MONTHLY_BUDGET - MONTHLY_SPENT;

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

const MEMBERS: MemberData[] = [
  {
    initials: "DP",
    avatarColor: "#ffd8a8",
    avatarTextColor: "#7a4b00",
    name: "Amali",
    role: "Admin",
    spentAmount: "Rs 26,400",
    progress: 0.72,
    progressColor: "#00c46a",
  },
  {
    initials: "KP",
    avatarColor: "#cde3ff",
    avatarTextColor: "#1b4c88",
    name: "Nimal",
    role: "Member",
    spentAmount: "Rs 17,600",
    progress: 0.48,
    progressColor: "#4b8df8",
  },
  {
    initials: "AP",
    avatarColor: "#ffcfe0",
    avatarTextColor: "#8c2453",
    name: "Malith",
    role: "Member",
    spentAmount: "Rs 12,500",
    progress: 0.34,
    progressColor: "#f2789b",
  },
];

type ActivityData = {
  emoji: string;
  iconBackground: string;
  name: string;
  subtitle: string;
  amount: string;
};

const SHARED_ACTIVITY: ActivityData[] = [
  {
    emoji: "🛒",
    iconBackground: "#e8f8f0",
    name: "Keells groceries",
    subtitle: "Kavi · split 4 ways",
    amount: "Rs 8,450",
  },
  {
    emoji: "💡",
    iconBackground: "#fff1e6",
    name: "CEB electricity",
    subtitle: "Dayan · shared bill",
    amount: "Rs 5,650",
  },
];

export default function FamilyBudgetScreen() {
  const handleBack = () => router.back();
  const handleInvite = () => router.push("/shared-expenses");
  const handleAddSharedExpense = () => router.push("/shared-expenses");
  // TODO: View Report belongs to another team member's module.
  const handleViewReport = () => {};
  const handleCategoryBudgets = () => router.push("/category-budget");
  // TODO: Bills & Reminders belongs to another team member's module.
  const handleBillsReminders = () => {};
  // TODO: build the full Shared Expenses list screen.
  const handleSeeAllActivity = () => {};

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
              {FAMILY_NAME} · {PERIOD_LABEL}
            </Text>
          </View>
        </View>

        {/* Monthly Shared Budget */}
        <View style={styles.monthlyCard}>
          <View style={styles.monthlyHeaderRow}>
            <Text style={styles.monthlyLabel}>Monthly Shared Budget</Text>
            <View style={styles.onTrackBadge}>
              <Text style={styles.onTrackText}>On track</Text>
            </View>
          </View>
          <Text style={styles.monthlyAmount}>
            Rs {MONTHLY_BUDGET.toLocaleString("en-US")}
          </Text>
          <ProgressBar
            progress={MONTHLY_SPENT / MONTHLY_BUDGET}
            height={8}
            trackColor="rgba(255,255,255,0.14)"
            fillColor="#00c46a"
            fillGradientColors={["#00c46a", "#7be3ae"]}
          />
          <View style={styles.monthlyFooterRow}>
            <Text style={styles.monthlyFooterText}>
              Spent <Text style={styles.monthlyFooterBold}>Rs {MONTHLY_SPENT.toLocaleString("en-US")}</Text>
            </Text>
            <Text style={styles.monthlyFooterText}>
              Left <Text style={styles.monthlyFooterBold}>Rs {MONTHLY_LEFT.toLocaleString("en-US")}</Text>
            </Text>
          </View>
        </View>

        {/* Members */}
        <View style={styles.membersCard}>
          <View style={styles.membersHeaderRow}>
            <Text style={styles.sectionTitle}>Members</Text>
            <Pressable onPress={handleInvite} style={styles.inviteButton}>
              <Text style={styles.inviteButtonText}>+ Invite</Text>
            </Pressable>
          </View>

          <View style={styles.membersList}>
            {MEMBERS.map((member) => (
              <View key={member.name} style={styles.memberRow}>
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
            <View style={[styles.shortcutIconWrap, { backgroundColor: "#eef2ff" }]}>
              <Text style={styles.shortcutEmoji}>📋</Text>
            </View>
            <Text style={styles.shortcutLabel}>View Report</Text>
          </Pressable>

          <Pressable
            onPress={handleCategoryBudgets}
            style={[styles.shortcutCard, styles.shortcutShadow]}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: "#e8f8f0" }]}>
              <Text style={styles.shortcutEmoji}>🎯</Text>
            </View>
            <Text style={styles.shortcutLabel}>Category Budgets</Text>
          </Pressable>

          <Pressable
            onPress={handleBillsReminders}
            style={[styles.shortcutCard, styles.shortcutShadow]}
          >
            <View style={[styles.shortcutIconWrap, { backgroundColor: "#fff1e6" }]}>
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
          {SHARED_ACTIVITY.map((activity, index) => (
            <SharedActivityRow
              key={activity.name}
              emoji={activity.emoji}
              iconBackground={activity.iconBackground}
              name={activity.name}
              subtitle={activity.subtitle}
              amount={activity.amount}
              showDivider={index < SHARED_ACTIVITY.length - 1}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
