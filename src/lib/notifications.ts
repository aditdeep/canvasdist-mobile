import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Minta izin notifikasi, ambil Expo push token, dan simpan ke backend supaya
 * server bisa kirim notifikasi (mis. saat kurir di-assign pengiriman baru).
 * Aman dipanggil berkali-kali — kalau izin sudah pernah ditolak, langsung skip.
 */
export async function registerForPushNotifications(): Promise<void> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    await api.post("/auth/push-token", { push_token: tokenResponse.data });
  } catch {
    // Notifikasi bersifat opsional — kalau gagal (mis. jalan di emulator tanpa
    // Google Play Services), jangan sampai mengganggu fitur utama app.
  }
}
