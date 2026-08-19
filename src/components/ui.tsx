import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewProps,
} from "react-native";
import { colors, radius } from "../lib/theme";

export function Card({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function GradientButton({
  children,
  loading,
  disabled,
  style,
  ...rest
}: PressableProps & { children: React.ReactNode; loading?: boolean }) {
  return (
    <Pressable disabled={disabled || loading} {...rest} style={style}>
      {({ pressed }) => (
        <LinearGradient
          colors={[colors.primary1, colors.primary2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientButton, pressed && { opacity: 0.85 }, (disabled || loading) && { opacity: 0.5 }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : typeof children === "string" ? (
            <Text style={styles.gradientButtonText}>{children}</Text>
          ) : (
            children
          )}
        </LinearGradient>
      )}
    </Pressable>
  );
}

export function GhostButton({
  children,
  style,
  ...rest
}: PressableProps & { children: React.ReactNode }) {
  return (
    <Pressable {...rest} style={({ pressed }) => [styles.ghostButton, pressed && { opacity: 0.7 }, style as never]}>
      {typeof children === "string" ? <Text style={styles.ghostButtonText}>{children}</Text> : children}
    </Pressable>
  );
}

const TONE_COLORS: Record<string, string> = {
  primary: colors.primary1,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  neutral: colors.inkSoft,
};

export function Badge({ children, tone = "primary" }: { children: string; tone?: keyof typeof TONE_COLORS }) {
  const c = TONE_COLORS[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c + "20" }]}>
      <Text style={[styles.badgeText, { color: c }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassFillStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
    shadowColor: "#1e1e3c",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  gradientButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  gradientButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  ghostButton: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  ghostButtonText: {
    color: colors.ink,
    fontWeight: "600",
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
