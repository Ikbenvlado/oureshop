export type OrderStatus = "nová" | "potvrdená" | "zaplatená" | "spracovaná" | "expedovaná" | "doručená" | "zrušená";

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customer: string;
  email: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  date: string;
  address: string;
}
