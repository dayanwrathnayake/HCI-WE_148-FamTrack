import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "./Icon";
export function IncomeHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  return <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Go back" style={styles.back} hitSlop={10} onPress={onBack}><Icon name="arrowLeft" size={18} /></Pressable><Text style={styles.title}>{title}</Text>{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}</View>;
}
const styles = StyleSheet.create({
  header: { minHeight: 64, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  back: { position: "absolute", left: 22, top: 16, width: 30, height: 30, borderRadius: 15, backgroundColor: "#10182a", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 23, fontWeight: "700", color: "#242424" },
  subtitle: { fontSize: 11, color: "#8a93a6", marginTop: 4 },
});
