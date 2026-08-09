export interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  stockQuantity?: number;
  inStock?: boolean;
  category?: string;
  image?: string;
  images?: string[];
  averageRating?: number;
  rating?: number;
  totalReviews?: number;
  numReviews?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  _id?: string;
  productId?: Product | string;
  product?: Product;
  quantity: number;
}

export interface CartResponse {
  _id?: string;
  userId?: string;
  clerkId?: string;
  items: CartItem[];
  totalAmount?: number;
}

export interface Cart {
  _id?: string;
  user?: string;
  userId?: string;
  clerkId?: string;
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  _id?: string;
  productId?: Product | string;
  product?: Product | string;
  name?: string;
  price: number;
  quantity: number;
  image?: string;
  hasReviewed?: boolean;
  isReviewed?: boolean;
}

export interface ShippingAddress {
  label?: string;
  fullName: string;
  address?: string;
  streetAddress?: string;
  city: string;
  state?: string;
  zipCode?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  phoneNumber?: string;
  isDefault?: boolean;
}

export interface Address {
  _id?: string;
  label: string;
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  isDefault: boolean;
}

export interface Order {
  _id: string;
  user?: string;
  clerkId?: string;
  orderItems: OrderItem[];
  shippingAddress?: ShippingAddress;
  paymentMethod?: string;
  paymentResult?: {
    id: string;
    status: string;
  };
  totalPrice: number;
  isPaid?: boolean;
  paidAt?: string;
  isDelivered?: boolean;
  deliveredAt?: string;
  status?: 'pending' | 'shipped' | 'delivered' | string;
  hasReviewed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  _id: string;
  clerkId: string;
  email: string;
  name?: string;
  imageUrl?: string;
  addresses?: Address[];
  wishlist?: (Product | string)[];
  wishList?: (Product | string)[];
  createdAt?: string;
  updatedAt?: string;
}

export type User = UserProfile;

export interface Review {
  _id: string;
  productId: string;
  userId: string | UserProfile;
  orderId: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
}
