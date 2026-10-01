import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

type CircularProgressRingProps = {
  progress: number; // 0-1
  size: number;
  strokeWidth: number;
  trackColor: string;
  progressColor: string;
  centerLabel: string;
  centerSubLabel?: string;
};

export function CircularProgressRing({
  progress,
  size,
  strokeWidth,
  trackColor,
  progressColor,
  centerLabel,
  centerSubLabel,
}: CircularProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const dashOffset = circumference * (1 - clamped);
  const center = size / 2;
  const innerSize = size - strokeWidth * 2;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={center} cy={center} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View
        style={[
          styles.innerCircle,
          { width: innerSize, height: innerSize, borderRadius: innerSize / 2 },
        ]}
      >
        <Text style={styles.centerLabel}>{centerLabel}</Text>
        {centerSubLabel ? <Text style={styles.centerSubLabel}>{centerSubLabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  innerCircle: {
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    fontSize: 19,
    fontWeight: "700",
    color: "#0e1116",
  },
  centerSubLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "400",
    color: "#8a93a0",
  },
});
