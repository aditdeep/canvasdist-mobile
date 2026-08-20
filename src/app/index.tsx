import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../lib/auth-context";
import { useAppTheme } from "../lib/theme-context";

export default function RootIndex() {
  const { user, loading } = useAuth();
  const { colors } = useAppTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary1} />
      </View>
    );
  }

  return <Redirect href={!user || user.role === "customer" ? "/(store)" : "/(tabs)"} />;
}
