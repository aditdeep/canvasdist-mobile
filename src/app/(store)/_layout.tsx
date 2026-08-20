import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { Home, ShoppingCart, Package, User as UserIcon } from "lucide-react-native";
import { useAppTheme } from "../../lib/theme-context";
import { useCart } from "../../lib/cart-context";
import { View, Text, StyleSheet } from "react-native";

function CartIcon({ color, size }: { color: ColorValue; size: number }) {
  const { totalItems } = useCart();
  return (
    <View>
      <ShoppingCart color={color as string} size={size} />
      {totalItems > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalItems > 9 ? "9+" : totalItems}</Text>
        </View>
      )}
    </View>
  );
}

export default function StoreTabsLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary1,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.glassBorder,
          height: 62,
          paddingTop: 6,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Beranda", tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="keranjang"
        options={{ title: "Keranjang", tabBarIcon: ({ color, size }) => <CartIcon color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="pesanan"
        options={{ title: "Pesanan", tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="akun"
        options={{ title: "Akun", tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} /> }}
      />
      {/* Screen ini ada di dalam grup (store) supaya bisa dinavigasi, tapi
          sengaja disembunyikan dari tab bar (href: null) — kalau tidak,
          Expo Router otomatis menambahkannya jadi tab tambahan dengan ikon
          default yang rusak/nggak ada label jelas. */}
      <Tabs.Screen name="checkout" options={{ href: null }} />
      <Tabs.Screen name="produk/[id]" options={{ href: null }} />
      <Tabs.Screen name="notifikasi" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#f0554d",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
});
