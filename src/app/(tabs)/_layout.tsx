import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Home, ClipboardList, Wallet2, User as UserIcon } from "lucide-react-native";
import { useAuth } from "../../lib/auth-context";
import { useAppTheme } from "../../lib/theme-context";

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const { colors } = useAppTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary1} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role === "customer") {
    return <Redirect href="/(store)" />;
  }

  const tugasLabel = user.role === "kurir" ? "Pengiriman" : "Tugas";

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
        options={{ title: "Home", tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="tugas"
        options={{ title: tugasLabel, tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="saldo"
        options={{ title: "Saldo", tabBarIcon: ({ color, size }) => <Wallet2 color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: "Profil", tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} /> }}
      />
    </Tabs>
  );
}
