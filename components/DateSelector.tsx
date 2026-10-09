import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { localDate } from "../constants/income";
import Svg, { Path, Rect } from "react-native-svg";

export function DateSelector({ value, onChange, disabled = false }: { value: string; onChange: (date: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date(`${value}T12:00:00`));
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const display = new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  return <>
    <Pressable disabled={disabled} accessibilityRole="button" accessibilityLabel={`Select date, ${display}`} onPress={() => { setMonth(new Date(`${value}T12:00:00`)); setOpen(true); }} style={styles.field}><Text style={styles.value}>{display}</Text><View style={styles.calendar}><Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#078653" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Rect x={3} y={5} width={18} height={16} rx={3} /><Path d="M7 3v4M17 3v4M3 11h18M8 15h2M14 15h2M8 18h2" /></Svg></View></Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}><Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close calendar" accessibilityRole="button" onPress={() => setOpen(false)} />
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text style={styles.title}>Select date</Text>
          <View style={styles.header}><Pressable style={styles.arrow} accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setMonth(new Date(year, monthIndex - 1, 1))}><Text style={styles.arrowText}>‹</Text></Pressable><Text style={styles.month}>{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</Text><Pressable style={styles.arrow} accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setMonth(new Date(year, monthIndex + 1, 1))}><Text style={styles.arrowText}>›</Text></Pressable></View>
          <View style={styles.grid}>{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => <View key={day} style={styles.cell}><Text style={styles.weekday}>{day}</Text></View>)}</View>
          <View style={styles.grid}>{Array.from({ length: Math.ceil((firstDay + days) / 7) * 7 }, (_, index) => {
            const day = index - firstDay + 1;
            if (day < 1 || day > days) return <View key={index} style={styles.cell} />;
            const date = localDate(new Date(year, monthIndex, day));
            const selected = date === value;
            return <Pressable key={index} style={styles.cell} accessibilityRole="button" accessibilityLabel={new Date(year, monthIndex, day).toDateString()} accessibilityState={{ selected }} onPress={() => { onChange(date); setOpen(false); }}><View style={[styles.day, selected && styles.selected]}><Text style={[styles.dayText, selected && styles.selectedText]}>{day}</Text></View></Pressable>;
          })}</View>
          <View style={styles.footer}><Pressable style={styles.action} accessibilityRole="button" onPress={() => { onChange(localDate()); setOpen(false); }}><Text style={styles.actionText}>Today</Text></Pressable><Pressable style={styles.action} accessibilityRole="button" onPress={() => setOpen(false)}><Text style={styles.cancel}>Cancel</Text></Pressable></View>
        </View>
      </View>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  field: { minHeight: 44, borderWidth: 1, borderColor: "#e1e5ec", borderRadius: 12, paddingLeft: 12, paddingRight: 4, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 }, value: { fontSize: 12, color: "#17202e", flexShrink: 1 }, calendar: { width: 36, height: 36, borderRadius: 9, backgroundColor: "#e8f8f0", alignItems: "center", justifyContent: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(16,24,42,0.35)", justifyContent: "center", alignItems: "center", padding: 20 }, dialog: { width: "100%", maxWidth: 370, borderRadius: 24, padding: 18, backgroundColor: "white" }, title: { fontSize: 19, fontWeight: "700", color: "#17202e", marginBottom: 10 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }, arrow: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, arrowText: { fontSize: 28, color: "#078653" }, month: { fontSize: 15, fontWeight: "600", color: "#17202e" }, grid: { flexDirection: "row", flexWrap: "wrap" }, cell: { width: "14.285714%", height: 44, alignItems: "center", justifyContent: "center" }, weekday: { fontSize: 12, fontWeight: "600", color: "#6b7280" }, day: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" }, selected: { backgroundColor: "#05bf78" }, dayText: { fontSize: 14, color: "#17202e" }, selectedText: { color: "white", fontWeight: "700" }, footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 }, action: { minHeight: 44, paddingHorizontal: 14, justifyContent: "center" }, actionText: { fontSize: 14, fontWeight: "600", color: "#078653" }, cancel: { fontSize: 14, color: "#6b7280" },
});
