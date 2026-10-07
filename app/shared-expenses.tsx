import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddFamilyMemberModal } from "../components/AddFamilyMemberModal";
import { AddSharedExpenseModal } from "../components/AddSharedExpenseModal";
import { AppBottomNav } from "../components/AppBottomNav";
import { ExpenseActivityRow } from "../components/ExpenseActivityRow";
import { Icon } from "../components/Icon";
import { MemberInitialsAvatar } from "../components/MemberInitialsAvatar";
import { useFamily } from "../context/FamilyContext";
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

// Members come from the shared family backend (FamilyContext). Amounts, percentages and
// expense counts are placeholders (Rs 0 / 0% / 0 expenses) until the expense phase.

const FILTERS = ["All", "Mum", "Dad", "You"] as const;
type Filter = (typeof FILTERS)[number];

type ExpenseEntry = {
  initials: string;
  avatarColor: string;
  avatarTextColor: string;
  name: string;
  subtitle: string;
  amount: string;
  statusLabel: "Shared" | "Pending";
  paidBy: Exclude<Filter, "All">;
};

const EXPENSE_GROUPS: { label: string; entries: ExpenseEntry[] }[] = [
  {
    label: "TODAY",
    entries: [
      {
        initials: "DA",
        avatarColor: "#cde3ff",
        avatarTextColor: "#1b4c88",
        name: "Groceries",
        subtitle: "Dad · Keells · split 3 ways",
        amount: "Rs 20,000",
        statusLabel: "Shared",
        paidBy: "Dad",
      },
      {
        initials: "MU",
        avatarColor: "#ffcfe0",
        avatarTextColor: "#8c2453",
        name: "Electricity",
        subtitle: "Mum · CEB bill",
        amount: "Rs 12,000",
        statusLabel: "Shared",
        paidBy: "Mum",
      },
    ],
  },
  {
    label: "YESTERDAY",
    entries: [
      {
        initials: "YO",
        avatarColor: "#ffd8a8",
        avatarTextColor: "#7a4b00",
        name: "Transport",
        subtitle: "You · fuel",
        amount: "Rs 15,000",
        statusLabel: "Pending",
        paidBy: "You",
      },
      {
        initials: "MU",
        avatarColor: "#ffcfe0",
        avatarTextColor: "#8c2453",
        name: "Pharmacy",
        subtitle: "Mum · health",
        amount: "Rs 3,250",
        statusLabel: "Shared",
        paidBy: "Mum",
      },
    ],
  },
];

const STATUS_STYLES: Record<ExpenseEntry["statusLabel"], { color: string; background: string }> = {
  Shared: { color: "#00a85c", background: "#e8f8f0" },
  Pending: { color: "#b4530a", background: "#fff1e6" },
};

export default function SharedExpensesScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [filter, setFilter] = useState<Filter>("All");
  const [addMemberVisible, setAddMemberVisible] = useState(false);
  const [addExpenseVisible, setAddExpenseVisible] = useState(false);

  const { status: familyStatus, family, members, activeMembers, currentMember, isAdmin } = useFamily();

  const memberRows = useMemo<MemberData[]>(
    () =>
      members.map((member) => {
        const isYou = member.id === currentMember?.id;
        const palette = getAvatarPalette(member.id);
        return {
          key: member.id,
          initials: getInitials(member.displayName),
          avatarColor: palette.background,
          avatarTextColor: palette.text,
          name: isYou ? "You" : member.displayName,
          roleSuffix: member.status === "active" && member.role === "admin" ? getRoleLabel(member) : undefined,
          subtitle: getMemberSubtitle(member, isYou),
          amount: "Rs 0",
          percent: "0%",
          highlighted: isYou,
        };
      }),
    [members, currentMember],
  );

  const handleBack = () => router.back();
  // TODO: build real search once there's a real data source to search over.
  const handleSearchPress = () => {};

  const visibleGroups = useMemo(() => {
    if (filter === "All") return EXPENSE_GROUPS;
    return EXPENSE_GROUPS.map((group) => ({
      ...group,
      entries: group.entries.filter((entry) => entry.paidBy === filter),
    })).filter((group) => group.entries.length > 0);
  }, [filter]);

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
                  <Text style={styles.summaryValue}>Rs 0</Text>
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
                {FILTERS.map((item) => {
                  const active = filter === item;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setFilter(item)}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                    >
                      <Text style={[styles.filterText, active && styles.filterTextActive]}>
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {visibleGroups.map((group) => (
                <View key={group.label} style={styles.expenseGroup}>
                  <Text style={styles.expenseGroupLabel}>{group.label}</Text>
                  <View style={styles.expenseCard}>
                    {group.entries.map((entry, index) => (
                      <ExpenseActivityRow
                        key={entry.name}
                        initials={entry.initials}
                        avatarColor={entry.avatarColor}
                        avatarTextColor={entry.avatarTextColor}
                        name={entry.name}
                        subtitle={entry.subtitle}
                        amount={entry.amount}
                        statusLabel={entry.statusLabel}
                        statusColor={STATUS_STYLES[entry.statusLabel].color}
                        statusBackground={STATUS_STYLES[entry.statusLabel].background}
                        showDivider={index < group.entries.length - 1}
                      />
                    ))}
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
        visible={addExpenseVisible}
        onClose={() => setAddExpenseVisible(false)}
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
