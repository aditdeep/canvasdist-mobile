import { useMemo, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import useSWR from "swr";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Minus, Plus, Package, ShoppingCart, Tag, Truck } from "lucide-react-native";
import { StoreProductCard } from "../../../components/StoreProductCard";
import { GradientButton } from "../../../components/ui";
import { fetcher, formatCurrency, imageUrl } from "../../../lib/api";
import { useAppTheme } from "../../../lib/theme-context";
import { useCart } from "../../../lib/cart-context";
import { radius, spacing, type ThemeColors } from "../../../lib/theme";
import type { StoreProduct } from "../../../types";

export default function StoreProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { addItem } = useCart();
  const { data, isLoading } = useSWR<{ product: StoreProduct; related: StoreProduct[] }>(
    `/public/products/${id}`,
    fetcher
  );
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <ActivityIndicator color={colors.primary1} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const product = data?.product;
  const related = data?.related ?? [];

  if (!product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <Text style={{ textAlign: "center", marginTop: 40, color: colors.inkSoft }}>Produk tidak ditemukan.</Text>
      </SafeAreaView>
    );
  }

  const hasPromo = product.promo_label && Number(product.discounted_price) < Number(product.display_price);
  const finalPrice = hasPromo ? product.discounted_price! : (product.display_price ?? product.base_price);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={18} color={colors.ink} />
        </Pressable>

        <View style={styles.imageWrap}>
          {product.photo_path ? (
            <Image source={{ uri: imageUrl(product.photo_path) ?? undefined }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Package size={40} color={colors.inkFaint} />
            </View>
          )}
        </View>

        <View style={styles.badgeRow}>
          {product.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{product.category}</Text>
            </View>
          )}
          {hasPromo && (
            <View style={styles.promoBadge}>
              <Tag size={10} color="#fff" />
              <Text style={styles.promoBadgeText}>{product.promo_label}</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{product.name}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {formatCurrency(finalPrice)}
            <Text style={styles.unit}> / {product.unit}</Text>
          </Text>
          {hasPromo && <Text style={styles.strikePrice}>{formatCurrency(product.display_price!)}</Text>}
        </View>

        {product.description && <Text style={styles.description}>{product.description}</Text>}

        <View style={styles.shippingRow}>
          <Truck size={14} color={colors.primary1} />
          {product.shipping_fee !== null && product.shipping_fee !== undefined ? (
            <Text style={styles.shippingText}>
              Ongkir:{" "}
              <Text style={{ fontWeight: "700", color: colors.ink }}>
                {Number(product.shipping_fee) === 0 ? "Gratis" : formatCurrency(product.shipping_fee)}
              </Text>
            </Text>
          ) : (
            <Text style={styles.shippingText}>Ongkir dihitung setelah kamu masuk/daftar akun.</Text>
          )}
        </View>

        <View style={styles.qtyRow}>
          <View style={styles.qtyControl}>
            <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} style={styles.qtyBtn}>
              <Minus size={14} color={colors.ink} />
            </Pressable>
            <Text style={styles.qtyText}>{qty}</Text>
            <Pressable onPress={() => setQty((q) => q + 1)} style={styles.qtyBtn}>
              <Plus size={14} color={colors.ink} />
            </Pressable>
          </View>
          <GradientButton style={{ flex: 1 }} onPress={() => addItem(product, qty)}>
            <ShoppingCart size={16} color="#fff" />
            <Text style={styles.addToCartText}>Tambah ke Keranjang</Text>
          </GradientButton>
        </View>

        {related.length > 0 && (
          <View style={{ marginTop: spacing.xl }}>
            <Text style={styles.sectionTitle}>Produk Terkait</Text>
            <View style={styles.relatedGrid}>
              {related.map((p) => (
                <StoreProductCard key={p.id} product={p} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.glassFillStrong,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.glassBorder,
      marginBottom: spacing.md,
    },
    imageWrap: { aspectRatio: 1, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.inputBg },
    image: { width: "100%", height: "100%" },
    imagePlaceholder: { alignItems: "center", justifyContent: "center" },
    badgeRow: { flexDirection: "row", gap: 6, marginTop: spacing.md },
    categoryBadge: { backgroundColor: colors.primary1 + "18", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    categoryBadgeText: { color: colors.primary1, fontSize: 11, fontWeight: "700" },
    promoBadge: {
      backgroundColor: colors.danger,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    promoBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
    title: { fontSize: 20, fontWeight: "800", color: colors.ink, marginTop: spacing.sm },
    priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 4 },
    price: { fontSize: 22, fontWeight: "800", color: colors.primary1 },
    unit: { fontSize: 12, fontWeight: "400", color: colors.inkSoft },
    strikePrice: { fontSize: 13, color: colors.inkFaint, textDecorationLine: "line-through" },
    description: { fontSize: 13, color: colors.inkSoft, marginTop: spacing.md, lineHeight: 20 },
    shippingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md },
    shippingText: { fontSize: 12, color: colors.inkSoft },
    qtyRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg, alignItems: "center" },
    qtyControl: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBg,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    qtyBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    qtyText: { width: 28, textAlign: "center", fontSize: 14, fontWeight: "700", color: colors.ink },
    addToCartText: { color: "#fff", fontWeight: "700", fontSize: 13 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.ink, marginBottom: spacing.sm },
    relatedGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  });
}
