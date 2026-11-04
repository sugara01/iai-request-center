import type { RequestKendaraan } from '@/generated/models/request-kendaraan-model';

export type VehicleDestinationKey = 'JakartaMerak' | 'MerakJakartaHO' | 'Lainnya';

export const vehicleDestinationLabels: Record<VehicleDestinationKey, string> = {
  JakartaMerak: 'Jakarta - Merak',
  MerakJakartaHO: 'Merak - Jakarta (HO)',
  Lainnya: 'Lainnya',
};

const destinationAliases: Record<string, VehicleDestinationKey> = {
  jakartamerak: 'JakartaMerak',
  'jakarta - merak': 'JakartaMerak',
  merakjakarta: 'MerakJakartaHO',
  merakjakartaho: 'MerakJakartaHO',
  'merak - jakarta': 'MerakJakartaHO',
  'merak - jakarta (ho)': 'MerakJakartaHO',
  lainnya: 'Lainnya',
  other: 'Lainnya',
};

export function normalizeVehicleDestination(value: string | undefined): VehicleDestinationKey | undefined {
  if (!value?.trim()) return undefined;
  return destinationAliases[value.trim().toLowerCase()];
}

export function resolveVehicleDestinationKey(request: RequestKendaraan): VehicleDestinationKey | undefined {
  return normalizeVehicleDestination(request.tujuanKey);
}

export function getVehicleDestinationLabel(request: RequestKendaraan): string {
  const key = resolveVehicleDestinationKey(request);
  return key ? vehicleDestinationLabels[key] : request.tujuanKey?.trim() || '-';
}

export function getVehicleDestinationDetail(request: RequestKendaraan): string | undefined {
  return resolveVehicleDestinationKey(request) === 'Lainnya' ? request.tujuanLainnyaDet?.trim() || undefined : undefined;
}

export function getVehicleDestinationSummary(request: RequestKendaraan): string {
  return getVehicleDestinationDetail(request) ?? getVehicleDestinationLabel(request);
}
