import { useState } from "react";
import useSWR from "swr";
import * as WebBrowser from "expo-web-browser";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowDownLeft, ArrowUpRight, Gift, Recycle } from "lucide-react-native";
import { Card, GradientButton } from "../../components/ui";
import { MemberCard } from "../../components/MemberCard";
import { api, fetcher, formatCurrency, formatDateTime, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { colors, radius, spacing } from "../../lib/theme";
import type { MemberCard as MemberCardType, Paginated, Wallet, WalletMutation } from "../../types";

const CREDIT_TYPES: WalletMutation["type"][] = ["topup", "commission", "cashback", "refund"];

export default function SaldoScreen() {
  const { user } = useAuth();
  const { data: wallet, mutate: mutateWallet } = useSWR<Wallet>("/wallet", fetcher);
  const { data: card } = useSWR<MemberCardType>("/member-card", fetcher);
  const { data: mutations, isLoading } = useSWR<Paginated<WalletMutation>>("/wallet/mutations", fetcher);

  const [amount, setAmount] = useState(100000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTopup() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ payment_url: string | null }>("/wallet/topup", {
        amount,
        payment_method: "BC",
        return_url: "canvasdist://payment-return",
      });
      if (res.payment_url) {
        // openAuthSessionAsync otomatis nutup browser & balik ke app begitu
        // Duitku redirect ke return_url (deep link) setelah pembayaran selesai.
        await WebBrowser.openAuthSessionAsync(res.payment_url, "canvasdist://payment-return");
        mutateWallet();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memulai top up.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <FlatList
        data={mutations?.data ?? []}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.md }}>
            <Text style={styles.title}>Saldo</Text>
            <Text style={styles.subtitle}>Top up dan lihat riwayat mutasi saldo kamu.</Text>

            <View style={{ marginVertical: spacing.md }}>
              <MemberCard
                name={user?.name ?? "-"}
                level={card?.level ?? user?.role ?? "sales"}
                cardNumber={card?.card_number ?? "•••• •••• •••• ••••"}
                balance={formatCurrency(wallet?.balance ?? 0)}
              />
            </View>

            <Card>
              <Text style={styles.cardLabel}>Top up cepat</Text>
              {error && (
                <View style={styles.errorBox}>
                  <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text>
                </View>
              )}
              <View style={{ flexDirection: "row", gap: spacing.sm, marginVertical: spacing.sm }}>
                {[100000, 500000, 1000000].map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setAmount(v)}
                    style={[styles.chip, amount === v && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, amount === v && styles.chipTextActive]}>
                      {v >= 1000000 ? `${v / 1000000}jt` : `${v / 1000}rb`}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <GradientButton onPress={handleTopup} loading={loading}>
                Top Up via Duitku
              </GradientButton>
            </Card>

            <Text style={[styles.cardLabel, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>Riwayat Mutasi</Text>
            {isLoading && <ActivityIndicator color={colors.primary1} />}
          </View>
        }
        renderItem={({ item: m }) => {
          const isCredit = CREDIT_TYPES.includes(m.type);
          const Icon = m.type === "commission" ? Gift : m.type === "cashback" ? Recycle : isCredit ? ArrowDownLeft : ArrowUpRight;
          return (
            <View style={styles.mutationRow}>
              <View style={[styles.mutationIcon, { backgroundColor: (isCredit ? colors.success : colors.danger) + "18" }]}>
                <Icon size={16} color={isCredit ? colors.success : colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mutationDesc}>{m.description ?? m.type}</Text>
                <Text style={styles.mutationDate}>{formatDateTime(m.created_at)}</Text>
              </View>
              <Text style={[styles.mutationAmount, { color: isCredit ? colors.success : colors.danger }]}>
                {isCredit ? "+" : "-"}
                {formatCurrency(m.amount)}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={{ textAlign: "center", color: colors.inkSoft, fontSize: 13 }}>Belum ada mutasi.</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "800", color: colors.ink },
  subtitle: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  cardLabel: { fontSize: 13, fontWeight: "700", color: colors.ink },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  chipActive: { backgroundColor: colors.primary1 + "18" },
  chipText: { fontSize: 12, fontWeight: "700", color: colors.ink },
  chipTextActive: { color: colors.primary1 },
  errorBox: { backgroundColor: colors.danger + "18", borderRadius: radius.sm, padding: 10, marginVertical: spacing.sm },
  mutationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  mutationIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  mutationDesc: { fontSize: 13, color: colors.ink, fontWeight: "600" },
  mutationDate: { fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  mutationAmount: { fontSize: 13, fontWeight: "700" },
});
