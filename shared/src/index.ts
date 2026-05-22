// Shared TypeScript Types for Admin Ecommerce MVP

// User Types
export interface User {
  _id: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
  createdAt: Date;
}

// Category Types
export interface Category {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export type {
  InventoryMode,
  ColorStockLine,
  SizeVariant,
  InventorySelection,
  ResolvedInventory,
  ProductInventoryFields,
} from './inventory';

export {
  getInventoryMode,
  getTotalStock,
  getSizeStock,
  getAvailableSizes,
  getAvailableColors,
  getColorStockMap,
  resolveInventory,
  productHasSize,
  productHasColor,
} from './inventory';

export type {
  DeliveryMethod,
  PaymentMethod,
  ShippingQuote,
  ArgentineProvinceId,
  ArgentineProvince,
} from './shipping';

export {
  LOCAL_POSTAL_CODE,
  ARGENTINE_PROVINCES,
  normalizePostalCode,
  isLocalPostalCode,
  getProvinceById,
  getProvinceByName,
  getMatchingProvinces,
  getProvinceFromPostalCode,
  isPostalCodeValidForProvince,
  calculateShipping,
  resolvePaymentMethod,
  PICKUP_POINT,
  formatShippingCost,
  formatShippingMil,
  formatShippingQuote,
  milToArs,
} from './shipping';

import type { ColorStockLine, InventoryMode, SizeVariant } from './inventory';

// Product Types
export interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  description: string;
  inventoryMode: InventoryMode;
  stock?: number;
  colors?: ColorStockLine[];
  sizeVariants?: SizeVariant[];
  totalStock?: number;
  published: boolean;
  materials?: string;
  category?: string | { _id: string; name: string; slug?: string };
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateProductInput {
  name: string;
  price: number;
  images: string[];
  description: string;
  inventoryMode: InventoryMode;
  stock?: number;
  colors?: ColorStockLine[];
  sizeVariants?: SizeVariant[];
  published?: boolean;
  materials?: string;
  category?: string;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

// Cart Types
export interface CartItem {
  _id?: string; // Cart item subdocument ID
  productId: string;
  quantity: number;
  price: number;
  // Populated product fields (when cart is populated)
  product?: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    description?: string;
  };
  size?: string;
  color?: string;
}

export interface Cart {
  _id?: string;
  sessionId: string;
  items: CartItem[];
  createdAt?: Date;
}

// Order Types
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  userId?: string;
  sessionId?: string;
  items: OrderItem[];
  subtotal?: number;
  shipping?: number;
  total: number;
  status: OrderStatus;
  stripePaymentIntentId?: string;
  galioPaymentId?: string;
  shippingDetails?: {
    name?: string;
    email?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  createdAt: Date;
  updatedAt?: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Auth Types
export interface AuthResponse {
  user: User;
  token: string;
}

// Notification Types
export type NotificationType = 'order' | 'low_stock' | 'out_of_stock' | 'return';

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  productId?: string;
  productSnapshot?: {
    name: string;
    stock: number;
  };
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Settings Types
export interface Settings {
  profile?: {
    name?: string;
    email?: string;
    password?: string;
  };
  store?: {
    name?: string;
    logo?: string;
    currency?: string;
    timezone?: string;
    taxEnabled?: boolean;
    taxRate?: number;
    shipping?: {
      flatRate?: number;
      freeShippingOver?: number;
    };
  };
  email?: {
    user?: string;
    pass?: string;
    from?: string;
  };
  payments?: {
    stripe?: {
      testMode?: boolean;
      publishableKey?: string;
      secretKey?: string;
    };
    galio?: {
      apiKey?: string;
      clientId?: string;
    };
  };
  notifications?: {
    orderEmails?: boolean;
    lowStockEmails?: boolean;
    webhookUrl?: string;
  };
  appearance?: {
    primaryColor?: string;
    darkMode?: boolean;
  };
  security?: {
    twoFactor?: boolean;
    apiKey?: string;
  };
  social?: {
    instagram?: string;
    whatsapp?: string;
    facebook?: string;
  };
  policies?: {
    terms?: string;
    privacy?: string;
  };
}