import { useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { colors } from "../constants/colors";

type Props = { visible: boolean; onClose: () => void; onIncome: () => void; onExpense: () => void };

export function AddTransactionSheet({ visible, onClose, onIncome, onExpense }: Props) {
  const [slide] = useState(() => new Animated.Value(340));
  const closing = useRef(false);
  const open = () => {
    closing.current = false;
    slide.setValue(340);
    Animated.timing(slide, { toValue: 0, duration: 240, useNativeDriver: true }).start();
  };
  const close = (action?: () => void) => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(slide, { toValue: 340, duration: 180, useNativeDriver: true }).start(({ finished }) => {
      if (finished) { onClose(); action?.(); }
    });
  };
  return (
    <Modal visible={visible} transparent animationType="none" onShow={open} onRequestClose={() => close()} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close add menu" style={StyleSheet.absoluteFill} onPress={() => close()} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slide }] }]}>
          <SafeAreaView edges={["bottom"]}>
            <View style={styles.handle} />
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Add Income" onPress={() => close(onIncome)} style={styles.action}>
                {({ pressed }) => <View style={[styles.card, styles.income, pressed && styles.pressed]}>
                  <View style={styles.iconTile}><SvgXml width={28} height={28} xml={'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M12 4v16m-7-7 7 7 7-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'} /></View>
                  <Text style={styles.actionText}>Add Income</Text><Text style={styles.subtitle}>Salary, gifts, etc.</Text>
                </View>}
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Add Expense" onPress={() => close(onExpense)} style={styles.action}>
                {({ pressed }) => <View style={[styles.card, styles.expense, pressed && styles.pressed]}>
                  <View style={styles.iconTile}><SvgXml width={28} height={28} xml={'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M12 20V4m-7 7 7-7 7 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'} /></View>
                  <Text style={styles.actionText}>Add Expense</Text><Text style={styles.subtitle}>Bills, shopping, etc.</Text>
                </View>}
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(16,24,42,0.3)" },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, width: "100%", maxWidth: 460, alignSelf: "center" },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.dotInactive, alignSelf: "center", marginBottom: 18 },
  actions: { flexDirection: "row-reverse", gap: 12 },
  action: { flex: 1, minWidth: 0, borderRadius: 20, overflow: "hidden" },
  card: { minHeight: 148, borderRadius: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, paddingVertical: 18 },
  income: { backgroundColor: "#1dcd9f" },
  expense: { backgroundColor: "#ef4444" },
  iconTile: { width: 48, height: 48, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  actionText: { color: "white", fontSize: 16, fontWeight: "700", textAlign: "center" },
  subtitle: { color: "rgba(255,255,255,0.72)", fontSize: 11, marginTop: 6, textAlign: "center" },
  pressed: { opacity: 0.8 },
});

