import { useMemo } from "react";
import { router } from "expo-router";
import useSWR from "swr";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Package } from "lucide-react-native";
import { Card, Badge, GradientButton } from "../../components/ui";
import { fetcher, formatCurrency, formatDateTime } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { useAppTheme } from "../../lib/theme-context";
import { spacing, type ThemeColors } from "../../lib/theme";
import type { Order, Paginated } from "../../types";

const STATUS_TONE: Record<Order["status"], "primary" | "success" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
  approved: "primary",
  processing: "primary",
  shipped: "primary",
  completed: "success",
  cancelled: "danger",
  returned: "danger",
};

const STATUS_LABEL: Record<Order["status"], string> = {
  pending: "Menunggu Konfirmasi",
  approved: "Disetujui",
  processing: "Diproses",
  shipped: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  returned: "Dikembalikan",
};

export default function PesananScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const { data, isLoading } = useSWR<Paginated<Order>>(user ? "/orders" : null, fetcher);

  const rows = data?.data ?? [];

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <View style={styles.emptyWrap}>
          <Package size={28} color={colors.inkFaint} />
          <Text style={styles.emptyText}>Masuk dulu untuk melihat riwayat pesanan kamu.</Text>
          <GradientButton style={{ marginTop: spacing.md }} onPress={() => router.push("/login")}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Masuk / Daftar</Text>
          </GradientButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Pesanan Saya</Text>
      </View>

      {isLoading && <ActivityIndicator color={colors.primary1} style={{ marginTop: 20 }} />}

      <FlatList
        data={rows}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.sm }}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View>
                <Text style={styles.orderNo}>{item.order_no}</Text>
                <Text style={styles.date}>{formatDateTime(item.created_at)}</Text>
              </View>
              <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
            </View>
            <Text style={styles.total}>{formatCurrency(item.total)}</Text>
          </Card>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyWrap}>
              <Package size={28} color={colors.inkFaint} />
              <Text style={styles.emptyText}>Belum ada pesanan.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    header: { padding: spacing.lg, paddingBottom: spacing.sm },
    title: { fontSize: 20, fontWeight: "800", color: colors.ink },
    orderNo: { fontSize: 12, fontFamily: "monospace", color: colors.inkSoft },
    date: { fontSize: 11, color: colors.inkFaint, marginTop: 2 },
    total: { fontSize: 15, fontWeight: "800", color: colors.primary1, marginTop: spacing.sm },
    emptyWrap: { alignItems: "center", marginTop: 40, gap: 8 },
    emptyText: { fontSize: 13, color: colors.inkSoft },
  });
}
