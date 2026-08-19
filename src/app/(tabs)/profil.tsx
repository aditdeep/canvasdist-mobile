import { useMemo } from "react";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Image, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, FileText, LogOut, Mail, Moon, Pencil, Phone, Shield, ShieldCheck, Sun } from "lucide-react-native";
import { Card, GhostButton, Badge } from "../../components/ui";
import { useAuth } from "../../lib/auth-context";
import { useAppTheme } from "../../lib/theme-context";
import { spacing, type ThemeColors } from "../../lib/theme";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  wilayah: "Wilayah",
  agen: "Agen",
  reseller: "Reseller",
  sales: "Sales",
  gudang: "Gudang",
  kurir: "Kurir",
};

const WEB_BASE_URL = "https://canvasdist-web.vercel.app";

export default function ProfilScreen() {
  const { user, logout } = useAuth();
  const { colors, isDark, setMode } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Profil</Text>

        <Card style={{ alignItems: "center", paddingVertical: spacing.xl, marginTop: spacing.lg }}>
          {user?.avatar_path ? (
            <Image source={{ uri: user.avatar_path }} style={styles.avatarImage} />
          ) : (
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
          )}
          <Text style={styles.name}>{user?.name}</Text>
          <Badge tone="primary">{ROLE_LABEL[user?.role ?? ""] ?? user?.role}</Badge>

          <GhostButton style={{ marginTop: spacing.md }} onPress={() => router.push("/edit-profil")}>
            <Pencil size={14} color={colors.ink} />
            <Text style={{ color: colors.ink, fontSize: 12, fontWeight: "700" }}>Edit Profil</Text>
          </GhostButton>
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

        <Text style={styles.sectionLabel}>Tampilan</Text>
        <Card style={{ marginBottom: spacing.md }}>
          <View style={styles.infoRow}>
            {isDark ? <Moon size={16} color={colors.inkSoft} /> : <Sun size={16} color={colors.inkSoft} />}
            <Text style={[styles.infoText, { flex: 1 }]}>Mode Gelap</Text>
            <Switch
              value={isDark}
              onValueChange={(v) => setMode(v ? "dark" : "light")}
              trackColor={{ false: "#d1d3e0", true: colors.primary1 }}
              thumbColor="#fff"
            />
          </View>
        </Card>

        <Text style={styles.sectionLabel}>Legal</Text>
        <Card style={{ gap: 2, marginBottom: spacing.xl }}>
          <Pressable
            style={styles.linkRow}
            onPress={() => WebBrowser.openBrowserAsync(`${WEB_BASE_URL}/privacy-policy`)}
          >
            <ShieldCheck size={16} color={colors.inkSoft} />
            <Text style={styles.linkText}>Kebijakan Privasi</Text>
            <ChevronRight size={16} color={colors.inkFaint} />
          </Pressable>
          <Pressable style={styles.linkRow} onPress={() => WebBrowser.openBrowserAsync(`${WEB_BASE_URL}/terms`)}>
            <FileText size={16} color={colors.inkSoft} />
            <Text style={styles.linkText}>Syarat &amp; Ketentuan</Text>
            <ChevronRight size={16} color={colors.inkFaint} />
          </Pressable>
        </Card>

        <GhostButton onPress={() => logout()}>
          <LogOut size={16} color={colors.danger} />
          <Text style={{ color: colors.danger, fontWeight: "700", fontSize: 13 }}>Keluar</Text>
        </GhostButton>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
    avatarImage: { width: 64, height: 64, borderRadius: 32, marginBottom: spacing.sm },
    avatarText: { color: "#fff", fontSize: 20, fontWeight: "800" },
    name: { fontSize: 16, fontWeight: "700", color: colors.ink, marginBottom: 6 },
    infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    infoText: { fontSize: 13, color: colors.ink },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.inkFaint,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      marginLeft: 4,
    },
    linkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 10 },
    linkText: { flex: 1, fontSize: 13, color: colors.ink, fontWeight: "600" },
  });
}
