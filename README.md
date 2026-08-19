# CanvasDist Mobile

App mobile (Expo/React Native) untuk **Sales** dan **Kurir**. Role lain (admin, agen,
wilayah, reseller, gudang) tetap bisa login dan lihat ringkasan order, tapi
pekerjaan utama mereka lebih nyaman lewat dashboard web (`canvasdist-web`).

## Fitur per role

| Role | Fitur utama di app |
|---|---|
| **Sales** | Checkin kunjungan (GPS + foto kamera), riwayat kunjungan, saldo, member card |
| **Kurir** | List pengiriman, mulai/sampai etape (termasuk rute multi-hub), kirim lokasi GPS selama otw, upload bukti terima (POD) pakai kamera |
| Lainnya | Ringkasan order, saldo, member card |

## Setup

```bash
npm install
```

Konfigurasi URL API ada di `app.json` → `expo.extra.apiUrl`. Defaultnya sudah
diarahkan ke `https://api.canvasdist.my.id/api` (backend production). Untuk
testing ke backend lokal, ubah nilainya sementara ke `http://IP-LAPTOP-KAMU:8000/api`
(pakai IP LAN, bukan `localhost`, karena HP fisik tidak bisa akses `localhost` laptop).

## Menjalankan & testing di HP (paling gampang — Expo Go)

1. Install app **Expo Go** dari App Store / Play Store di HP kamu
2. Jalankan di laptop:
   ```bash
   npx expo start
   ```
3. Scan QR code yang muncul di terminal pakai:
   - **Android**: buka app Expo Go, scan langsung dari dalam app
   - **iOS**: buka app Kamera bawaan, scan QR, nanti muncul opsi buka di Expo Go
4. App langsung jalan di HP kamu, terhubung ke backend sesuai `apiUrl` di `app.json`

> Catatan: Expo Go cukup untuk testing UI, GPS, dan kamera. Untuk fitur native
> yang lebih dalam (push notification production, dll) nanti perlu development
> build (`eas build`), tapi untuk kebutuhan sekarang Expo Go sudah cukup.

## Build production (APK/IPA)

Butuh akun Expo (gratis) dan `eas-cli`:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android   # atau --platform ios
```

Build berjalan di server Expo (bukan di laptop), hasil akhirnya link download
APK (Android) atau file untuk submit ke App Store (iOS, butuh akun Apple Developer).

## Struktur folder

```
src/
  app/                  # Expo Router - file-based routing
    _layout.tsx         # Root layout (AuthProvider, mesh background)
    index.tsx           # Redirect ke /login atau /(tabs)
    login.tsx
    (tabs)/
      _layout.tsx        # Bottom tab navigator
      index.tsx          # Home/dashboard
      tugas.tsx          # Router adaptif per role -> features/*
      saldo.tsx
      profil.tsx
  features/              # Layar besar per role (dipanggil dari tugas.tsx)
    SalesTugas.tsx        # Checkin GPS + kamera
    KurirTugas.tsx         # Pengiriman + multi-hub + POD
    GenericTugas.tsx
  components/            # UI reusable (Card, Button, Badge, MemberCard)
  lib/
    api.ts               # HTTP client (fetch + upload multipart)
    auth-context.tsx      # Auth state, token via SecureStore
    theme.ts              # Design token (sama dengan web)
  types/                 # Tipe data (mirror dari canvasdist-web)
```

## Permission native yang dipakai

- **Lokasi** (`expo-location`) — checkin kunjungan, tracking pengiriman
- **Kamera** (`expo-image-picker`) — foto checkin, foto POD
- **Secure Storage** (`expo-secure-store`) — simpan token auth

Semua permission di-declare di `app.json` dengan pesan izin dalam Bahasa Indonesia.

## Yang belum ada di v1 (bisa ditambah menyusul)

- Fitur Buyback (input barang bekas) — baru ada di web
- Fitur bikin Order baru dari app — baru ada di web
- Push notification
- Mode offline / sync otomatis saat sinyal balik
