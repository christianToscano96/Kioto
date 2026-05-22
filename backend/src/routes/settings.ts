import { Router } from 'express';
import { authenticate, adminOnly } from '../middleware/auth';
import Settings from '../models/Settings';
import User from '../models/User';
import { verifyToken } from '../utils/jwt';
import { resetSettingsCache } from '../services/email';
import { resetGalioSettingsCache } from '../services/galio';

interface Settings {
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
    galio?: {
      apiKey?: string;
      clientId?: string;
      sandbox?: boolean;
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

const router = Router();

// Default settings
const defaultSettings: Settings = {
  store: {
    name: 'KIOTO',
    logo: '',
    currency: 'USD',
    timezone: 'America/Argentina',
    taxEnabled: false,
    taxRate: 0,
    shipping: {
      flatRate: 500,
      freeShippingOver: 5000,
    },
  },
  email: {
    user: '',
    pass: '',
    from: '',
  },
  payments: {
    galio: {
      apiKey: '',
      clientId: '',
      sandbox: true,
    },
  },
  notifications: {
    orderEmails: true,
    lowStockEmails: true,
    webhookUrl: '',
  },
  appearance: {
    primaryColor: '#1976d2',
    darkMode: false,
  },
  security: {
    twoFactor: false,
    apiKey: '',
  },
  social: {
    instagram: '',
    whatsapp: '',
    facebook: '',
  },
  policies: {
    terms: '',
    privacy: '',
  },
};


const toPublicSettings = (settings: any) => ({
  store: settings.store,
  appearance: settings.appearance,
  social: settings.social,
  policies: settings.policies,
});

// Get settings. Admins receive full settings; public callers receive a sanitized subset.
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Create default settings
      settings = await Settings.create(defaultSettings);
    }
    const rawSettings = settings.toObject();
    const token = req.cookies?.token;

    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId).select('role').lean();
        if (user?.role === 'admin') {
          res.json(rawSettings);
          return;
        }
      } catch {
        // Invalid public token: fall through to sanitized settings.
      }
    }

    res.json(toPublicSettings(rawSettings));
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
router.put('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings) {
      res.status(400).json({ error: 'Settings data required' });
      return;
    }

    let existingSettings = await Settings.findOne();
    if (existingSettings) {
      // Update existing
      Object.assign(existingSettings, settings);
      await existingSettings.save();
      resetSettingsCache();
      resetGalioSettingsCache();
      res.json(existingSettings.toObject());
    } else {
      // Create new
      const newSettings = await Settings.create(settings);
      res.json(newSettings.toObject());
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;