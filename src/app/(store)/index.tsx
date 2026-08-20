import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Search, Bell, ShoppingCart, ImageIcon as ImageIconLucide } from "lucide-react-native";
import { StoreProductCard } from "../../components/StoreProductCard";
import { fetcher, imageUrl } from "../../lib/api";
import { useAppTheme } from "../../lib/theme-context";
import { useBranding } from "../../lib/use-branding";
import { useCart } from "../../lib/cart-context";
import { radius, spacing, type ThemeColors } from "../../lib/theme";
import type { Banner, Category, Paginated, StoreProduct } from "../../types";

export default function StoreHomeScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const branding = useBranding();
  const { totalItems } = useCart();

  const { data: banners } = useSWR<Banner[]>("/public/banners", fetcher);
  const { data: categories } = useSWR<Category[]>("/public/categories", fetcher);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const query = categoryId
    ? `/public/products?category_id=${categoryId}`
    : search
      ? `/public/products?search=${encodeURIComponent(search)}`
      : "/public/products";
  const { data: products, isLoading } = useSWR<Paginated<StoreProduct>>(query, fetcher);

  const rows = products?.data ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={styles.topBar}>
        {branding.logo_path ? (
          <Image source={{ uri: imageUrl(branding.logo_path) ?? undefined }} style={styles.logo} />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder]}>
            <Text style={styles.logoText}>{branding.app_name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.searchBox}>
          <Search size={15} color={colors.inkFaint} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari produk..."
            placeholderTextColor={colors.inkFaint}
            value={search}
            onChangeText={(t) => {
              setSearch(t);
              setCategoryId(null);
            }}
          />
        </View>
        <Pressable style={styles.iconButton} onPress={() => router.push("/(store)/notifikasi" as never)}>
          <Bell size={18} color={colors.inkSoft} />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={() => router.push("/(store)/keranjang" as never)}>
          <ShoppingCart size={18} color={colors.inkSoft} />
          {totalItems > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems > 9 ? "9+" : totalItems}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(p) => String(p.id)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 90 }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.md }}>
            {banners && banners.length > 0 && <HeroCarousel banners={banners} />}

            {categories && categories.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={styles.sectionTitle}>Kategori</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
                  <Pressable style={styles.categoryItem} onPress={() => setCategoryId(null)}>
                    <View
                      style={[
                        styles.categoryCircle,
                        { backgroundColor: !categoryId ? colors.primary1 : colors.inputBg },
                      ]}
                    >
                      <ImageIconLucide size={20} color={!categoryId ? "#fff" : colors.inkFaint} />
                    </View>
                    <Text style={[styles.categoryLabel, !categoryId && { color: colors.primary1 }]}>Semua</Text>
                  </Pressable>

                  {categories.map((cat) => (
                    <CategoryAvatar
                      key={cat.id}
                      category={cat}
                      active={categoryId === cat.id}
                      onPress={() => setCategoryId(cat.id)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
              {categories?.find((c) => c.id === categoryId)?.name ?? "Semua Produk"}
            </Text>
          </View>
        }
        renderItem={({ item }) => <StoreProductCard product={item} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary1} style={{ marginTop: 20 }} />
          ) : (
            <Text style={{ textAlign: "center", color: colors.inkSoft, marginTop: 24, fontSize: 13 }}>
              Belum ada produk.
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}

function CategoryAvatar({
  category,
  active,
  onPress,
}: {
  category: Category;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const uri = imageUrl(category.image_path) ?? undefined;

  return (
    <Pressable style={styles.categoryItem} onPress={onPress}>
      <View style={[styles.categoryCircle, active && styles.categoryCircleActive]}>
        {/* Fallback selalu dirender di belakang -- inisial huruf di atas warna solid.
            Kalau gambar berhasil load, dia nutup fallback ini. Ini mencegah kategori
            terlihat "hilang gambarnya" saat foto lambat/gagal dimuat. */}
        <View style={styles.categoryFallback}>
          <Text style={styles.categoryFallbackText}>{category.name.charAt(0).toUpperCase()}</Text>
        </View>
        {uri && !imageFailed && (
          <Image
            source={{ uri }}
            style={[styles.categoryImage, StyleSheet.absoluteFill, { opacity: imageLoaded ? 1 : 0 }]}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
          />
        )}
      </View>
      <Text style={[styles.categoryLabel, active && { color: colors.primary1 }]} numberOfLines={1}>
        {category.name}
      </Text>
    </Pressable>
  );
}

function HeroCarousel({ banners }: { banners: Banner[] }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length]);

  const banner = banners[index] ?? banners[0];

  return (
    <View style={styles.hero}>
      {banner.image_path ? (
        <Image key={banner.id} source={{ uri: imageUrl(banner.image_path) ?? undefined }} style={styles.heroImage} />
      ) : (
        <View style={[styles.heroImage, styles.heroFallback]} />
      )}
      <View style={styles.heroOverlay}>
        <Text style={styles.heroTitle}>{banner.title}</Text>
        {banner.subtitle && <Text style={styles.heroSubtitle}>{banner.subtitle}</Text>}
      </View>

      {banners.length > 1 && (
        <View style={styles.heroDots}>
          {banners.map((b, i) => (
            <View key={b.id} style={[styles.heroDot, i === index && styles.heroDotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    logo: { width: 34, height: 34, borderRadius: 10 },
    logoPlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: colors.primary1 },
    logoText: { color: "#fff", fontWeight: "800", fontSize: 15 },
    searchBox: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.inputBg,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    searchInput: { flex: 1, fontSize: 13, color: colors.ink, padding: 0 },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.inputBg,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    cartBadge: {
      position: "absolute",
      top: -2,
      right: -2,
      backgroundColor: colors.danger,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 3,
      alignItems: "center",
      justifyContent: "center",
    },
    cartBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
    hero: { borderRadius: radius.lg, overflow: "hidden", height: 150 },
    heroImage: { width: "100%", height: "100%" },
    heroFallback: { backgroundColor: colors.primary1 },
    heroOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: spacing.md },
    heroTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
    heroSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 2 },
    heroDots: { position: "absolute", bottom: 10, right: 14, flexDirection: "row", gap: 4 },
    heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" },
    heroDotActive: { width: 16, backgroundColor: "#fff" },
    sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.ink, marginBottom: spacing.sm },
    categoryItem: { alignItems: "center", width: 60 },
    categoryCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.inputBg,
      position: "relative",
    },
    categoryCircleActive: { borderWidth: 2, borderColor: colors.primary1 },
    categoryFallback: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary1 + "22",
    },
    categoryFallbackText: { fontSize: 20, fontWeight: "800", color: colors.primary1 },
    categoryImage: { width: "100%", height: "100%" },
    categoryLabel: { fontSize: 10, color: colors.inkSoft, marginTop: 4, textAlign: "center" },
  });
}
