import { useMemo, useState } from "react";
import { router, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  Image,
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
import { ArrowLeft, Camera } from "lucide-react-native";
import { Card, GradientButton, GhostButton } from "../components/ui";
import { api, ApiError } from "../lib/api";
import { compressPhoto } from "../lib/image";
import { useAuth } from "../lib/auth-context";
import { useAppTheme } from "../lib/theme-context";
import { radius, spacing, type ThemeColors } from "../lib/theme";

export default function EditProfilScreen() {
  const { user, refreshUser } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  async function pickAvatar() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const fields: Record<string, string> = { name, phone };
      let file: { uri: string; name: string; type: string; fieldName: string } | undefined;
      if (avatarUri) {
        const compressed = await compressPhoto(avatarUri);
        file = { ...compressed, fieldName: "avatar" };
      }
      await api.postForm("/auth/profile", fields, file);
      await refreshUser();
      setSuccess(true);
      setAvatarUri(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      setPwError("Isi password lama dan baru.");
      return;
    }
    setPwSaving(true);
    setPwError(null);
    setPwSuccess(false);
    try {
      await api.post("/auth/change-password", { current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPwSuccess(true);
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : "Gagal mengubah password.");
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={18} color={colors.ink} />
            </Pressable>
            <Text style={styles.title}>Edit Profil</Text>
          </View>

          <Card style={{ alignItems: "center", marginBottom: spacing.md }}>
            <Pressable onPress={pickAvatar} style={{ marginBottom: spacing.sm }}>
              {avatarUri || user?.avatar_path ? (
                <Image source={{ uri: avatarUri ?? user?.avatar_path ?? undefined }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Camera size={22} color={colors.inkSoft} />
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Camera size={12} color="#fff" />
              </View>
            </Pressable>
            <Text style={styles.hint}>Ketuk foto untuk mengganti</Text>
          </Card>

          <Card style={{ marginBottom: spacing.md }}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text>
              </View>
            )}
            {success && (
              <View style={styles.successBox}>
                <Text style={{ color: colors.success, fontSize: 12 }}>Profil berhasil diperbarui.</Text>
              </View>
            )}

            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.inkFaint} />

            <Text style={styles.label}>Nomor Telepon</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={colors.inkFaint}
            />

            <View style={{ height: spacing.sm }} />
            <GradientButton onPress={handleSave} loading={saving}>
              Simpan Perubahan
            </GradientButton>
          </Card>

          <Text style={styles.sectionLabel}>Ganti Password</Text>
          <Card>
            {pwError && (
              <View style={styles.errorBox}>
                <Text style={{ color: colors.danger, fontSize: 12 }}>{pwError}</Text>
              </View>
            )}
            {pwSuccess && (
              <View style={styles.successBox}>
                <Text style={{ color: colors.success, fontSize: 12 }}>Password berhasil diubah.</Text>
              </View>
            )}

            <Text style={styles.label}>Password Lama</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholderTextColor={colors.inkFaint}
            />

            <Text style={styles.label}>Password Baru</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholderTextColor={colors.inkFaint}
            />

            <View style={{ height: spacing.sm }} />
            <GhostButton onPress={handleChangePassword} disabled={pwSaving}>
              <Text style={{ color: colors.ink, fontSize: 13, fontWeight: "700" }}>
                {pwSaving ? "Menyimpan..." : "Ubah Password"}
              </Text>
            </GhostButton>
          </Card>

          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { padding: spacing.lg },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
    backBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.glassFillStrong,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    title: { fontSize: 18, fontWeight: "800", color: colors.ink },
    avatar: { width: 84, height: 84, borderRadius: 42 },
    avatarPlaceholder: { backgroundColor: colors.inputBg, alignItems: "center", justifyContent: "center" },
    cameraBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.primary1,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.surface,
    },
    hint: { fontSize: 11, color: colors.inkFaint },
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
    sectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.inkFaint,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
      marginLeft: 4,
    },
  });
}
