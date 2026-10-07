import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { Icon } from "../../components/Icon";
import { INITIAL_GROUP_MEMBERS } from "../../constants/group";
import { useAccount } from "../../context/AccountContext";

const glyphs = {
  account: '<circle cx="12" cy="8" r="4" fill="#699cab"/><path d="M4 21v-3a8 8 0 0 1 16 0v3" fill="#699cab"/>',
  group: '<circle cx="8" cy="7" r="3" fill="#8655ee"/><circle cx="17" cy="8" r="3" fill="#ffbd37"/><path d="M2 20v-4a6 6 0 0 1 12 0v4" fill="#8655ee"/><path d="M14 12a5 5 0 0 1 8 4v4h-6v-4" fill="#ffbd37"/>',
  report: '<rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="#b68b5b" stroke-width="2"/><path d="M8 7h8M8 11h8M8 15h8" stroke="#b68b5b" stroke-width="1.5"/>',
  bell: '<path d="M5 16h14l-2-3V9a5 5 0 0 0-10 0v4z" fill="#d9b522"/><path d="M10 19h4M12 2v2" stroke="#967913" stroke-width="2" stroke-linecap="round"/>',
  lock: '<path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#74a7b5" stroke-width="2"/><rect x="6" y="10" width="12" height="11" rx="2" fill="#dbbd54"/><path d="M12 14v3" stroke="white" stroke-width="2"/>',
  help: '<path d="M9 7a3 3 0 1 1 5 2c-2 1-2 2-2 4" fill="none" stroke="#f52b55" stroke-width="2.5" stroke-linecap="round"/><circle cx="12" cy="18" r="1.3" fill="#f52b55"/>',
  phone: '<path d="m5 3 4 4-2 3c2 3 4 5 7 6l3-2 4 4-2 3C10 21 3 14 3 5z" fill="#627c75"/>',
  gear: '<path d="m10 2 4 0 1 3 3-1 3 3-1 3 3 1v4l-3 1 1 3-3 3-3-1-1 3h-4l-1-3-3 1-3-3 1-3-3-1v-4l3-1-1-3 3-3 3 1z" fill="#080808"/><circle cx="12" cy="13" r="4" fill="white"/>',
};
function ProfileGlyph({ name, size = 19 }: { name: keyof typeof glyphs; size?: number }) {
  return <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26">${glyphs[name]}</svg>`} width={size} height={size} />;
}
type RowProps = { title: string; subtitle: string; icon: keyof typeof glyphs; background: string; onPress: () => void; badge?: string; last?: boolean };
function ProfileRow({ title, subtitle, icon, background, onPress, badge, last }: RowProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.row, !last && styles.divider, pressed && styles.pressed]}>
      <View style={[styles.rowIcon, { backgroundColor: background }]}><ProfileGlyph name={icon} /></View>
      <View style={styles.rowText}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowSubtitle}>{subtitle}</Text></View>
      {badge ? <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View> : <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}
export default function ProfileScreen() {
  const { account } = useAccount();
  const { accountUpdated } = useLocalSearchParams<{ accountUpdated?: string }>();
  const showSuccess = !!accountUpdated;
  useEffect(() => {
    if (!accountUpdated) return;
    const timeout = setTimeout(() => {
      router.setParams({ accountUpdated: undefined });
    }, 3000);
    return () => clearTimeout(timeout);
  }, [accountUpdated]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const [preferencesY, setPreferencesY] = useState(0);
  const showPendingFeature = (title: string) => Alert.alert(title, `${title} is not available yet.`);
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to Home" hitSlop={10} onPress={() => router.replace("/(tabs)/home")} style={styles.backButton}><Icon name="arrowLeft" size={19} /></Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Go to preferences" hitSlop={10} onPress={() => scrollRef.current?.scrollTo({ y: preferencesY, animated: true })}><ProfileGlyph name="gear" size={29} /></Pressable>
      </View>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.identity}>
            <View style={styles.avatarFrame}><Image source={account.avatar} style={styles.avatar} resizeMode="cover" accessibilityLabel={`${account.name} profile photo`} /></View>
            <View style={styles.identityText}>
              <Text style={styles.name}>{account.name}</Text><Text style={styles.email}>{account.email}</Text>
              <View style={styles.roleBadge}><Text style={styles.roleText}>Family admin · Perera</Text></View>
            </View>
          </View>
          <View style={styles.stats}>
            {[{ label: "This month", value: "Rs 26,400" }, { label: "Members", value: String(INITIAL_GROUP_MEMBERS.length + 1) }, { label: "Streak", value: "12 days" }].map(stat => (
              <View key={stat.label} style={styles.stat}><Text style={styles.statLabel}>{stat.label}</Text><Text style={styles.statValue}>{stat.value}</Text></View>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.menuCard}>
            <ProfileRow title="My Account" subtitle="Name, email, password" icon="account" background="#e8f8f2" onPress={() => router.push("/my-account")} />
            <ProfileRow title="Manage Group" subtitle="Members, roles, invites" icon="group" background="#f0efff" badge={String(INITIAL_GROUP_MEMBERS.length + 1)} onPress={() => router.push("/manage-group")} />
            <ProfileRow title="Reports" subtitle="Monthly spending summary" icon="report" background="#fff1e7" last onPress={() => router.push("/reports")} />
          </View>
        </View>
        <View style={styles.section} onLayout={event => setPreferencesY(event.nativeEvent.layout.y)}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>
          <View style={styles.menuCard}>
            <View style={[styles.row, styles.divider]}>
              <View style={[styles.rowIcon, { backgroundColor: "#f0efff" }]}><ProfileGlyph name="bell" /></View>
              <View style={styles.rowText}><Text style={styles.rowTitle}>Notifications</Text><Text style={styles.rowSubtitle}>Budget alerts, bill reminders</Text></View>
              <Switch accessibilityLabel="Budget alerts and bill reminders" value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: "#d9dfe2", true: "#00c878" }} thumbColor="#ffffff" style={styles.toggle} />
            </View>
            <ProfileRow title="Security" subtitle="App lock, biometrics" icon="lock" background="#eaf8ff" onPress={() => showPendingFeature("Security")} />
            <ProfileRow title="Help Center" subtitle="FAQs and guides" icon="help" background="#ffe9ef" onPress={() => showPendingFeature("Help Center")} />
            <ProfileRow title="Contact Us" subtitle="We reply within a day" icon="phone" background="#e8f8f1" last onPress={() => showPendingFeature("Contact Us")} />
          </View>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.replace("/login")} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}><Text style={styles.logoutText}>Log out</Text></Pressable>
      </ScrollView>
      {showSuccess && (
        <View pointerEvents="none" style={styles.successWrap}>
          <View style={styles.successBubble}>
            <Text style={styles.successCheck}>✓</Text>
            <Text accessibilityLiveRegion="polite" style={styles.successText}>Account updated successfully</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  successWrap: { position: "absolute", bottom: 20, left: 16, right: 16, alignItems: "center" },
  successBubble: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#e8faf1", borderColor: "#b6ebce", borderWidth: 1, borderRadius: 26, paddingHorizontal: 18, paddingVertical: 14, shadowColor: "#075c38", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  successCheck: { color: "#05864e", fontSize: 18, fontWeight: "700" },
  successText: { color: "#07633d", fontSize: 13, fontWeight: "600", flexShrink: 1 },
  screen: { flex: 1, backgroundColor: "#ffffff" },
  header: { height: 55, paddingHorizontal: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#10182a", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#242424" },
  content: { paddingHorizontal: 16, paddingBottom: 28, width: "100%", maxWidth: 600, alignSelf: "center" },
  profileCard: { backgroundColor: "#f6f6f6", borderRadius: 25, padding: 18 },
  identity: { flexDirection: "row", alignItems: "center", gap: 11 },
  avatarFrame: { width: 78, height: 78, borderWidth: 1.5, borderColor: "#00ce69", borderRadius: 29, overflow: "hidden", backgroundColor: "white" },
  avatar: { width: "100%", height: "100%" },
  identityText: { flex: 1, minWidth: 0 },
  name: { fontSize: 20, fontWeight: "800", color: "#080808" },
  email: { fontSize: 12, color: "#a0a0a0", marginTop: 1 },
  roleBadge: { backgroundColor: "#19cda0", alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6, marginTop: 8 },
  roleText: { fontSize: 11, fontWeight: "600", color: "#052820" },
  stats: { flexDirection: "row", gap: 11, marginTop: 18 },
  stat: { flex: 1, borderWidth: 0.8, borderColor: "#00ce69", borderRadius: 13, paddingHorizontal: 11, paddingVertical: 9 },
  statLabel: { fontSize: 9, color: "#808080" },
  statValue: { fontSize: 13, fontWeight: "800", color: "#111111", marginTop: 3 },
  section: { marginTop: 19, marginHorizontal: 9 },
  sectionLabel: { fontSize: 9, fontWeight: "600", letterSpacing: 1, color: "#8491a5", marginLeft: 9, marginBottom: 8 },
  menuCard: { borderRadius: 21, backgroundColor: "white", borderWidth: 1, borderColor: "#e4e4e4", paddingHorizontal: 13, paddingVertical: 3, shadowColor: "#000000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  row: { flexDirection: "row", alignItems: "center", minHeight: 59, paddingVertical: 11, gap: 12 },
  divider: { borderBottomWidth: 0.7, borderBottomColor: "#f1f2f4" },
  rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 13, fontWeight: "600", color: "#10131b" },
  rowSubtitle: { fontSize: 10, color: "#8b96a6", marginTop: 2 },
  chevron: { color: "#c4cbd5", fontSize: 16, paddingRight: 2 },
  badge: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#e5faf1", alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#10bf85", fontSize: 10, fontWeight: "700" },
  toggle: { transform: [{ scale: 0.8 }], marginRight: -5 },
  logout: { marginHorizontal: 9, marginTop: 16, minHeight: 58, borderWidth: 0.7, borderColor: "#ff8c8c", borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#fffdfd", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.16, shadowRadius: 2, elevation: 2 },
  logoutText: { color: "#ff0000", fontSize: 15, fontWeight: "500" },
  pressed: { opacity: 0.65 },
});
