import useSWR from "swr";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "../../components/ui";
import { MemberCard } from "../../components/MemberCard";
import { fetcher, formatCurrency } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { colors, spacing } from "../../lib/theme";
import type { Wallet, MemberCard as MemberCardType, Paginated, Order, Visit } from "../../types";

export default function HomeScreen() {
  const { user } = useAuth();
  const { data: wallet } = useSWR<Wallet>("/wallet", fetcher);
  const { data: card } = useSWR<MemberCardType>("/member-card", fetcher);
  const { data: orders } = useSWR<Paginated<Order>>("/orders", fetcher);
  const { data: visits } = useSWR<Paginated<Visit>>("/visits", fetcher);

  const activeOrders = (orders?.data ?? []).filter((o) => !["completed", "cancelled"].includes(o.status)).length;
  const todayVisits = (visits?.data ?? []).filter((v) => {
    if (!v.visited_at) return false;
    const d = new Date(v.visited_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.greeting}>Halo, {user?.name?.split(" ")[0] ?? "Pengguna"} 👋</Text>
        <Text style={styles.subtitle}>Ini ringkasan aktivitas kamu hari ini.</Text>

        <View style={styles.statRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Saldo</Text>
            <Text style={styles.statValue}>{formatCurrency(wallet?.balance ?? 0)}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Order Aktif</Text>
            <Text style={styles.statValue}>{activeOrders}</Text>
          </Card>
        </View>

        {user?.role === "sales" && (
          <Card style={{ marginBottom: spacing.md }}>
            <Text style={styles.statLabel}>Kunjungan Hari Ini</Text>
            <Text style={styles.statValue}>{todayVisits}</Text>
          </Card>
        )}

        <Text style={styles.sectionTitle}>Kartu Member Kamu</Text>
        <MemberCard
          name={user?.name ?? "-"}
          level={card?.level ?? user?.role ?? "sales"}
          cardNumber={card?.card_number ?? "•••• •••• •••• ••••"}
          balance={formatCurrency(wallet?.balance ?? 0)}
        />

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  greeting: { fontSize: 20, fontWeight: "800", color: colors.ink },
  subtitle: { fontSize: 13, color: colors.inkSoft, marginTop: 2, marginBottom: spacing.lg },
  statRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  statCard: { flex: 1 },
  statLabel: { fontSize: 11, color: colors.inkSoft, fontWeight: "600", marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.ink },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.ink, marginBottom: spacing.sm, marginTop: spacing.sm },
});
