import { useMemo, useState } from "react";
import { router } from "expo-router";
import useSWR from "swr";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, GradientButton } from "../components/ui";
import { api, fetcher, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useAppTheme } from "../lib/theme-context";
import { radius, spacing, type ThemeColors } from "../lib/theme";
import type { User } from "../types";

type Region = { id: number; name: string; code: string };

export default function DaftarScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { setSession } = useAuth();
  const { data: regions } = useSWR<Region[]>("/public/regions", fetcher);

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", region_code: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ user: User; token: string }>("/public/register", form);
      await setSession(res.user, res.token);
      router.replace("/(store)" as never);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mendaftar, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Daftar Akun Customer</Text>
        <Text style={styles.subtitle}>Belanja produk dari agen terdekat di wilayah kamu.</Text>

        <Card>
          {error && (
            <View style={styles.errorBox}>
              <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>Nama Lengkap</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(t) => setForm({ ...form, name: t })}
            placeholderTextColor={colors.inkFaint}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(t) => setForm({ ...form, email: t })}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={colors.inkFaint}
          />

          <Text style={styles.label}>No. Telepon</Text>
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={(t) => setForm({ ...form, phone: t })}
            keyboardType="phone-pad"
            placeholderTextColor={colors.inkFaint}
          />

          <Text style={styles.label}>Kata Sandi</Text>
          <TextInput
            style={styles.input}
            value={form.password}
            onChangeText={(t) => setForm({ ...form, password: t })}
            secureTextEntry
            placeholderTextColor={colors.inkFaint}
          />

          <Text style={styles.label}>Wilayah</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
            {(regions ?? []).map((r) => (
              <Text
                key={r.id}
                onPress={() => setForm({ ...form, region_code: r.code })}
                style={[styles.regionChip, form.region_code === r.code && styles.regionChipActive]}
              >
                {r.name}
              </Text>
            ))}
          </ScrollView>

          <Text style={styles.label}>Alamat Lengkap</Text>
          <TextInput
            style={[styles.input, { minHeight: 70, textAlignVertical: "top" }]}
            value={form.address}
            onChangeText={(t) => setForm({ ...form, address: t })}
            multiline
            placeholder="Nama jalan, nomor rumah, patokan..."
            placeholderTextColor={colors.inkFaint}
          />

          <View style={{ height: spacing.sm }} />
          <GradientButton
            onPress={handleSubmit}
            loading={loading}
            disabled={!form.name || !form.email || !form.password || !form.region_code || !form.address}
          >
            Daftar &amp; Mulai Belanja
          </GradientButton>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { padding: spacing.lg },
    title: { fontSize: 20, fontWeight: "800", color: colors.ink, marginBottom: 4 },
    subtitle: { fontSize: 12, color: colors.inkSoft, marginBottom: spacing.lg },
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
    regionChip: {
      backgroundColor: colors.inputBg,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginRight: 8,
      fontSize: 12,
      color: colors.ink,
      overflow: "hidden",
    },
    regionChipActive: { backgroundColor: colors.primary1, color: "#fff", fontWeight: "700" },
  });
}
