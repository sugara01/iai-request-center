export type VehicleDepartmentKey =
  | 'Commercial'
  | 'FinanceAccounting'
  | 'HR'
  | 'ITS'
  | 'Lab'
  | 'Maintenance'
  | 'Operation'
  | 'PDLogistic'
  | 'Procurement'
  | 'SHE';

export const vehicleDepartmentLabels: Record<VehicleDepartmentKey, string> = {
  Commercial: 'Commercial',
  FinanceAccounting: 'Finance & Accounting',
  HR: 'HR',
  ITS: 'IT&S',
  Lab: 'Lab',
  Maintenance: 'Maintenance',
  Operation: 'Operation',
  PDLogistic: 'PD (Logistic)',
  Procurement: 'Procurement',
  SHE: 'SHE',
};

const vehicleDepartmentAliases: Record<string, VehicleDepartmentKey> = {
  commercial: 'Commercial',
  finance: 'FinanceAccounting',
  financeaccounting: 'FinanceAccounting',
  'finance & accounting': 'FinanceAccounting',
  'finance and accounting': 'FinanceAccounting',
  'finance accounting': 'FinanceAccounting',
  'f&a': 'FinanceAccounting',
  hr: 'HR',
  'human resources': 'HR',
  its: 'ITS',
  'it&s': 'ITS',
  'it & s': 'ITS',
  lab: 'Lab',
  laboratory: 'Lab',
  maintenance: 'Maintenance',
  operation: 'Operation',
  operations: 'Operation',
  pdlogistic: 'PDLogistic',
  'pd (logistic)': 'PDLogistic',
  'pd logistic': 'PDLogistic',
  logistic: 'PDLogistic',
  procurement: 'Procurement',
  she: 'SHE',
};

function normalizeDepartmentValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizeVehicleDepartment(value: string | undefined): VehicleDepartmentKey | undefined {
  if (!value?.trim()) return undefined;
  return vehicleDepartmentAliases[normalizeDepartmentValue(value)];
}

export function getVehicleDepartmentLabel(key: string | undefined): string {
  const normalizedKey = normalizeVehicleDepartment(key);
  return normalizedKey ? vehicleDepartmentLabels[normalizedKey] : key?.trim() || '-';
}

export function getVehicleDepartmentSharePointValue(key: string | undefined): string | undefined {
  const normalizedKey = normalizeVehicleDepartment(key);
  return normalizedKey ? vehicleDepartmentLabels[normalizedKey] : undefined;
}
