import { useMemo } from "react";
import { router } from "expo-router";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Minus, Plus, Trash2, ShoppingBag, Package } from "lucide-react-native";
import { Card, GradientButton } from "../../components/ui";
import { formatCurrency, imageUrl } from "../../lib/api";
import { useCart } from "../../lib/cart-context";
import { useAuth } from "../../lib/auth-context";
import { useAppTheme } from "../../lib/theme-context";
import { radius, spacing, type ThemeColors } from "../../lib/theme";

export default function KeranjangScreen() {
  const { items, updateQty, removeItem, totalPrice } = useCart();
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  function handleCheckout() {
    if (!user) {
      router.push("/login");
      return;
    }
    router.push("/(store)/checkout" as never);
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <ShoppingBag size={24} color={colors.inkFaint} />
          </View>
          <Text style={styles.emptyTitle}>Keranjang kamu masih kosong</Text>
          <Text style={styles.emptySubtitle}>Yuk mulai belanja produk favoritmu.</Text>
          <GradientButton style={{ marginTop: spacing.md }} onPress={() => router.push("/(store)" as never)}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Lihat Produk</Text>
          </GradientButton>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Keranjang Belanja</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.product.id)}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 160 }}
        renderItem={({ item: { product, qty } }) => (
          <View style={styles.itemRow}>
            <View style={styles.itemImageWrap}>
              {product.photo_path ? (
                <Image source={{ uri: imageUrl(product.photo_path) ?? undefined }} style={styles.itemImage} />
              ) : (
                <Package size={20} color={colors.inkFaint} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={styles.itemPrice}>{formatCurrency(product.discounted_price ?? product.display_price ?? product.base_price)}</Text>
            </View>
            <View style={styles.qtyControl}>
              <Pressable onPress={() => updateQty(product.id, qty - 1)} style={styles.qtyBtn}>
                <Minus size={12} color={colors.ink} />
              </Pressable>
              <Text style={styles.qtyText}>{qty}</Text>
              <Pressable onPress={() => updateQty(product.id, qty + 1)} style={styles.qtyBtn}>
                <Plus size={12} color={colors.ink} />
              </Pressable>
            </View>
            <Pressable onPress={() => removeItem(product.id)} style={{ padding: 4 }}>
              <Trash2 size={16} color={colors.danger} />
            </Pressable>
          </View>
        )}
      />

      <View style={styles.footer}>
        <Card>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Belanja</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalPrice)}</Text>
          </View>
          <GradientButton onPress={handleCheckout}>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Lanjut ke Checkout</Text>
          </GradientButton>
        </Card>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    header: { padding: spacing.lg, paddingBottom: spacing.sm },
    title: { fontSize: 20, fontWeight: "800", color: colors.ink },
    emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.inputBg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.sm,
    },
    emptyTitle: { fontSize: 14, fontWeight: "700", color: colors.ink },
    emptySubtitle: { fontSize: 12, color: colors.inkSoft, marginTop: 4 },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.glassFillStrong,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    itemImageWrap: {
      width: 52,
      height: 52,
      borderRadius: 10,
      backgroundColor: colors.inputBg,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    itemImage: { width: "100%", height: "100%" },
    itemName: { fontSize: 13, fontWeight: "600", color: colors.ink },
    itemPrice: { fontSize: 13, fontWeight: "700", color: colors.primary1, marginTop: 2 },
    qtyControl: { flexDirection: "row", alignItems: "center", backgroundColor: colors.inputBg, borderRadius: 999 },
    qtyBtn: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
    qtyText: { width: 20, textAlign: "center", fontSize: 12, fontWeight: "700", color: colors.ink },
    footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: spacing.lg },
    totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
    totalLabel: { fontSize: 13, color: colors.inkSoft },
    totalValue: { fontSize: 18, fontWeight: "800", color: colors.ink },
  });
}
