import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

type ProgressBarProps = {
  progress: number; // 0-1
  height?: number;
  trackColor: string;
  fillColor: string;
  fillGradientColors?: [string, string];
};

export function ProgressBar({
  progress,
  height = 6,
  trackColor,
  fillColor,
  fillGradientColors,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const fillStyle = { width: `${clamped * 100}%` as const, height: "100%" as const, borderRadius: height / 2 };

  return (
    <View
      className="w-full overflow-hidden"
      style={{ height, borderRadius: height / 2, backgroundColor: trackColor }}
    >
      {fillGradientColors ? (
        <LinearGradient
          colors={fillGradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={fillStyle}
        />
      ) : (
        <View style={[fillStyle, { backgroundColor: fillColor }]} />
      )}
    </View>
  );
}
