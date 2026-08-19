import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

const LEVEL_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  wilayah: "Wilayah",
  agen: "Agen",
  reseller: "Reseller",
  sales: "Sales",
  kurir: "Kurir",
  gudang: "Gudang",
};

export function MemberCard({
  name,
  level,
  cardNumber,
  balance,
}: {
  name: string;
  level: string;
  cardNumber: string;
  balance?: string;
}) {
  return (
    <LinearGradient
      colors={["#4b4fe0", "#6d5ff0", "#9b6bf2", "#caa1f0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.brand}>CANVASDIST</Text>
          <Text style={styles.level}>{LEVEL_LABEL[level] ?? level}</Text>
        </View>
        <View style={styles.chip} />
      </View>

      <View>
        <Text style={styles.cardNumber}>{cardNumber}</Text>
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.label}>PEMEGANG KARTU</Text>
            <Text style={styles.holderName}>{name}</Text>
          </View>
          {balance && (
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.label}>SALDO</Text>
              <Text style={styles.holderName}>{balance}</Text>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 20,
    aspectRatio: 1.586,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brand: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  level: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    marginTop: 2,
  },
  chip: {
    width: 36,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#f0c975",
  },
  cardNumber: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 2,
    fontVariant: ["tabular-nums"],
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  label: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    letterSpacing: 0.5,
  },
  holderName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
});
