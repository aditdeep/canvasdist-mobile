import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, User as UserIcon, ShieldCheck, FileText, ChevronRight, MapPin, Save } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import { Card, GradientButton, GhostButton } from "../../components/ui";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { useAppTheme } from "../../lib/theme-context";
import { radius, spacing, type ThemeColors } from "../../lib/theme";

const WEB_BASE_URL = "https://canvasdist-web.vercel.app";

export default function AkunScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [address, setAddress] = useState(user?.outlet?.address ?? user?.address ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setAddress(user?.outlet?.address ?? user?.address ?? "");
    setPhone(user?.phone ?? "");
  }, [user]);

  async function handleSaveAddress() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await api.post("/auth/address", { address, phone });
      await refreshUser();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan alamat.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <View style={styles.guestWrap}>
          <View style={styles.avatarPlaceholder}>
            <UserIcon size={26} color={colors.inkFaint} />
          </View>
          <Text style={styles.guestTitle}>Kamu belum masuk</Text>
          <Text style={styles.guestSubtitle}>Masuk atau daftar untuk checkout dan lihat riwayat pesanan.</Text>
          <GradientButton style={{ marginTop: spacing.md, width: "100%" }} onPress={() => router.push("/login")}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Masuk</Text>
          </GradientButton>
          <GhostButton style={{ marginTop: spacing.sm, width: "100%" }} onPress={() => router.push("/daftar" as never)}>
            <Text style={{ color: colors.ink, fontWeight: "700", fontSize: 13 }}>Daftar Akun Baru</Text>
          </GhostButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Akun</Text>

          <Card style={{ alignItems: "center", paddingVertical: spacing.lg, marginTop: spacing.md }}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name
                  .split(" ")
                  .slice(0, 2)
                  .map((s) => s[0])
                  .join("")
                  .toUpperCase()}
              </Text>
            </View>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </Card>

          {user.role === "customer" && (
            <Card style={{ marginTop: spacing.md }}>
              <View style={styles.sectionHeader}>
                <MapPin size={16} color={colors.primary1} />
                <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text>
                </View>
              )}
              {success && (
                <View style={styles.successBox}>
                  <Text style={{ color: colors.success, fontSize: 12 }}>Alamat berhasil disimpan.</Text>
                </View>
              )}

              <Text style={styles.label}>No. Telepon</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor={colors.inkFaint}
              />

              <Text style={styles.label}>Alamat Lengkap</Text>
              <TextInput
                style={[styles.input, { minHeight: 70, textAlignVertical: "top" }]}
                value={address}
                onChangeText={setAddress}
                multiline
                placeholder="Nama jalan, nomor rumah, patokan..."
                placeholderTextColor={colors.inkFaint}
              />

              <View style={{ height: spacing.sm }} />
              <GhostButton onPress={handleSaveAddress} disabled={saving}>
                <Save size={14} color={colors.ink} />
                <Text style={{ color: colors.ink, fontWeight: "700", fontSize: 13 }}>
                  {saving ? "Menyimpan..." : "Simpan Alamat"}
                </Text>
              </GhostButton>
            </Card>
          )}

          <Card style={{ marginTop: spacing.md }}>
            <Pressable style={styles.linkRow} onPress={() => WebBrowser.openBrowserAsync(`${WEB_BASE_URL}/privacy-policy`)}>
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

          <GhostButton style={{ marginTop: spacing.lg }} onPress={() => logout()}>
            <LogOut size={16} color={colors.danger} />
            <Text style={{ color: colors.danger, fontWeight: "700", fontSize: 13 }}>Keluar</Text>
          </GhostButton>
        </ScrollView>
      </KeyboardAvoidingView>
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
    avatarText: { color: "#fff", fontSize: 20, fontWeight: "800" },
    name: { fontSize: 15, fontWeight: "700", color: colors.ink },
    email: { fontSize: 12, color: colors.inkSoft, marginTop: 2 },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm },
    sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.ink },
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
    successBox: { backgroundColor: colors.success + "18", borderRadius: radius.sm, padding: 10, marginBottom: spacing.sm },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.glassBorder,
    },
    linkText: { flex: 1, fontSize: 13, color: colors.ink },
    guestWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
    avatarPlaceholder: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.inputBg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
    },
    guestTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
    guestSubtitle: { fontSize: 12, color: colors.inkSoft, marginTop: 4, textAlign: "center" },
  });
}
