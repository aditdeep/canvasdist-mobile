import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, Mail, Phone, Shield } from "lucide-react-native";
import { Card, GhostButton, Badge } from "../../components/ui";
import { useAuth } from "../../lib/auth-context";
import { colors, spacing } from "../../lib/theme";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  wilayah: "Wilayah",
  agen: "Agen",
  reseller: "Reseller",
  sales: "Sales",
  gudang: "Gudang",
  kurir: "Kurir",
};

export default function ProfilScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Profil</Text>

        <Card style={{ alignItems: "center", paddingVertical: spacing.xl, marginTop: spacing.lg }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name
                ?.split(" ")
                .slice(0, 2)
                .map((s) => s[0])
                .join("")
                .toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Badge tone="primary">{ROLE_LABEL[user?.role ?? ""] ?? user?.role}</Badge>
        </Card>

        <Card style={{ marginTop: spacing.md, gap: spacing.md }}>
          <View style={styles.infoRow}>
            <Mail size={16} color={colors.inkSoft} />
            <Text style={styles.infoText}>{user?.email}</Text>
          </View>
          {user?.phone && (
            <View style={styles.infoRow}>
              <Phone size={16} color={colors.inkSoft} />
              <Text style={styles.infoText}>{user.phone}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Shield size={16} color={colors.inkSoft} />
            <Text style={styles.infoText}>{user?.is_active ? "Akun aktif" : "Akun nonaktif"}</Text>
          </View>
        </Card>

        <View style={{ marginTop: spacing.xl }}>
          <GhostButton onPress={() => logout()}>
            <LogOut size={16} color={colors.danger} />
            <Text style={{ color: colors.danger, fontWeight: "700", fontSize: 13 }}>Keluar</Text>
          </GhostButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  title: { fontSize: 20, fontWeight: "800", color: colors.ink },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  name: { fontSize: 16, fontWeight: "700", color: colors.ink, marginBottom: 6 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  infoText: { fontSize: 13, color: colors.ink },
});
