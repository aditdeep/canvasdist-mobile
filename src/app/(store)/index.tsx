import { useMemo, useState } from "react";
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
import { Search, ImageIcon as ImageIconLucide } from "lucide-react-native";
import { StoreProductCard } from "../../components/StoreProductCard";
import { fetcher, imageUrl } from "../../lib/api";
import { useAppTheme } from "../../lib/theme-context";
import { useBranding } from "../../lib/use-branding";
import { radius, spacing, type ThemeColors } from "../../lib/theme";
import type { Banner, Category, Paginated, StoreProduct } from "../../types";

export default function StoreHomeScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const branding = useBranding();

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
  const activeBanner = banners && banners.length > 0 ? banners[0] : null;

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
      </View>

      <FlatList
        data={rows}
        keyExtractor={(p) => String(p.id)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 90 }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.md }}>
            {activeBanner && (
              <View style={styles.hero}>
                {activeBanner.image_path ? (
                  <Image source={{ uri: imageUrl(activeBanner.image_path) ?? undefined }} style={styles.heroImage} />
                ) : (
                  <View style={[styles.heroImage, styles.heroFallback]} />
                )}
                <View style={styles.heroOverlay}>
                  <Text style={styles.heroTitle}>{activeBanner.title}</Text>
                  {activeBanner.subtitle && <Text style={styles.heroSubtitle}>{activeBanner.subtitle}</Text>}
                </View>
              </View>
            )}

            {categories && categories.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={styles.sectionTitle}>Kategori</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
                  <Pressable style={styles.categoryItem} onPress={() => setCategoryId(null)}>
                    <View
                      style={[
                        styles.categoryCircle,
                        !categoryId ? { backgroundColor: colors.primary1 } : { backgroundColor: colors.inputBg },
                      ]}
                    >
                      <ImageIconLucide size={20} color={!categoryId ? "#fff" : colors.inkFaint} />
                    </View>
                    <Text style={[styles.categoryLabel, !categoryId && { color: colors.primary1 }]}>Semua</Text>
                  </Pressable>

                  {categories.map((cat) => (
                    <Pressable key={cat.id} style={styles.categoryItem} onPress={() => setCategoryId(cat.id)}>
                      <View
                        style={[
                          styles.categoryCircle,
                          categoryId === cat.id && { borderWidth: 2, borderColor: colors.primary1 },
                        ]}
                      >
                        {cat.image_path ? (
                          <Image source={{ uri: imageUrl(cat.image_path) ?? undefined }} style={styles.categoryImage} />
                        ) : (
                          <ImageIconLucide size={18} color={colors.inkFaint} />
                        )}
                      </View>
                      <Text
                        style={[styles.categoryLabel, categoryId === cat.id && { color: colors.primary1 }]}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
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
    hero: { borderRadius: radius.lg, overflow: "hidden", height: 150 },
    heroImage: { width: "100%", height: "100%" },
    heroFallback: { backgroundColor: colors.primary1 },
    heroOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: spacing.md },
    heroTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
    heroSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 2 },
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
    },
    categoryImage: { width: "100%", height: "100%" },
    categoryLabel: { fontSize: 10, color: colors.inkSoft, marginTop: 4, textAlign: "center" },
  });
}
