import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import useSWR from "swr";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Package, Check, Clock, Store, Truck } from "lucide-react-native";
import { Card, Badge, GradientButton } from "../../components/ui";
import { api, fetcher, formatCurrency, formatDateTime } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { useAppTheme } from "../../lib/theme-context";
import { spacing, type ThemeColors } from "../../lib/theme";
import type { Order, OrderStatus, Paginated } from "../../types";

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

function getSteps(order: Order) {
  const statusOrder: OrderStatus[] = ["pending", "approved", "processing", "completed"];
  const currentIndex = statusOrder.indexOf(order.status === "shipped" ? "processing" : order.status);

  return [
    { label: "Dibuat", done: currentIndex >= 0 },
    { label: "Dikonfirmasi", done: currentIndex >= 1 },
    { label: order.fulfillment_type === "pickup" ? "Siap Diambil" : "Dikirim", done: currentIndex >= 2 || order.status === "shipped" },
    { label: order.fulfillment_type === "pickup" ? "Diambil" : "Diterima", done: order.status === "completed" },
  ];
}

function OrderCard({ order, colors, styles }: { order: Order; colors: ThemeColors; styles: ReturnType<typeof createStyles> }) {
  const [expanded, setExpanded] = useState(false);
  const steps = getSteps(order);
  const cancelled = order.status === "cancelled" || order.status === "returned";

  return (
    <Card>
      <Pressable onPress={() => setExpanded((e) => !e)}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={styles.orderNo}>{order.order_no}</Text>
            <Text style={styles.date}>{formatDateTime(order.created_at)}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <View style={{ flexDirection: "row", gap: 4 }}>
              <Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
            </View>
            <Badge tone={order.payment_status === "paid" ? "success" : "warning"}>
              {order.payment_status === "paid" ? "Lunas" : "Belum Bayar"}
            </Badge>
          </View>
        </View>
        <Text style={styles.total}>{formatCurrency(order.total)}</Text>
      </Pressable>

      {expanded && !cancelled && (
        <View style={styles.stepperWrap}>
          <View style={styles.stepperRow}>
            {steps.map((step, i) => (
              <View key={step.label} style={styles.stepItemWrap}>
                <View style={styles.stepItem}>
                  <View style={[styles.stepCircle, step.done && styles.stepCircleDone]}>
                    {step.done ? (
                      <Check size={12} color="#fff" />
                    ) : i === 2 ? (
                      order.fulfillment_type === "pickup" ? (
                        <Store size={11} color={colors.inkFaint} />
                      ) : (
                        <Truck size={11} color={colors.inkFaint} />
                      )
                    ) : (
                      <Clock size={11} color={colors.inkFaint} />
                    )}
                  </View>
                  <Text style={styles.stepLabel}>{step.label}</Text>
                </View>
                {i < steps.length - 1 && <View style={[styles.stepLine, step.done && styles.stepLineDone]} />}
              </View>
            ))}
          </View>

          {order.delivery_order && <Text style={styles.doNumber}>No. Surat Jalan: {order.delivery_order.do_number}</Text>}

          {order.items?.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.product?.name ?? `Produk #${item.product_id}`} x{item.qty}
              </Text>
              <Text style={styles.itemSubtotal}>{formatCurrency(item.subtotal)}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

export default function PesananScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const { data, isLoading, mutate } = useSWR<Paginated<Order>>(user ? "/orders" : null, fetcher);

  useEffect(() => {
    if (!data?.data) return;
    const pending = data.data.filter((o) => o.payment_method === "duitku" && o.payment_status === "unpaid" && o.status !== "cancelled");
    if (pending.length === 0) return;

    Promise.all(
      pending.map((o) => {
        const ref = o.payment_transactions?.[o.payment_transactions.length - 1]?.reference;
        if (!ref) return Promise.resolve();
        return api.post("/payment/duitku/check-status", { reference: ref }).catch(() => {});
      })
    ).then(() => mutate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.data?.length]);

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
        <Text style={styles.subtitle}>Ketuk pesanan untuk lihat status pengiriman.</Text>
      </View>

      {isLoading && <ActivityIndicator color={colors.primary1} style={{ marginTop: 20 }} />}

      <FlatList
        data={rows}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.sm }}
        renderItem={({ item }) => <OrderCard order={item} colors={colors} styles={styles} />}
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
    subtitle: { fontSize: 11, color: colors.inkSoft, marginTop: 2 },
    orderNo: { fontSize: 12, fontFamily: "monospace", color: colors.inkSoft },
    date: { fontSize: 11, color: colors.inkFaint, marginTop: 2 },
    total: { fontSize: 15, fontWeight: "800", color: colors.primary1, marginTop: spacing.sm },
    emptyWrap: { alignItems: "center", marginTop: 40, gap: 8, paddingHorizontal: spacing.xl },
    emptyText: { fontSize: 13, color: colors.inkSoft, textAlign: "center" },
    stepperWrap: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.glassBorder },
    stepperRow: { flexDirection: "row", alignItems: "flex-start" },
    stepItemWrap: { flexDirection: "row", alignItems: "flex-start", flex: 1 },
    stepItem: { alignItems: "center", gap: 4, width: 56 },
    stepCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.inputBg,
      alignItems: "center",
      justifyContent: "center",
    },
    stepCircleDone: { backgroundColor: colors.primary1 },
    stepLabel: { fontSize: 8, color: colors.inkSoft, textAlign: "center" },
    stepLine: { height: 2, flex: 1, backgroundColor: colors.inputBg, marginTop: 12, marginHorizontal: 2 },
    stepLineDone: { backgroundColor: colors.primary1 },
    doNumber: { fontSize: 11, color: colors.inkSoft, marginTop: spacing.sm, textAlign: "center" },
    itemRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
    itemName: { fontSize: 11, color: colors.inkSoft, flex: 1 },
    itemSubtotal: { fontSize: 11, color: colors.ink, fontWeight: "600" },
  });
}
