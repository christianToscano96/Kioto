import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  store: {
    name: String,
    logo: String,
    currency: String,
    timezone: String,
    taxEnabled: Boolean,
    taxRate: Number,
    shipping: {
      flatRate: Number,
      freeShippingOver: Number,
    },
  },
  payments: {
    stripe: {
      testMode: Boolean,
      publishableKey: String,
      secretKey: String,
    },
    galio: {
      apiKey: String,
      clientId: String,
      sandbox: Boolean,
    },
  },
  email: {
    user: String,
    pass: String,
    from: String,
  },
  notifications: {
    orderEmails: Boolean,
    lowStockEmails: Boolean,
    webhookUrl: String,
  },
  appearance: {
    primaryColor: String,
    darkMode: Boolean,
  },
  security: {
    twoFactor: Boolean,
    apiKey: String,
  },
  social: {
    instagram: String,
    whatsapp: String,
    facebook: String,
  },
  policies: {
    terms: String,
    privacy: String,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Settings', SettingsSchema);