import { useMemo } from "react";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, BellOff } from "lucide-react-native";
import { useAppTheme } from "../../lib/theme-context";
import { spacing, type ThemeColors } from "../../lib/theme";

export default function NotifikasiScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={18} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Notifikasi</Text>
      </View>

      <View style={styles.emptyWrap}>
        <BellOff size={32} color={colors.inkFaint} />
        <Text style={styles.emptyText}>Belum ada notifikasi.</Text>
        <Text style={styles.emptySubtext}>
          Update status pesanan tetap dikirim lewat notifikasi HP kamu (push notification).
        </Text>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.lg },
    backBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.glassFillStrong,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    title: { fontSize: 18, fontWeight: "800", color: colors.ink },
    emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: 8 },
    emptyText: { fontSize: 14, fontWeight: "700", color: colors.ink },
    emptySubtext: { fontSize: 12, color: colors.inkSoft, textAlign: "center", maxWidth: 260 },
  });
}
