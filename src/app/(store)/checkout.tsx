import { useMemo, useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Truck, Store, CheckCircle2 } from "lucide-react-native";
import { Card, GradientButton, Badge } from "../../components/ui";
import { api, formatCurrency, ApiError } from "../../lib/api";
import { useCart } from "../../lib/cart-context";
import { useAppTheme } from "../../lib/theme-context";
import { radius, spacing, type ThemeColors } from "../../lib/theme";

export default function CheckoutScreen() {
  const { items, totalPrice, clear } = useCart();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrderNo, setSuccessOrderNo] = useState<string | null>(null);

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const order = await api.post<{ order_no: string }>("/orders", {
        fulfillment_type: fulfillment,
        payment_method: "cash",
        items: items.map((i) => ({ product_id: i.product.id, qty: i.qty })),
      });
      setSuccessOrderNo(order.order_no);
      clear();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal membuat pesanan, coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  if (successOrderNo) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <View style={styles.successWrap}>
          <CheckCircle2 size={44} color={colors.success} />
          <Text style={styles.successTitle}>Pesanan Berhasil Dibuat!</Text>
          <Text style={styles.successOrderNo}>{successOrderNo}</Text>
          <Text style={styles.successDesc}>
            Agen akan segera memproses pesananmu. Kamu bisa pantau statusnya di tab Pesanan.
          </Text>
          <GradientButton style={{ marginTop: spacing.md }} onPress={() => router.replace("/(store)" as never)}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Kembali Belanja</Text>
          </GradientButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Text style={styles.title}>Checkout</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text>
          </View>
        )}

        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
          {items.map(({ product, qty }) => (
            <View key={product.id} style={styles.summaryRow}>
              <Text style={styles.summaryName} numberOfLines={1}>
                {product.name} <Text style={{ color: colors.inkFaint }}>x{qty}</Text>
              </Text>
              <Text style={styles.summaryPrice}>
                {formatCurrency(Number(product.display_price ?? product.base_price) * qty)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalPrice)}</Text>
          </View>
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.sectionTitle}>Cara Terima Pesanan</Text>
          <View style={styles.fulfillmentRow}>
            <Pressable
              style={[styles.fulfillmentOption, fulfillment === "delivery" && styles.fulfillmentOptionActive]}
              onPress={() => setFulfillment("delivery")}
            >
              <Truck size={20} color={colors.primary1} />
              <Text style={styles.fulfillmentTitle}>Diantar</Text>
              <Text style={styles.fulfillmentDesc}>Dikirim kurir ke alamatmu</Text>
            </Pressable>
            <Pressable
              style={[styles.fulfillmentOption, fulfillment === "pickup" && styles.fulfillmentOptionActive]}
              onPress={() => setFulfillment("pickup")}
            >
              <Store size={20} color={colors.primary1} />
              <Text style={styles.fulfillmentTitle}>Ambil Sendiri</Text>
              <Text style={styles.fulfillmentDesc}>Ambil di outlet agen</Text>
            </Pressable>
          </View>
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
            <Badge tone="neutral">Bayar di tempat (COD)</Badge>
          </View>
          <Text style={styles.paymentNote}>
            Pembayaran online (saldo/transfer) bisa dipilih setelah pesanan dikonfirmasi agen.
          </Text>
        </Card>

        <GradientButton style={{ marginTop: spacing.lg }} onPress={handleSubmit} loading={saving}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
            Buat Pesanan — {formatCurrency(totalPrice)}
          </Text>
        </GradientButton>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    title: { fontSize: 20, fontWeight: "800", color: colors.ink },
    errorBox: { backgroundColor: colors.danger + "18", borderRadius: radius.sm, padding: 10, marginTop: spacing.sm },
    sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.ink, marginBottom: spacing.sm },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    summaryName: { flex: 1, fontSize: 12, color: colors.ink, marginRight: 8 },
    summaryPrice: { fontSize: 12, fontWeight: "600", color: colors.ink },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.glassBorder,
    },
    totalLabel: { fontSize: 13, fontWeight: "700", color: colors.ink },
    totalValue: { fontSize: 17, fontWeight: "800", color: colors.primary1 },
    fulfillmentRow: { flexDirection: "row", gap: spacing.sm },
    fulfillmentOption: {
      flex: 1,
      backgroundColor: colors.inputBg,
      borderRadius: radius.sm,
      padding: spacing.sm,
      borderWidth: 2,
      borderColor: "transparent",
    },
    fulfillmentOptionActive: { backgroundColor: colors.glassFillStrong, borderColor: colors.primary1 },
    fulfillmentTitle: { fontSize: 13, fontWeight: "700", color: colors.ink, marginTop: 6 },
    fulfillmentDesc: { fontSize: 10, color: colors.inkSoft, marginTop: 2 },
    paymentNote: { fontSize: 11, color: colors.inkSoft, marginTop: 6 },
    successWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
    successTitle: { fontSize: 17, fontWeight: "800", color: colors.ink, marginTop: spacing.md },
    successOrderNo: { fontSize: 13, fontFamily: "monospace", color: colors.primary1, marginTop: 4, fontWeight: "700" },
    successDesc: { fontSize: 12, color: colors.inkSoft, textAlign: "center", marginTop: spacing.sm, maxWidth: 260 },
  });
}
