import { useMemo } from "react";
import useSWR from "swr";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Badge } from "../components/ui";
import { fetcher, formatCurrency, formatDateTime } from "../lib/api";
import { useAppTheme } from "../lib/theme-context";
import { spacing, type ThemeColors } from "../lib/theme";
import type { Order, Paginated } from "../types";

const STATUS_TONE: Record<Order["status"], "primary" | "success" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
  approved: "primary",
  processing: "primary",
  shipped: "primary",
  completed: "success",
  cancelled: "danger",
  returned: "danger",
};

export function GenericTugas() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data, isLoading } = useSWR<Paginated<Order>>("/orders", fetcher);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Order</Text>
        <Text style={styles.subtitle}>Ringkasan order terbaru di jaringan kamu.</Text>
      </View>

      {isLoading && <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary1} />}

      <FlatList
        data={data?.data ?? []}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.sm }}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Text style={styles.orderNo}>{item.order_no}</Text>
                <Text style={styles.outletName} numberOfLines={1}>{item.outlet?.name ?? "-"}</Text>
                <Text style={styles.date}>{formatDateTime(item.created_at)}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 6 }}>
                <Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge>
                <Text style={styles.total}>{formatCurrency(item.total)}</Text>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={{ textAlign: "center", color: colors.inkSoft, marginTop: 24, fontSize: 13 }}>
              Belum ada order.
            </Text>
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
    subtitle: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },
    orderNo: { fontSize: 11, color: colors.inkSoft, fontFamily: "monospace" },
    outletName: { fontSize: 14, fontWeight: "700", color: colors.ink, marginTop: 2 },
    date: { fontSize: 11, color: colors.inkSoft, marginTop: 2 },
    total: { fontSize: 13, fontWeight: "700", color: colors.ink },
  });
}
