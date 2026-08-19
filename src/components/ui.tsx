import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, Text, View, type PressableProps, type ViewProps } from "react-native";
import { useAppTheme } from "../lib/theme-context";
import { radius } from "../lib/theme";

export function Card({ children, style, ...rest }: ViewProps) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.glassFillStrong,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          padding: 16,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        },
        style,
      ]}
      {...rest}
    >
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
  const { colors } = useAppTheme();
  return (
    <Pressable disabled={disabled || loading} {...rest} style={style}>
      {({ pressed }) => (
        <LinearGradient
          colors={[colors.primary1, colors.primary2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            {
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 20,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
            },
            pressed && { opacity: 0.85 },
            (disabled || loading) && { opacity: 0.5 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : typeof children === "string" ? (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{children}</Text>
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
  disabled,
  style,
  ...rest
}: PressableProps & { children: React.ReactNode; disabled?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      disabled={disabled}
      {...rest}
      style={({ pressed }) =>
        [
          {
            backgroundColor: colors.glassFillStrong,
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
          pressed && { opacity: 0.7 },
          disabled && { opacity: 0.5 },
          style,
        ] as never
      }
    >
      {typeof children === "string" ? (
        <Text style={{ color: colors.ink, fontWeight: "600", fontSize: 13 }}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export function Badge({
  children,
  tone = "primary",
}: {
  children: string;
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
}) {
  const { colors } = useAppTheme();
  const toneColors: Record<string, string> = {
    primary: colors.primary1,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    neutral: colors.inkSoft,
  };
  const c = toneColors[tone];
  return (
    <View style={{ backgroundColor: c + "20", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-start" }}>
      <Text style={{ color: c, fontSize: 11, fontWeight: "700" }}>{children}</Text>
    </View>
  );
}
