import { useMemo, useState } from "react";
import useSWR from "swr";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import {
  ActivityIndicator,
  FlatList,
  Image,
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
import { Camera, MapPin, Navigation, X } from "lucide-react-native";
import { Card, GradientButton, GhostButton } from "../components/ui";
import { api, fetcher, formatDateTime, ApiError } from "../lib/api";
import { compressPhoto } from "../lib/image";
import { useAppTheme } from "../lib/theme-context";
import { radius, spacing, type ThemeColors } from "../lib/theme";
import type { Outlet, Paginated, Visit } from "../types";

export default function SalesTugas() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const modalStyles = useMemo(() => createModalStyles(colors), [colors]);
  const { data: visits, isLoading, mutate } = useSWR<Paginated<Visit>>("/visits", fetcher);
  const { data: outlets } = useSWR<Paginated<Outlet>>("/outlets", fetcher);
  const [open, setOpen] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Kunjungan Sales</Text>
          <Text style={styles.subtitle}>Checkin outlet & pantau riwayat kunjungan.</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <GradientButton onPress={() => setOpen(true)}>
          <Navigation color="#fff" size={16} />
          <Text style={styles.gradBtnLabel}>Checkin Sekarang</Text>
        </GradientButton>
      </View>

      {isLoading && <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary1} />}

      <FlatList
        data={visits?.data ?? []}
        keyExtractor={(v) => String(v.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.sm }}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.visitOutlet}>{item.outlet?.name ?? `#${item.outlet_id}`}</Text>
                <Text style={styles.visitTime}>{formatDateTime(item.visited_at)}</Text>
                {item.notes ? <Text style={styles.visitNotes}>{item.notes}</Text> : null}
              </View>
              {item.checkin_lat && <MapPin color={colors.primary1} size={16} />}
            </View>
          </Card>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={{ textAlign: "center", color: colors.inkSoft, marginTop: 24, fontSize: 13 }}>
              Belum ada kunjungan. Checkin pertama kamu akan muncul di sini.
            </Text>
          ) : null
        }
      />

      <CheckinModal
        visible={open}
        onClose={() => setOpen(false)}
        outlets={outlets?.data ?? []}
        onSaved={() => {
          setOpen(false);
          mutate();
        }}
      />
    </SafeAreaView>
  );
}

function CheckinModal({
  visible,
  onClose,
  outlets,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  outlets: Outlet[];
  onSaved: () => void;
}) {
  const { colors } = useAppTheme();
  const modalStyles = useMemo(() => createModalStyles(colors), [colors]);
  const [outletId, setOutletId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError("Izin kamera ditolak.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleCheckin() {
    if (!outletId) {
      setError("Pilih outlet dulu.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError("Izin lokasi ditolak. Aktifkan GPS untuk checkin.");
        setSaving(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});

      const fields: Record<string, string> = {
        outlet_id: String(outletId),
        checkin_lat: String(pos.coords.latitude),
        checkin_lng: String(pos.coords.longitude),
        notes,
      };

      let file: { uri: string; name: string; type: string; fieldName: string } | undefined;
      if (photoUri) {
        const compressed = await compressPhoto(photoUri);
        file = { ...compressed, fieldName: "photo" };
      }

      await api.postForm("/visits/checkin", fields, file);

      setOutletId(null);
      setNotes("");
      setPhotoUri(null);
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(`Gagal checkin: ${err.message}`);
      } else {
        setError("Gagal checkin. Periksa koneksi internet kamu dan coba lagi.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={modalStyles.backdrop}
      >
        <View style={modalStyles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={modalStyles.sheetHeader}>
            <Text style={modalStyles.sheetTitle}>Checkin Kunjungan</Text>
            <Pressable onPress={onClose}>
              <X size={20} color={colors.inkSoft} />
            </Pressable>
          </View>

          {error && (
            <View style={modalStyles.errorBox}>
              <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text>
            </View>
          )}

          <Text style={modalStyles.label}>Outlet</Text>
          <View style={{ maxHeight: 160 }}>
            <FlatList
              data={outlets}
              keyExtractor={(o) => String(o.id)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setOutletId(item.id)}
                  style={[modalStyles.outletRow, outletId === item.id && modalStyles.outletRowActive]}
                >
                  <Text style={outletId === item.id ? modalStyles.outletTextActive : modalStyles.outletText}>
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          </View>

          <Text style={modalStyles.label}>Catatan</Text>
          <TextInput
            style={modalStyles.textArea}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Kondisi stok outlet, permintaan khusus, dll."
            placeholderTextColor={colors.inkFaint}
          />

          <Text style={modalStyles.label}>Foto Etalase/Stok (opsional)</Text>
          {photoUri ? (
            <View style={{ position: "relative" }}>
              <Image source={{ uri: photoUri }} style={modalStyles.photoPreview} />
              <Pressable onPress={() => setPhotoUri(null)} style={modalStyles.removePhoto}>
                <X size={14} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <GhostButton onPress={takePhoto}>
              <Camera size={16} color={colors.inkSoft} />
              <Text style={{ color: colors.inkSoft, fontSize: 13, fontWeight: "600" }}>Ambil Foto</Text>
            </GhostButton>
          )}

          <View style={{ height: spacing.md }} />
          <GradientButton onPress={handleCheckin} loading={saving} disabled={!outletId}>
            Checkin Sekarang
          </GradientButton>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    header: { padding: spacing.lg, paddingBottom: 0 },
    title: { fontSize: 20, fontWeight: "800", color: colors.ink },
    subtitle: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },
    gradBtnLabel: { color: "#fff", fontWeight: "700", fontSize: 14 },
    visitOutlet: { fontSize: 14, fontWeight: "700", color: colors.ink },
    visitTime: { fontSize: 11, color: colors.inkSoft, marginTop: 2 },
    visitNotes: { fontSize: 12, color: colors.inkSoft, marginTop: 4 },
  });
}

function createModalStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: "85%" },
    sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
    sheetTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
    label: { fontSize: 12, fontWeight: "600", color: colors.inkSoft, marginBottom: 6, marginTop: spacing.sm },
    outletRow: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.sm, marginBottom: 4 },
    outletRowActive: { backgroundColor: colors.primary1 + "18" },
    outletText: { fontSize: 13, color: colors.ink },
    outletTextActive: { fontSize: 13, color: colors.primary1, fontWeight: "700" },
    textArea: {
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: radius.sm,
      padding: 12,
      fontSize: 13,
      minHeight: 70,
      textAlignVertical: "top",
      color: colors.ink,
    },
    photoPreview: { width: "100%", height: 140, borderRadius: radius.sm },
    removePhoto: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: "rgba(0,0,0,0.6)",
      borderRadius: 999,
      padding: 6,
    },
    errorBox: { backgroundColor: colors.danger + "18", borderRadius: radius.sm, padding: 10, marginBottom: spacing.sm },
  });
}
