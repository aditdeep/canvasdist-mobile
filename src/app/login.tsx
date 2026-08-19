import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Card, GradientButton } from "../components/ui";
import { MemberCard } from "../components/MemberCard";
import { useAuth, ApiError } from "../lib/auth-context";
import { useAppTheme } from "../lib/theme-context";
import { radius, spacing, type ThemeColors } from "../lib/theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal masuk, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBox}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <Text style={styles.title}>CanvasDist</Text>
          <Text style={styles.subtitle}>Canvasing, distribusi, dan pengiriman dalam satu app.</Text>
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <MemberCard name="Sales / Kurir" level="sales" cardNumber="•••• •••• •••• ••••" />
        </View>

        <Card>
          <Text style={styles.formTitle}>Masuk ke akun kamu</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="nama@perusahaan.com"
            placeholderTextColor={colors.inkFaint}
          />

          <Text style={styles.label}>Kata sandi</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.inkFaint}
          />

          <View style={{ height: spacing.sm }} />
          <GradientButton onPress={handleSubmit} loading={loading} disabled={!email || !password}>
            Masuk
          </GradientButton>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flexGrow: 1, padding: spacing.lg, justifyContent: "center" },
    logoBox: { alignItems: "center", marginBottom: spacing.lg },
    logoBadge: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.primary1,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
    },
    logoText: { color: "#fff", fontSize: 22, fontWeight: "800" },
    title: { fontSize: 22, fontWeight: "800", color: colors.ink },
    subtitle: { fontSize: 13, color: colors.inkSoft, textAlign: "center", marginTop: 4, maxWidth: 260 },
    formTitle: { fontSize: 17, fontWeight: "700", color: colors.ink, marginBottom: spacing.md },
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
    errorText: { color: colors.danger, fontSize: 12 },
  });
}
