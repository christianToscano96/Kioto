export const LOCAL_POSTAL_CODE = '4512';

export type DeliveryMethod = 'shipping' | 'pickup';
export type PaymentMethod = 'transfer' | 'galio';

export type ArgentineProvinceId =
  | 'caba'
  | 'buenos_aires'
  | 'catamarca'
  | 'chaco'
  | 'chubut'
  | 'cordoba'
  | 'corrientes'
  | 'entre_rios'
  | 'formosa'
  | 'jujuy'
  | 'la_pampa'
  | 'la_rioja'
  | 'mendoza'
  | 'misiones'
  | 'neuquen'
  | 'rio_negro'
  | 'salta'
  | 'san_juan'
  | 'san_luis'
  | 'santa_cruz'
  | 'santa_fe'
  | 'santiago_del_estero'
  | 'tierra_del_fuego'
  | 'tucuman';

export const LOCAL_CITY = 'Ledesma';
export const LOCAL_PROVINCE_ID: ArgentineProvinceId = 'jujuy';
export const LOCAL_PROVINCE_NAME = 'Jujuy';

export function getLocalAddressDefaults() {
  return {
    city: LOCAL_CITY,
    state: LOCAL_PROVINCE_NAME,
    provinceId: LOCAL_PROVINCE_ID,
  };
}

export interface ArgentineProvince {
  id: ArgentineProvinceId;
  name: string;
}

export const ARGENTINE_PROVINCES: ArgentineProvince[] = [
  { id: 'caba', name: 'Ciudad Autónoma de Buenos Aires' },
  { id: 'buenos_aires', name: 'Buenos Aires' },
  { id: 'catamarca', name: 'Catamarca' },
  { id: 'chaco', name: 'Chaco' },
  { id: 'chubut', name: 'Chubut' },
  { id: 'cordoba', name: 'Córdoba' },
  { id: 'corrientes', name: 'Corrientes' },
  { id: 'entre_rios', name: 'Entre Ríos' },
  { id: 'formosa', name: 'Formosa' },
  { id: 'jujuy', name: 'Jujuy' },
  { id: 'la_pampa', name: 'La Pampa' },
  { id: 'la_rioja', name: 'La Rioja' },
  { id: 'mendoza', name: 'Mendoza' },
  { id: 'misiones', name: 'Misiones' },
  { id: 'neuquen', name: 'Neuquén' },
  { id: 'rio_negro', name: 'Río Negro' },
  { id: 'salta', name: 'Salta' },
  { id: 'san_juan', name: 'San Juan' },
  { id: 'san_luis', name: 'San Luis' },
  { id: 'santa_cruz', name: 'Santa Cruz' },
  { id: 'santa_fe', name: 'Santa Fe' },
  { id: 'santiago_del_estero', name: 'Santiago del Estero' },
  { id: 'tierra_del_fuego', name: 'Tierra del Fuego' },
  { id: 'tucuman', name: 'Tucumán' },
];

interface PostalRange {
  province: ArgentineProvinceId;
  from: number;
  to: number;
}

/** Rangos oficiales CPA numérico por provincia (Argentina). */
const POSTAL_CODE_RANGES: PostalRange[] = [
  { province: 'caba', from: 1000, to: 1440 },
  { province: 'buenos_aires', from: 1600, to: 1893 },
  { province: 'buenos_aires', from: 1900, to: 8185 },
  { province: 'cordoba', from: 2400, to: 2679 },
  { province: 'santa_fe', from: 2000, to: 3086 },
  { province: 'santa_fe', from: 3560, to: 3587 },
  { province: 'entre_rios', from: 2820, to: 3284 },
  { province: 'misiones', from: 3300, to: 3384 },
  { province: 'corrientes', from: 3192, to: 3192 },
  { province: 'corrientes', from: 3400, to: 3491 },
  { province: 'chaco', from: 3500, to: 3734 },
  { province: 'formosa', from: 3600, to: 3636 },
  { province: 'tucuman', from: 4000, to: 4178 },
  { province: 'santiago_del_estero', from: 4200, to: 4351 },
  { province: 'catamarca', from: 4134, to: 4134 },
  { province: 'catamarca', from: 4700, to: 4757 },
  { province: 'salta', from: 4400, to: 4568 },
  { province: 'jujuy', from: 4500, to: 4653 },
  { province: 'san_juan', from: 5400, to: 5467 },
  { province: 'la_rioja', from: 5300, to: 5387 },
  { province: 'mendoza', from: 5500, to: 5621 },
  { province: 'san_luis', from: 5700, to: 5883 },
  { province: 'la_pampa', from: 6200, to: 6555 },
  { province: 'la_pampa', from: 8200, to: 8333 },
  { province: 'rio_negro', from: 8142, to: 8142 },
  { province: 'neuquen', from: 8300, to: 8353 },
  { province: 'rio_negro', from: 8300, to: 8536 },
  { province: 'cordoba', from: 5000, to: 5987 },
  { province: 'chubut', from: 9000, to: 9220 },
  { province: 'santa_cruz', from: 9011, to: 9407 },
  { province: 'tierra_del_fuego', from: 9410, to: 9430 },
];

/** Tarifas de envío en miles de pesos (ARS). */
const SHIPPING_MIL_BY_PROVINCE: Record<ArgentineProvinceId, number> = {
  mendoza: 4,
  san_juan: 6,
  san_luis: 6,
  la_rioja: 6,
  cordoba: 7,
  santa_fe: 8,
  entre_rios: 8,
  caba: 10,
  buenos_aires: 11,
  catamarca: 12,
  santiago_del_estero: 12,
  tucuman: 13,
  salta: 13,
  jujuy: 13,
  chaco: 14,
  formosa: 14,
  corrientes: 14,
  misiones: 14,
  la_pampa: 15,
  neuquen: 15,
  rio_negro: 15,
  chubut: 18,
  santa_cruz: 18,
  tierra_del_fuego: 22,
};

export interface ShippingQuote {
  cost: number;
  costMil: number;
  label: string;
  province: ArgentineProvinceId | null;
  provinceName: string | null;
  zone: 'local' | 'invalid' | ArgentineProvinceId;
  isFree: boolean;
  isValid: boolean;
}

export function getProvinceById(id: ArgentineProvinceId): ArgentineProvince {
  return ARGENTINE_PROVINCES.find((province) => province.id === id)!;
}

export function getProvinceByName(name: string): ArgentineProvince | undefined {
  const normalized = name.trim().toLowerCase();
  return ARGENTINE_PROVINCES.find(
    (province) => province.name.toLowerCase() === normalized,
  );
}

export function normalizePostalCode(postalCode: string): string {
  const trimmed = postalCode.trim().toUpperCase();
  const digits = trimmed.replace(/\D/g, '');

  if (digits === LOCAL_POSTAL_CODE || trimmed === `Y${LOCAL_POSTAL_CODE}`) {
    return LOCAL_POSTAL_CODE;
  }

  return digits || trimmed;
}

export function isLocalPostalCode(postalCode: string): boolean {
  return normalizePostalCode(postalCode) === LOCAL_POSTAL_CODE;
}

function getPostalCodeNumber(postalCode: string): number | null {
  const normalized = normalizePostalCode(postalCode);
  if (normalized === LOCAL_POSTAL_CODE) return 4512;
  const numericCode = parseInt(normalized, 10);
  return Number.isNaN(numericCode) ? null : numericCode;
}

export function getMatchingProvinces(postalCode: string): ArgentineProvinceId[] {
  const numericCode = getPostalCodeNumber(postalCode);
  if (numericCode === null) return [];
  if (isLocalPostalCode(postalCode)) return [LOCAL_PROVINCE_ID];

  return POSTAL_CODE_RANGES.filter(
    (range) => numericCode >= range.from && numericCode <= range.to,
  ).map((range) => range.province);
}

export function getProvinceFromPostalCode(
  postalCode: string,
  selectedProvinceId?: ArgentineProvinceId,
): ArgentineProvinceId | null {
  const matches = getMatchingProvinces(postalCode);
  if (matches.length === 0) return null;
  if (selectedProvinceId && matches.includes(selectedProvinceId)) {
    return selectedProvinceId;
  }
  return matches[0];
}

export function isPostalCodeValidForProvince(
  postalCode: string,
  provinceId: ArgentineProvinceId,
): boolean {
  return getMatchingProvinces(postalCode).includes(provinceId);
}

function getShippingMil(postalCode: string, provinceId: ArgentineProvinceId): number {
  const numericCode = getPostalCodeNumber(postalCode);
  if (numericCode === null) return SHIPPING_MIL_BY_PROVINCE[provinceId];

  if (provinceId === 'buenos_aires') {
    if (numericCode >= 1600 && numericCode <= 1893) return 10;
    if (numericCode >= 1900 && numericCode <= 8185) return 12;
  }

  return SHIPPING_MIL_BY_PROVINCE[provinceId];
}

export function milToArs(mil: number): number {
  return mil * 1000;
}

export function formatShippingCost(cost: number): string {
  if (cost === 0) return 'Gratis';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(cost);
}

export function formatShippingMil(mil: number): string {
  if (mil === 0) return 'Gratis';
  return `${mil} mil`;
}

export function formatShippingQuote(quote: ShippingQuote): string {
  if (quote.isFree) return 'Gratis';
  return `${formatShippingCost(quote.cost)} (${formatShippingMil(quote.costMil)})`;
}

export function calculateShipping(
  postalCode: string,
  deliveryMethod: DeliveryMethod = 'shipping',
  selectedProvinceId?: ArgentineProvinceId,
): ShippingQuote {
  if (deliveryMethod === 'pickup') {
    if (!isLocalPostalCode(postalCode)) {
      return {
        cost: 0,
        costMil: 0,
        label: 'Retiro solo disponible en zona local (4512)',
        province: null,
        provinceName: null,
        zone: 'invalid',
        isFree: false,
        isValid: false,
      };
    }

    return {
      cost: 0,
      costMil: 0,
      label: 'Retiro en punto de entrega',
      province: LOCAL_PROVINCE_ID,
      provinceName: LOCAL_PROVINCE_NAME,
      zone: 'local',
      isFree: true,
      isValid: true,
    };
  }

  if (isLocalPostalCode(postalCode)) {
    return {
      cost: 0,
      costMil: 0,
      label: `Envío local gratis (${LOCAL_CITY}, ${LOCAL_PROVINCE_NAME})`,
      province: LOCAL_PROVINCE_ID,
      provinceName: LOCAL_PROVINCE_NAME,
      zone: 'local',
      isFree: true,
      isValid: true,
    };
  }

  const provinceId = getProvinceFromPostalCode(postalCode, selectedProvinceId);
  if (!provinceId) {
    return {
      cost: 0,
      costMil: 0,
      label: 'Código postal no reconocido',
      province: null,
      provinceName: null,
      zone: 'invalid',
      isFree: false,
      isValid: false,
    };
  }

  if (
    selectedProvinceId &&
    !isPostalCodeValidForProvince(postalCode, selectedProvinceId)
  ) {
    return {
      cost: 0,
      costMil: 0,
      label: 'El CP no corresponde a la provincia seleccionada',
      province: provinceId,
      provinceName: getProvinceById(provinceId).name,
      zone: 'invalid',
      isFree: false,
      isValid: false,
    };
  }

  const costMil = getShippingMil(postalCode, provinceId);
  const cost = milToArs(costMil);
  const provinceName = getProvinceById(provinceId).name;

  return {
    cost,
    costMil,
    label: `Envío a ${provinceName}`,
    province: provinceId,
    provinceName,
    zone: provinceId,
    isFree: false,
    isValid: true,
  };
}

export function resolvePaymentMethod(): PaymentMethod {
  return 'galio';
}

export const PICKUP_POINT = {
  name: 'Kioto — Punto de retiro',
  address: `${LOCAL_CITY}, ${LOCAL_PROVINCE_NAME} (CP ${LOCAL_POSTAL_CODE})`,
  postalCode: LOCAL_POSTAL_CODE,
  hours: 'Lun a Vie · 10:00 – 18:00',
  notes: 'Te avisamos por email cuando tu pedido esté listo para retirar.',
};
