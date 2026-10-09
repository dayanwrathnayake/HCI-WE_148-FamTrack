import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppBottomNav } from "../components/AppBottomNav";
import { IncomeHeader } from "../components/IncomeHeader";
import { useNotifications } from "../context/NotificationContext";

export default function NotificationsScreen() {
  const { notifications, markAllRead } = useNotifications();
  useFocusEffect(useCallback(() => { markAllRead(); }, [markAllRead]));
  return <View style={styles.screen}><SafeAreaView style={styles.screen} edges={["top"]}>
    <IncomeHeader title="Bills & Notifications" onBack={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/home")} />
    <FlatList data={notifications} keyExtractor={item => item.id} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
      renderItem={({ item }) => <View style={styles.card}>
        <View style={[styles.icon, { backgroundColor: item.kind === "income" ? "#daf8e7" : item.kind === "bill" ? "#e5e0ff" : "#fff0e7" }]}><Text style={styles.emoji}>{item.emoji}</Text></View>
        <View style={styles.details}><View style={styles.row}><Text style={styles.title}>{item.title}</Text><Text style={[styles.amount, { color: item.kind === "income" ? "#079b60" : "#ef4444" }]}>{item.kind === "income" ? "+" : "−"}Rs {item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></View>
          <View style={styles.row}><Text style={styles.detail}>{item.detail}</Text><Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, {new Date(item.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</Text></View>
        </View>
      </View>}
      ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>You’re all caught up</Text><Text style={styles.detail}>Your new bills and money updates will appear here.</Text></View>} />
  </SafeAreaView><AppBottomNav activeRouteName="home" /></View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "white" }, list: { width: "100%", maxWidth: 550, alignSelf: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 10 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#f4f5f6", borderRadius: 15, padding: 12, gap: 10 }, icon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" }, emoji: { fontSize: 23 }, details: { flex: 1, gap: 6 }, row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 5 }, title: { fontSize: 14, fontWeight: "600", color: "#242b36", flexShrink: 1 }, amount: { fontSize: 13, fontWeight: "600" }, detail: { fontSize: 11, color: "#6b7280" }, date: { fontSize: 10, color: "#6b7280" }, empty: { alignItems: "center", paddingVertical: 50, gap: 10 }, emptyTitle: { fontSize: 18, fontWeight: "600", color: "#242b36" },
});
