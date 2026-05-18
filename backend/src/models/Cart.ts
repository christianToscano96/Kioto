import mongoose, { Document, Model, Schema } from 'mongoose';
import { ICartItem } from './types';

// Interface for Cart document
export interface ICart extends Document {
  sessionId: string;
  items: ICartItem[];
  converted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Cart Item Schema
const cartItemSchema = new Schema<ICartItem>({
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

// Cart Schema
const cartSchema = new Schema<ICart>(
  {
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      unique: true,
    },
    items: [cartItemSchema],
    converted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index on sessionId (created automatically by unique: true above)
cartSchema.index({ converted: 1, updatedAt: 1 });

// Export model
const Cart: Model<ICart> = mongoose.model<ICart>('Cart', cartSchema);

export default Cart;