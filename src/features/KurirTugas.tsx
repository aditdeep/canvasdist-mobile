import { useState, useMemo } from "react";
import useSWR from "swr";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Check, Navigation, Truck, X } from "lucide-react-native";
import { Card, GradientButton, GhostButton, Badge } from "../components/ui";
import { api, fetcher, ApiError } from "../lib/api";
import { compressPhoto } from "../lib/image";
import { useAuth } from "../lib/auth-context";
import { useAppTheme } from "../lib/theme-context";
import { radius, spacing, type ThemeColors } from "../lib/theme";
import type { DeliveryOrder, Paginated } from "../types";

const STATUS_LABEL: Record<DeliveryOrder["status"], string> = {
  siap_kirim: "Siap Kirim",
  dikirim: "Dikirim",
  di_hub: "Di Hub (Transit)",
  sampai_tujuan: "Sampai Tujuan",
  selesai: "Selesai",
};

const STATUS_TONE: Record<DeliveryOrder["status"], "primary" | "success" | "warning" | "neutral"> = {
  siap_kirim: "neutral",
  dikirim: "primary",
  di_hub: "warning",
  sampai_tujuan: "warning",
  selesai: "success",
};

export default function KurirTugas() {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data, isLoading, mutate } = useSWR<Paginated<DeliveryOrder>>("/delivery-orders", fetcher);
  const [podTarget, setPodTarget] = useState<DeliveryOrder | null>(null);
  const [trackingId, setTrackingId] = useState<number | null>(null);

  const rows = (data?.data ?? []).filter((d) => d.status !== "selesai");

  function activeLegFor(d: DeliveryOrder) {
    if (!d.legs || d.legs.length === 0) return null;
    return d.legs.find((l) => l.status !== "arrived") ?? null;
  }

  async function startDelivery(id: number) {
    await api.put(`/delivery-orders/${id}`, { status: "dikirim" });
    mutate();
  }

  async function sendLocation(id: number) {
    setTrackingId(id);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return;
      const pos = await Location.getCurrentPositionAsync({});
      await api.post(`/delivery-orders/${id}/track`, {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        status: "dikirim",
      });
    } finally {
      setTrackingId(null);
    }
  }

  async function markArrived(id: number) {
    await api.put(`/delivery-orders/${id}`, { status: "sampai_tujuan" });
    mutate();
  }

  async function startLeg(legId: number) {
    await api.post(`/delivery-legs/${legId}/start`);
    mutate();
  }

  async function arriveLeg(legId: number) {
    await api.post(`/delivery-legs/${legId}/arrive`);
    mutate();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Pengiriman Kamu</Text>
        <Text style={styles.subtitle}>Kelola pengiriman yang ditugaskan hari ini.</Text>
      </View>

      {isLoading && <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary1} />}

      <FlatList
        data={rows}
        keyExtractor={(d) => String(d.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm }}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={{ textAlign: "center", color: colors.inkSoft, marginTop: 24, fontSize: 13 }}>
              Tidak ada pengiriman aktif saat ini.
            </Text>
          ) : null
        }
        renderItem={({ item: d }) => {
          const leg = activeLegFor(d);
          const hasRoute = !!(d.legs && d.legs.length > 0);
          const myLeg = leg && leg.courier_id === user?.id ? leg : null;

          return (
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.doNumber}>{d.do_number}</Text>
                  <Text style={styles.outletName}>{d.order?.outlet?.name ?? "Outlet"}</Text>
                  <Text style={styles.outletAddress}>{d.order?.outlet?.address ?? "-"}</Text>
                  {hasRoute && leg && (
                    <Text style={styles.legInfo}>
                      Etape {leg.sequence}: {leg.from_hub?.name ?? "Gudang asal"} → {leg.to_hub?.name ?? "Outlet"}
                    </Text>
                  )}
                </View>
                <Badge tone={STATUS_TONE[d.status]}>{STATUS_LABEL[d.status]}</Badge>
              </View>

              <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
                {hasRoute && myLeg && myLeg.status === "pending" && (
                  <GradientButton style={{ flex: 1 }} onPress={() => startLeg(myLeg.id)}>
                    <Truck color="#fff" size={14} />
                    <Text style={styles.btnLabel}>Mulai Etape {myLeg.sequence}</Text>
                  </GradientButton>
                )}
                {hasRoute && myLeg && myLeg.status === "in_transit" && !myLeg.to_hub_id && (
                  <GradientButton style={{ flex: 1 }} onPress={() => setPodTarget(d)}>
                    <Camera color="#fff" size={14} />
                    <Text style={styles.btnLabel}>Upload Bukti Terima</Text>
                  </GradientButton>
                )}
                {hasRoute && myLeg && myLeg.status === "in_transit" && myLeg.to_hub_id && (
                  <GradientButton style={{ flex: 1 }} onPress={() => arriveLeg(myLeg.id)}>
                    <Check color="#fff" size={14} />
                    <Text style={styles.btnLabel}>Sampai di {myLeg.to_hub?.name ?? "Hub"}</Text>
                  </GradientButton>
                )}
                {hasRoute && leg && leg.courier_id !== user?.id && (
                  <Text style={{ fontSize: 12, color: colors.inkFaint, paddingVertical: 8 }}>
                    Menunggu kurir etape ini ({leg.courier?.name ?? "belum ditugaskan"}).
                  </Text>
                )}

                {!hasRoute && d.status === "siap_kirim" && (
                  <GradientButton style={{ flex: 1 }} onPress={() => startDelivery(d.id)}>
                    <Truck color="#fff" size={14} />
                    <Text style={styles.btnLabel}>Mulai Kirim</Text>
                  </GradientButton>
                )}
                {!hasRoute && d.status === "dikirim" && (
                  <>
                    <GhostButton style={{ flex: 1 }} onPress={() => sendLocation(d.id)} disabled={trackingId === d.id}>
                      <Navigation size={14} color={colors.ink} />
                      <Text style={styles.ghostLabel}>{trackingId === d.id ? "Mengirim..." : "Kirim Lokasi"}</Text>
                    </GhostButton>
                    <GradientButton style={{ flex: 1 }} onPress={() => markArrived(d.id)}>
                      <Check color="#fff" size={14} />
                      <Text style={styles.btnLabel}>Sudah Sampai</Text>
                    </GradientButton>
                  </>
                )}
                {!hasRoute && d.status === "sampai_tujuan" && (
                  <GradientButton style={{ flex: 1 }} onPress={() => setPodTarget(d)}>
                    <Camera color="#fff" size={14} />
                    <Text style={styles.btnLabel}>Upload Bukti Terima</Text>
                  </GradientButton>
                )}
              </View>
            </Card>
          );
        }}
      />

      <PodModal
        target={podTarget}
        onClose={() => setPodTarget(null)}
        onSaved={() => {
          setPodTarget(null);
          mutate();
        }}
      />
    </SafeAreaView>
  );
}

function PodModal({
  target,
  onClose,
  onSaved,
}: {
  target: DeliveryOrder | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { colors } = useAppTheme();
  const modalStyles = useMemo(() => createModalStyles(colors), [colors]);
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
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  async function submit() {
    if (!target || !photoUri) {
      setError("Foto bukti terima wajib diambil.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const fields: Record<string, string> = {};
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.granted) {
          const pos = await Location.getCurrentPositionAsync({});
          fields.lat = String(pos.coords.latitude);
          fields.lng = String(pos.coords.longitude);
        }
      } catch {
        // lokasi opsional untuk POD, lanjut tanpa itu kalau gagal
      }

      const compressed = await compressPhoto(photoUri);
      await api.postForm(`/delivery-orders/${target.id}/pod`, fields, { ...compressed, fieldName: "photo" });

      setPhotoUri(null);
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(`Gagal upload: ${err.message}`);
      } else {
        setError("Gagal upload bukti terima. Periksa koneksi internet kamu.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={!!target} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.sheetHeader}>
            <Text style={modalStyles.sheetTitle}>Upload Bukti Terima (POD)</Text>
            <Pressable onPress={onClose}>
              <X size={20} color={colors.inkSoft} />
            </Pressable>
          </View>

          {error && (
            <View style={modalStyles.errorBox}>
              <Text style={{ color: colors.danger, fontSize: 12 }}>{error}</Text>
            </View>
          )}

          {photoUri ? (
            <View style={{ position: "relative", marginBottom: spacing.md }}>
              <Image source={{ uri: photoUri }} style={modalStyles.photoPreview} />
              <Pressable onPress={() => setPhotoUri(null)} style={modalStyles.removePhoto}>
                <X size={14} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <GhostButton onPress={takePhoto} style={{ marginBottom: spacing.md }}>
              <Camera size={16} color={colors.inkSoft} />
              <Text style={{ color: colors.inkSoft, fontSize: 13, fontWeight: "600" }}>Foto barang diterima outlet</Text>
            </GhostButton>
          )}

          <Text style={{ fontSize: 11, color: colors.inkFaint, marginBottom: spacing.md }}>
            Lokasi GPS kamu saat ini akan disertakan otomatis sebagai bukti tambahan.
          </Text>

          <GradientButton onPress={submit} loading={saving} disabled={!photoUri}>
            Selesaikan Pengiriman
          </GradientButton>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    header: { padding: spacing.lg, paddingBottom: spacing.sm },
    title: { fontSize: 20, fontWeight: "800", color: colors.ink },
    subtitle: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },
    doNumber: { fontSize: 11, color: colors.inkSoft, fontFamily: "monospace" },
    outletName: { fontSize: 14, fontWeight: "700", color: colors.ink, marginTop: 2 },
    outletAddress: { fontSize: 12, color: colors.inkSoft, marginTop: 1 },
    legInfo: { fontSize: 11, color: colors.primary1, marginTop: 4 },
    btnLabel: { color: "#fff", fontWeight: "700", fontSize: 12 },
    ghostLabel: { color: colors.ink, fontWeight: "600", fontSize: 12 },
  });
}

function createModalStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg },
    sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
    sheetTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
    photoPreview: { width: "100%", height: 160, borderRadius: radius.sm },
    removePhoto: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 999, padding: 6 },
    errorBox: { backgroundColor: colors.danger + "18", borderRadius: radius.sm, padding: 10, marginBottom: spacing.sm },
  });
}
