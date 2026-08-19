import { useAuth } from "../../lib/auth-context";
import SalesTugas from "../../features/SalesTugas";
import KurirTugas from "../../features/KurirTugas";
import { GenericTugas } from "../../features/GenericTugas";

export default function TugasScreen() {
  const { user } = useAuth();

  if (user?.role === "sales") return <SalesTugas />;
  if (user?.role === "kurir") return <KurirTugas />;
  return <GenericTugas />;
}
