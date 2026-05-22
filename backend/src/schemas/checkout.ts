import { z } from 'zod';

export const createCheckoutSchema = z.object({
  body: z.object({
    deliveryMethod: z.enum(['shipping', 'pickup']).default('shipping'),
    paymentMethod: z.enum(['transfer', 'galio']).optional(),
    shippingDetails: z.object({
      name: z.string().min(1, 'Name is required'),
      email: z.string().email('Invalid email'),
      address: z.object({
        line1: z.string().optional(),
        line2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postal_code: z.string().min(1, 'Postal code is required'),
        country: z.string().min(1, 'Country is required'),
      }),
    }),
  }),
});