import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export function SpendingDonut({ categories, total }: { categories: { name: string; amount: number; color: string }[]; total: number }) {
  const radius = 94;
  const circumference = 2 * Math.PI * radius;
  return <View style={styles.wrap} accessible accessibilityLabel={`Total spending Rs ${total.toLocaleString("en-US")}`}>
    <Svg width={224} height={224} viewBox="0 0 224 224">
      <Circle cx={112} cy={112} r={radius} fill="none" stroke="#e9edf1" strokeWidth={15} />
      {categories.map((category, index) => {
        const length = category.amount / total * circumference;
        const start = categories.slice(0, index).reduce((sum, item) => sum + item.amount, 0) / total * circumference;
        return <Circle key={category.name} cx={112} cy={112} r={radius} fill="none" stroke={category.color} strokeWidth={15} strokeDasharray={`${Math.max(0.1, length - 5)} ${circumference}`} strokeDashoffset={-start} transform="rotate(-90 112 112)" />;
      })}
    </Svg>
    <View style={styles.center}><Text style={styles.label}>Total spent</Text><Text style={styles.amount} adjustsFontSizeToFit numberOfLines={1}>Rs {total.toLocaleString("en-US", { maximumFractionDigits: 2 })}</Text></View>
  </View>;
}
const styles = StyleSheet.create({
  wrap: { width: 224, height: 224, alignSelf: "center", justifyContent: "center", alignItems: "center" },
  center: { position: "absolute", width: 165, alignItems: "center" },
  label: { fontSize: 12, color: "#7d8896", marginBottom: 5 },
  amount: { fontSize: 23, fontWeight: "800", color: "#111827" },
});

