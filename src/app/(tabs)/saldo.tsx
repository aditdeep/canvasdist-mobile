import { useMemo, useState } from "react";
import useSWR from "swr";
import * as WebBrowser from "expo-web-browser";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowDownLeft, ArrowUpRight, Gift, Recycle, Banknote, X } from "lucide-react-native";
import { Card, GradientButton, GhostButton } from "../../components/ui";
import { MemberCard } from "../../components/MemberCard";
import { api, fetcher, formatCurrency, formatDateTime, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { useAppTheme } from "../../lib/theme-context";
import { radius, spacing, type ThemeColors } from "../../lib/theme";
import type { MemberCard as MemberCardType, Paginated, Wallet, WalletMutation } from "../../types";

const CREDIT_TYPES: WalletMutation["type"][] = ["topup", "commission", "cashback", "refund"];

export default function SaldoScreen() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: wallet, mutate: mutateWallet } = useSWR<Wallet>("/wallet", fetcher);
  const { data: card } = useSWR<MemberCardType>("/member-card", fetcher);
  const { data: mutations, isLoading } = useSWR<Paginated<WalletMutation>>("/wallet/mutations", fetcher);

  const [amount, setAmount] = useState(100000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

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
            <Text style={styles.subtitle}>Top up, tarik saldo, dan lihat riwayat mutasi.</Text>

            <View style={{ marginVertical: spacing.md }}>
              <MemberCard
                name={user?.name ?? "-"}
                level={card?.level ?? user?.role ?? "sales"}
                cardNumber={card?.card_number ?? "•••• •••• •••• ••••"}
                balance={formatCurrency(wallet?.balance ?? 0)}
              />
            </View>

            <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md }}>
              <GhostButton style={{ flex: 1 }} onPress={() => setWithdrawOpen(true)}>
                <Banknote size={16} color={colors.ink} />
                <Text style={{ color: colors.ink, fontSize: 13, fontWeight: "700" }}>Tarik Saldo</Text>
              </GhostButton>
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

      <WithdrawModal
        visible={withdrawOpen}
        maxAmount={parseFloat(wallet?.balance ?? "0")}
        onClose={() => setWithdrawOpen(false)}
        onSaved={() => {
          setWithdrawOpen(false);
          mutateWallet();
        }}
      />
    </SafeAreaView>
  );
}

function WithdrawModal({
  visible,
  maxAmount,
  onClose,
  onSaved,
}: {
  visible: boolean;
  maxAmount: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createModalStyles(colors), [colors]);
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const amt = Number(amount);
    if (!amt || amt < 50000) {
      setError("Minimal penarikan Rp50.000.");
      return;
    }
    if (amt > maxAmount) {
      setError("Saldo tidak mencukupi.");
      return;
    }
    if (!bankName || !accountNumber || !accountHolderName) {
      setError("Lengkapi data rekening bank.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.post("/withdrawals", {
        amount: amt,
        bank_name: bankName,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
      });
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountHolderName("");
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengajukan penarikan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Tarik Saldo</Text>
              <Pressable onPress={onClose}>
                <X size={20} color={colors.inkSoft} />
              </Pressable>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text>
              </View>
            )}

            <Text style={styles.helper}>
              Saldo tersedia: {formatCurrency(maxAmount)}. Pengajuan akan mengunci saldo sampai disetujui admin.
            </Text>

            <Text style={styles.label}>Jumlah Penarikan</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="Minimal Rp50.000"
              placeholderTextColor={colors.inkFaint}
            />

            <Text style={styles.label}>Nama Bank</Text>
            <TextInput
              style={styles.input}
              value={bankName}
              onChangeText={setBankName}
              placeholder="mis. BCA, Mandiri, BRI"
              placeholderTextColor={colors.inkFaint}
            />

            <Text style={styles.label}>Nomor Rekening</Text>
            <TextInput
              style={styles.input}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
              placeholder="Nomor rekening tujuan"
              placeholderTextColor={colors.inkFaint}
            />

            <Text style={styles.label}>Nama Pemilik Rekening</Text>
            <TextInput
              style={styles.input}
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              placeholder="Sesuai buku tabungan"
              placeholderTextColor={colors.inkFaint}
            />

            <View style={{ height: spacing.md }} />
            <GradientButton onPress={submit} loading={saving}>
              Ajukan Penarikan
            </GradientButton>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    title: { fontSize: 20, fontWeight: "800", color: colors.ink },
    subtitle: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },
    cardLabel: { fontSize: 13, fontWeight: "700", color: colors.ink },
    chip: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: "center", backgroundColor: colors.inputBg },
    chipActive: { backgroundColor: colors.primary1 + "18" },
    chipText: { fontSize: 12, fontWeight: "700", color: colors.ink },
    chipTextActive: { color: colors.primary1 },
    errorBox: { backgroundColor: colors.danger + "18", borderRadius: radius.sm, padding: 10, marginVertical: spacing.sm },
    mutationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.glassFillStrong,
      borderRadius: radius.sm,
      padding: spacing.sm,
    },
    mutationIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    mutationDesc: { fontSize: 13, color: colors.ink, fontWeight: "600" },
    mutationDate: { fontSize: 11, color: colors.inkSoft, marginTop: 2 },
    mutationAmount: { fontSize: 13, fontWeight: "700" },
  });
}

function createModalStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: "88%" },
    sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
    sheetTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
    helper: { fontSize: 11, color: colors.inkFaint, marginBottom: spacing.md },
    label: { fontSize: 12, fontWeight: "600", color: colors.inkSoft, marginBottom: 6, marginTop: spacing.sm },
    input: {
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: radius.sm,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.ink,
    },
    errorBox: { backgroundColor: colors.danger + "18", borderRadius: radius.sm, padding: 10, marginBottom: spacing.sm },
  });
}
