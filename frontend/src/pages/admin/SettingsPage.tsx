import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SettingsCard } from '@/components/ui/SettingsCard';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { ApiKeyInput } from '@/components/ui/ApiKeyInput';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useSettingsStore } from '@/store/settings';
import { useAuthStore } from '@/store/auth';
import { profileApi } from '@/lib/api';
import { showToast } from '@/components/ui/Toast';
import type { Settings } from '../../../../shared/src';
import { User, Store, CreditCard, Mail, Bell, Palette, Shield, Share2, FileText } from '@/components/icons';

function SettingsEnvNotice({
  title,
  renderVars,
  adminVars,
}: {
  title: string;
  renderVars: string[];
  adminVars: string[];
}) {
  return (
    <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low/60 p-4 text-sm">
      <p className="font-medium text-on-surface">{title}</p>
      <p className="mt-2 text-on-surface-variant">
        Podés cargar credenciales desde este panel (se guardan en la base de datos) o dejarlas vacías
        y usar variables de entorno como respaldo.
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Solo en Render / Vercel
          </p>
          <ul className="mt-1 space-y-1 text-on-surface-variant">
            {renderVars.map((item) => (
              <li key={item}>
                <code className="rounded bg-surface px-1.5 py-0.5 text-xs">{item}</code>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Configurable aquí
          </p>
          <ul className="mt-1 list-disc pl-5 text-on-surface-variant">
            {adminVars.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const SETTINGS_SECTIONS = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'store', label: 'Tienda', icon: Store },
  { id: 'payments', label: 'Pagos', icon: CreditCard },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'appearance', label: 'Apariencia', icon: Palette },
  { id: 'security', label: 'Seguridad', icon: Shield },
  { id: 'social', label: 'Redes', icon: Share2 },
  { id: 'policies', label: 'Políticas', icon: FileText },
];

// Default settings for non-user-specific sections
const DEFAULT_SETTINGS: Settings = {
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
  payments: {
    galio: {
      apiKey: '',
      clientId: '',
      sandbox: true,
    },
  },
  email: {
    user: '',
    pass: '',
    from: '',
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

export function SettingsPage() {
  const { settings, fetchSettings, updateSettings } = useSettingsStore();
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState('profile');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<Settings | null>(null);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  // Separate state for profile form
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      // Settings from backend (no profile section)
      setLocalSettings({ ...DEFAULT_SETTINGS, ...settings });
    } else {
      // Fallback to defaults while loading
      setLocalSettings(DEFAULT_SETTINGS);
    }
  }, [settings]);

  // Sync profileData when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!localSettings) return;
    setSaving(true);
    try {
      await updateSettings(localSettings);
      setHasChanges(false);
      showToast({ type: 'success', title: 'Configuración guardada' });
    } catch {
      showToast({ type: 'error', title: 'Error al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSave = async () => {
    if (!profileData.name || !profileData.email) return;
    setSaving(true);
    try {
      const response = await profileApi.update({
        name: profileData.name,
        email: profileData.email,
      });
      // Update user in auth store
      useAuthStore.setState({ user: response.data.user });
      showToast({ type: 'success', title: 'Perfil actualizado' });
    } catch (error) {
      showToast({ type: 'error', title: 'Error al actualizar perfil' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (path: string, value: unknown) => {
    setLocalSettings(prev => {
      if (!prev) return prev;
      const keys = path.split('.');
      const result = { ...prev };
      let current: any = result;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return result;
    });
    setHasChanges(true);
  };

  const handleChangePassword = async () => {
    if (!passwordData.new || passwordData.new !== passwordData.confirm) {
      showToast({ type: 'error', title: 'Las contraseñas no coinciden' });
      return;
    }
    setSaving(true);
    try {
      await profileApi.changePassword({
        currentPassword: passwordData.current,
        newPassword: passwordData.new,
      });
      showToast({ type: 'success', title: 'Contraseña actualizada' });
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      showToast({ type: 'error', title: 'Error al cambiar contraseña' });
    } finally {
      setSaving(false);
    }
  };

  if (!localSettings) return <div className="p-8">Cargando...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Administra tu tienda" eyebrow="Panel de Administración" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <nav className="lg:col-span-1">
          <div className="bg-surface-container-low rounded-lg border border-outline-variant/30 p-2">
{SETTINGS_SECTIONS.map(section => {
               const Icon = section.icon;
               return (
                 <button
                   key={section.id}
                   onClick={() => setActiveSection(section.id)}
                   className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                     activeSection === section.id
                       ? 'bg-primary-container text-on-primary-container'
                       : 'text-on-surface hover:bg-surface-container'
                   }`}
                 >
                   <Icon size={18} />
                   {section.label}
                 </button>
               );
             })}
          </div>
        </nav>

        <div className="lg:col-span-3 space-y-6">
          {activeSection === 'profile' && (
            <>
              <SettingsCard title="Información Personal" description="Datos de tu cuenta">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre"
                    value={profileData.name}
                    onChange={(e) => setProfileData(p => ({ ...p, name: e.target.value }))}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="mt-4">
                  <Button 
                    onClick={handleProfileSave} 
                    disabled={saving || (profileData.name === user?.name && profileData.email === user?.email)}
                  >
                    {saving ? 'Guardando...' : 'Guardar Perfil'}
                  </Button>
                </div>
              </SettingsCard>

              <SettingsCard title="Cambiar Contraseña" description="Actualiza tu contraseña">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Contraseña Actual"
                    type="password"
                    value={passwordData.current}
                    onChange={(e) => setPasswordData(p => ({ ...p, current: e.target.value }))}
                  />
                  <Input
                    label="Nueva Contraseña"
                    type="password"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData(p => ({ ...p, new: e.target.value }))}
                  />
                  <Input
                    label="Confirmar Contraseña"
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData(p => ({ ...p, confirm: e.target.value }))}
                  />
                </div>
                <div className="mt-4">
                  <Button onClick={handleChangePassword} disabled={saving}>
                    {saving ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </Button>
                </div>
              </SettingsCard>
            </>
          )}

          {activeSection === 'store' && (
            <>
              <SettingsCard title="Información de la Tienda" description="Configuración general">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre de la Tienda"
                    value={localSettings.store?.name || ''}
                    onChange={(e) => updateField('store.name', e.target.value)}
                  />
                  <div>
                    <label className="text-sm font-medium text-on-surface mb-2 block">Logo</label>
                    <ImageUpload
                
                      currentImage={localSettings.store?.logo}
                      onUpload={(url) => updateField('store.logo', url)}
                      onRemove={() => updateField('store.logo', '')}
                    />
                  </div>
                  <Input
                    label="Moneda"
                    value={localSettings.store?.currency || 'USD'}
                    onChange={(e) => updateField('store.currency', e.target.value)}
                  />
                  <Input
                    label="Zona Horaria"
                    value={localSettings.store?.timezone || ''}
                    onChange={(e) => updateField('store.timezone', e.target.value)}
                  />
                </div>
              </SettingsCard>

              <SettingsCard title="Envíos" description="Configuración de envíos">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Tarifa Plana"
                    type="number"
                    value={localSettings.store?.shipping?.flatRate || 0}
                    onChange={(e) => updateField('store.shipping.flatRate', parseFloat(e.target.value))}
                  />
                  <Input
                    label="Envío Gratis Desde"
                    type="number"
                    value={localSettings.store?.shipping?.freeShippingOver || 0}
                    onChange={(e) => updateField('store.shipping.freeShippingOver', parseFloat(e.target.value))}
                  />
                </div>
              </SettingsCard>

              <SettingsCard title="Impuestos" description="Configuración de impuestos">
                <div className="space-y-4">
                  <ToggleSwitch
                    label="Impuestos Habilitados"
                    checked={localSettings.store?.taxEnabled || false}
                    onChange={(checked) => updateField('store.taxEnabled', checked)}
                  />
                  <Input
                    label="Tasa de Impuesto (%)"
                    type="number"
                    value={localSettings.store?.taxRate || 0}
                    onChange={(e) => updateField('store.taxRate', parseFloat(e.target.value))}
                    disabled={!localSettings.store?.taxEnabled}
                  />
                </div>
              </SettingsCard>
            </>
          )}

          {activeSection === 'payments' && (
            <>
              <SettingsEnvNotice
                title="Integraciones de pago"
                renderVars={['PUBLIC_API_URL', 'FRONTEND_URL']}
                adminVars={['API Key de GalioPay', 'Client ID', 'Modo sandbox']}
              />

              <SettingsCard title="GalioPay" description="Credenciales de la pasarela de pagos">
                <div className="space-y-4">
                  <ToggleSwitch
                    label="Modo sandbox (pruebas)"
                    checked={localSettings.payments?.galio?.sandbox ?? true}
                    onChange={(checked) => updateField('payments.galio.sandbox', checked)}
                  />
                  <ApiKeyInput
                    label="API Key"
                    value={localSettings.payments?.galio?.apiKey || ''}
                    onChange={(value) => updateField('payments.galio.apiKey', value)}
                    secret
                  />
                  <ApiKeyInput
                    label="Client ID"
                    value={localSettings.payments?.galio?.clientId || ''}
                    onChange={(value) => updateField('payments.galio.clientId', value)}
                  />
                  <p className="text-xs text-on-surface-variant">
                    Si dejás estos campos vacíos, el backend usará{' '}
                    <code className="rounded bg-surface px-1 py-0.5">GALIO_API_KEY</code> y{' '}
                    <code className="rounded bg-surface px-1 py-0.5">GALIO_CLIENT_ID</code> de Render.
                  </p>
                </div>
              </SettingsCard>
            </>
          )}

          {activeSection === 'email' && (
            <>
              <SettingsEnvNotice
                title="Correo transaccional"
                renderVars={['MONGODB_URI', 'JWT_SECRET']}
                adminVars={['API Key de Brevo', 'Email remitente', 'Email del administrador']}
              />

              <SettingsCard title="Brevo (Sendinblue)" description="Envío de confirmaciones y alertas">
                <div className="space-y-4">
                  <ApiKeyInput
                    label="API Key de Brevo"
                    value={localSettings.email?.pass || ''}
                    onChange={(value) => updateField('email.pass', value)}
                    secret
                  />
                  <Input
                    label="Email remitente"
                    type="email"
                    placeholder="noreply@tudominio.com"
                    value={localSettings.email?.from || ''}
                    onChange={(e) => updateField('email.from', e.target.value)}
                  />
                  <Input
                    label="Email del administrador"
                    type="email"
                    placeholder="admin@tudominio.com"
                    value={localSettings.email?.user || ''}
                    onChange={(e) => updateField('email.user', e.target.value)}
                  />
                  <p className="text-xs text-on-surface-variant">
                    Respaldo por entorno:{' '}
                    <code className="rounded bg-surface px-1 py-0.5">EMAIL_PASS</code> (API key) y{' '}
                    <code className="rounded bg-surface px-1 py-0.5">EMAIL_FROM</code>.
                  </p>
                </div>
              </SettingsCard>
            </>
          )}

          {activeSection === 'notifications' && (
            <>
              <SettingsCard title="Email" description="Configuración de notificaciones">
                <div className="space-y-4">
                  <ToggleSwitch
                    label="Notificaciones de Pedidos"
                    checked={localSettings.notifications?.orderEmails || false}
                    onChange={(checked) => updateField('notifications.orderEmails', checked)}
                  />
                  <ToggleSwitch
                    label="Notificaciones de Stock Bajo"
                    checked={localSettings.notifications?.lowStockEmails || false}
                    onChange={(checked) => updateField('notifications.lowStockEmails', checked)}
                  />
                  <Input
                    label="Webhook URL"
                    placeholder="https://..."
                    value={localSettings.notifications?.webhookUrl || ''}
                    onChange={(e) => updateField('notifications.webhookUrl', e.target.value)}
                  />
                </div>
              </SettingsCard>
            </>
          )}

          {activeSection === 'appearance' && (
            <>
              <SettingsCard title="Tema" description="Personaliza la apariencia">
                <div className="space-y-4">
                  <ColorPicker
                    label="Color Primario"
                    value={localSettings.appearance?.primaryColor || '#1976d2'}
                    onChange={(value) => updateField('appearance.primaryColor', value)}
                  />
                  <ToggleSwitch
                    label="Tema Oscuro"
                    checked={localSettings.appearance?.darkMode || false}
                    onChange={(checked) => updateField('appearance.darkMode', checked)}
                  />
                </div>
              </SettingsCard>
            </>
          )}

          {activeSection === 'security' && (
            <>
              <SettingsCard title="Autenticación" description="Seguridad de la cuenta">
                <div className="space-y-4">
                  <ToggleSwitch
                    label="Autenticación de Dos Factores (2FA)"
                    checked={localSettings.security?.twoFactor || false}
                    onChange={(checked) => updateField('security.twoFactor', checked)}
                  />
                  <div className="border border-outline-variant/30 rounded-lg p-4">
                    <p className="text-sm text-on-surface-variant mb-2">API Keys</p>
                    <ApiKeyInput
                      label="Clave API"
                      value={localSettings.security?.apiKey || ''}
                      onChange={(value) => updateField('security.apiKey', value)}
                    />
                  </div>
                </div>
              </SettingsCard>
            </>
          )}

          {activeSection === 'social' && (
            <>
              <SettingsCard title="Redes Sociales" description="Enlaces a tus redes">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Instagram"
                    placeholder="https://instagram.com/..."
                    value={localSettings.social?.instagram || ''}
                    onChange={(e) => updateField('social.instagram', e.target.value)}
                  />
                  <Input
                    label="WhatsApp"
                    placeholder="+54911..."
                    value={localSettings.social?.whatsapp || ''}
                    onChange={(e) => updateField('social.whatsapp', e.target.value)}
                  />
                  <Input
                    label="Facebook"
                    placeholder="https://facebook.com/..."
                    value={localSettings.social?.facebook || ''}
                    onChange={(e) => updateField('social.facebook', e.target.value)}
                  />
                </div>
              </SettingsCard>
            </>
          )}

          {activeSection === 'policies' && (
            <>
              <SettingsCard title="Términos y Condiciones" description="Texto completo">
                <textarea
                  className="w-full h-40 p-3 rounded-lg border border-outline bg-white text-sm resize-vertical"
                  placeholder="Ingresa los términos y condiciones..."
                  value={localSettings.policies?.terms || ''}
                  onChange={(e) => updateField('policies.terms', e.target.value)}
                />
              </SettingsCard>
              <SettingsCard title="Política de Privacidad" description="Texto completo">
                <textarea
                  className="w-full h-40 p-3 rounded-lg border border-outline bg-white text-sm resize-vertical"
                  placeholder="Ingresa la política de privacidad..."
                  value={localSettings.policies?.privacy || ''}
                  onChange={(e) => updateField('policies.privacy', e.target.value)}
                />
              </SettingsCard>
            </>
          )}
        </div>
      </div>

      {hasChanges && activeSection !== 'profile' && (
        <div className="fixed bottom-6 right-6 bg-surface-container-low rounded-lg shadow-lg p-4 border border-outline-variant/30">
          <div className="flex items-center gap-3">
            <Badge variant="warning" size="sm">Cambios sin guardar</Badge>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}