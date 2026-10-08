import { useRef, useState, type ReactNode } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";

export function SwipeIncomeRow({ children, onEdit, onDelete }: { children: ReactNode; onEdit: () => void; onDelete: () => void }) {
  const [translateX] = useState(() => new Animated.Value(0));
  const position = useRef({ offset: 0, start: 0 });

  const [open, setOpen] = useState(false);
  const settle = (next: number) => {
    position.current.offset = next;
    setOpen(next < 0);
    Animated.timing(translateX, { toValue: next, duration: 180, useNativeDriver: true }).start();
  };
  // PanResponder registers these callbacks; refs are read only when gestures run.
  /* eslint-disable react-hooks/refs */
  const responder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
    onPanResponderGrant: () => { translateX.stopAnimation(); position.current.start = position.current.offset; },
    onPanResponderMove: (_, gesture) => translateX.setValue(Math.max(-144, Math.min(0, position.current.start + gesture.dx))),
    onPanResponderRelease: (_, gesture) => settle(position.current.start + gesture.dx < -50 ? -144 : 0),
    onPanResponderTerminate: () => settle(position.current.offset),
  });
  /* eslint-enable react-hooks/refs */
  return <View style={styles.container}>
    <View style={styles.actions} pointerEvents={open ? "auto" : "none"} accessibilityElementsHidden={!open} importantForAccessibility={open ? "auto" : "no-hide-descendants"}>
      <Pressable accessibilityRole="button" onPress={() => { settle(0); onEdit(); }} style={[styles.action, styles.edit]}><Text style={styles.actionText}>Edit</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => { settle(0); onDelete(); }} style={[styles.action, styles.delete]}><Text style={styles.actionText}>Delete</Text></Pressable>
    </View>
    <Animated.View {...responder.panHandlers} style={[styles.foreground, { transform: [{ translateX }] }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Show income actions" accessibilityHint="Swipe left or tap to show Edit and Delete" onPress={() => settle(open ? 0 : -144)}>{children}</Pressable>
    </Animated.View>
  </View>;
}
const styles = StyleSheet.create({ container: { overflow: "hidden", borderRadius: 12 }, foreground: { backgroundColor: "white" }, actions: { position: "absolute", top: 0, bottom: 0, right: 0, width: 144, flexDirection: "row" }, action: { width: 72, justifyContent: "center", alignItems: "center" }, edit: { backgroundColor: "#05bf78" }, delete: { backgroundColor: "#ef4444" }, actionText: { color: "white", fontWeight: "700", fontSize: 12 } });
