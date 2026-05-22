import mongoose, { Document, Model, Schema } from 'mongoose';
import { ICartItem, OrderStatus } from './types';

// Interface for Order document
export interface IOrder extends Document {
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  items: ICartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  stripePaymentIntentId?: string;
    galioPaymentId?: string;
    paymentUrl?: string;
    deliveryMethod?: 'shipping' | 'pickup';
    paymentMethod?: 'transfer' | 'galio';
    shippingDetails?: {
    name: string;
    email: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postal_code: string;
      country: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Cart Item Schema (embedded in Order)
const orderItemSchema = new Schema<ICartItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price must be positive'],
  },
  size: {
    type: String,
  },
  color: {
    type: String,
  },
});

// Order Schema
const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    sessionId: {
      type: String,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required'],
      default: 0,
    },
    shipping: {
      type: Number,
      required: [true, 'Shipping is required'],
      default: 0,
    },
    total: {
      type: Number,
      required: [true, 'Total is required'],
      min: [0, 'Total must be positive'],
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    stripePaymentIntentId: {
      type: String,
    },
    galioPaymentId: {
      type: String,
    },
    paymentUrl: {
      type: String,
    },
    deliveryMethod: {
      type: String,
      enum: ['shipping', 'pickup'],
      default: 'shipping',
    },
    paymentMethod: {
      type: String,
      enum: ['transfer', 'galio'],
      default: 'galio',
    },
    shippingDetails: {
      name: { type: String },
      email: { type: String },
      address: {
        line1: { type: String },
        line2: { type: String },
        city: { type: String },
        state: { type: String },
        postal_code: { type: String },
        country: { type: String },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ sessionId: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ galioPaymentId: 1 });

// Export model
const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);

export default Order;