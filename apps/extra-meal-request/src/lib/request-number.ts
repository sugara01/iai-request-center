import type { RequestKendaraan } from '@/generated/models/request-kendaraan-model';

const REQUEST_NUMBER_PATTERN = /^RQ\d{10}$/;

export function createVehicleRequestNumber(id: number, createdDate: Date = new Date()): string {
  const year = String(createdDate.getFullYear()).slice(-2);
  const month = String(createdDate.getMonth() + 1).padStart(2, '0');
  const day = String(createdDate.getDate()).padStart(2, '0');
  const sequence = String(id).padStart(4, '0');
  return `RQ${year}${month}${day}${sequence}`;
}

export function createNewVehicleRequestNumber(createdDate: Date = new Date()): string {
  const sequence = crypto.getRandomValues(new Uint16Array(1))[0] % 10000;
  return createVehicleRequestNumber(sequence, createdDate);
}

export function getVehicleRequestNumber(request: Pick<RequestKendaraan, 'id' | 'title' | 'createdDate'>): string {
  if (REQUEST_NUMBER_PATTERN.test(request.title)) return request.title;

  const created = request.createdDate ? new Date(request.createdDate) : undefined;
  if (!created || Number.isNaN(created.getTime())) return `RQ${String(request.id).padStart(4, '0')}`;
  return createVehicleRequestNumber(request.id, created);
}
