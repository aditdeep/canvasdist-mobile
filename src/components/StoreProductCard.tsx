import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Package, Truck } from "lucide-react-native";
import { formatCurrency, imageUrl } from "../lib/api";
import { useAppTheme } from "../lib/theme-context";
import { useCart } from "../lib/cart-context";
import { radius, type ThemeColors } from "../lib/theme";
import type { StoreProduct } from "../types";

export function StoreProductCard({ product }: { product: StoreProduct }) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { addItem } = useCart();
  const styles = createStyles(colors);

  const hasPromo = product.promo_label && Number(product.discounted_price) < Number(product.display_price);
  const finalPrice = hasPromo ? product.discounted_price! : (product.display_price ?? product.base_price);
  const discountPercent = hasPromo
    ? Math.round((1 - Number(product.discounted_price) / Number(product.display_price)) * 100)
    : 0;
  const freeShipping = product.shipping_fee !== undefined && product.shipping_fee !== null && Number(product.shipping_fee) === 0;

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/(store)/produk/${product.id}` as never)}>
      <View style={styles.imageWrap}>
        {product.photo_path ? (
          <Image source={{ uri: imageUrl(product.photo_path) ?? undefined }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Package size={28} color={colors.inkFaint} />
          </View>
        )}
        {hasPromo && discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}%</Text>
          </View>
        )}
        {freeShipping && (
          <View style={styles.shippingBadge}>
            <Truck size={9} color="#fff" />
            <Text style={styles.shippingText}>GRATIS ONGKIR</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatCurrency(finalPrice)}</Text>
        </View>
        {hasPromo && <Text style={styles.strikePrice}>{formatCurrency(product.display_price!)}</Text>}

        <Pressable style={styles.addButton} onPress={() => addItem(product, 1)}>
          <Text style={styles.addButtonText}>+ Keranjang</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      width: "48%",
      backgroundColor: colors.glassFillStrong,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      overflow: "hidden",
      marginBottom: 12,
    },
    imageWrap: { position: "relative", aspectRatio: 1, backgroundColor: colors.inputBg },
    image: { width: "100%", height: "100%" },
    imagePlaceholder: { alignItems: "center", justifyContent: "center" },
    discountBadge: {
      position: "absolute",
      top: 6,
      right: 6,
      backgroundColor: colors.danger,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    discountText: { color: "#fff", fontSize: 10, fontWeight: "800" },
    shippingBadge: {
      position: "absolute",
      bottom: 6,
      left: 6,
      backgroundColor: colors.success,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 2,
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    shippingText: { color: "#fff", fontSize: 8, fontWeight: "800" },
    info: { padding: 8 },
    name: { fontSize: 12, color: colors.ink, fontWeight: "600", minHeight: 32 },
    priceRow: { marginTop: 4 },
    price: { fontSize: 14, fontWeight: "800", color: colors.primary1 },
    strikePrice: { fontSize: 10, color: colors.inkFaint, textDecorationLine: "line-through" },
    addButton: {
      marginTop: 6,
      backgroundColor: colors.primary1 + "18",
      borderRadius: 8,
      paddingVertical: 6,
      alignItems: "center",
    },
    addButtonText: { fontSize: 10, fontWeight: "700", color: colors.primary1 },
  });
}
