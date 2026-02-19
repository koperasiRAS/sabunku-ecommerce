export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image_url: string | null;
  description: string | null;
  discount_price: number | null;
  created_at: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  stock: number;
  created_at: string;
}

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  total_price: number;
  status: string;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  price: number;
}

export interface Review {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface CheckoutPayload {
  customer_name: string;
  items: {
    product_id: string;
    variant_id: string;
    quantity: number;
  }[];
}

export interface CheckoutResponse {
  success: boolean;
  order_id: string;
  total_price: number;
  items: {
    name: string;
    variant_name: string;
    quantity: number;
    price: number;
  }[];
}
