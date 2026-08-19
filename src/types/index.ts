export type Role = "super_admin" | "wilayah" | "agen" | "reseller" | "sales" | "gudang" | "kurir";

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  parent_id: number | null;
  is_active: boolean;
  avatar_path: string | null;
  push_token: string | null;
};

export type Wallet = {
  id: number;
  user_id: number;
  balance: string;
};

export type WalletMutation = {
  id: number;
  type: "topup" | "payment" | "commission" | "cashback" | "refund";
  amount: string;
  description: string | null;
  created_at: string;
};

export type MemberCard = {
  id: number;
  user_id: number;
  card_number: string;
  qr_code: string;
  level: string;
};

export type Outlet = {
  id: number;
  name: string;
  owner_name: string | null;
  phone: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  agent_id: number | null;
};

export type Visit = {
  id: number;
  sales_id: number;
  outlet_id: number;
  checkin_lat: string | null;
  checkin_lng: string | null;
  photo_path: string | null;
  notes: string | null;
  visited_at: string | null;
  outlet?: Outlet;
};

export type Product = {
  id: number;
  name: string;
  sku: string;
  base_price: string;
  unit: string;
};

export type OrderStatus = "pending" | "approved" | "processing" | "shipped" | "completed" | "cancelled" | "returned";

export type Order = {
  id: number;
  order_no: string;
  outlet_id: number;
  status: OrderStatus;
  total: string;
  created_at: string;
  outlet?: Outlet;
};

export type Hub = {
  id: number;
  name: string;
  type: "warehouse" | "agent_office" | "custom";
};

export type DeliveryLeg = {
  id: number;
  delivery_order_id: number;
  sequence: number;
  from_hub_id: number | null;
  to_hub_id: number | null;
  courier_id: number | null;
  status: "pending" | "in_transit" | "arrived";
  from_hub?: Hub;
  to_hub?: Hub;
  courier?: User;
};

export type DeliveryOrder = {
  id: number;
  do_number: string;
  order_id: number;
  courier_id: number | null;
  status: "siap_kirim" | "dikirim" | "di_hub" | "sampai_tujuan" | "selesai";
  shipped_at: string | null;
  order?: Order & { outlet?: Outlet };
  legs?: DeliveryLeg[];
};

export type Buyback = {
  id: number;
  outlet_id: number;
  item_type: string;
  qty: number;
  unit_price: string;
  cashback_amount: string;
  status: "pending" | "verified" | "rejected";
  outlet?: Outlet;
};

export type Withdrawal = {
  id: number;
  amount: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
};

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};
