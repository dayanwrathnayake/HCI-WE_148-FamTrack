import { View } from "react-native";

type ProgressBarProps = {
  progress: number; // 0-1
  height?: number;
  trackColor: string;
  fillColor: string;
};

export function ProgressBar({ progress, height = 6, trackColor, fillColor }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View
      className="w-full overflow-hidden"
      style={{ height, borderRadius: height / 2, backgroundColor: trackColor }}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height: "100%",
          borderRadius: height / 2,
          backgroundColor: fillColor,
        }}
      />
    </View>
  );
}
