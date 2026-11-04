import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { initialize } from '@microsoft/power-apps/app';

import { RequestKendaraanAppsService } from '@/generated/services/RequestKendaraanAppsService';
import type { IGetAllOptions } from '@/generated/models/CommonModels';
import type { RequestKendaraanAppsRead, RequestKendaraanAppsWrite } from '@/generated/models/RequestKendaraanAppsModel';
import {
  RequestKendaraanAdminDecisionKeyToLabel,
  RequestKendaraanCurrentStatusKeyToLabel,
  RequestKendaraanPlantDirectorDecisionKeyToLabel,
  type RequestKendaraan,
} from '@/generated/models/request-kendaraan-model';
import { compareNewestSharePointDate } from '@/lib/sharepoint-date';
import { getVehicleDepartmentSharePointValue, normalizeVehicleDepartment } from '@/lib/vehicle-department';
import { normalizeVehicleDestination, vehicleDestinationLabels } from '@/lib/vehicle-destination';

type VehicleRequestCreateInput = Omit<RequestKendaraan, 'id'>;
type VehicleRequestUpdateInput = Partial<Omit<RequestKendaraan, 'id'>>;

const VEHICLE_PAGE_SIZE = 500;

function getSharePointText(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value && typeof value === 'object' && 'Value' in value) {
    return getSharePointText((value as { Value?: unknown }).Value);
  }
  return undefined;
}

function findChoiceKey<T extends string>(value: unknown, choices: Record<T, string>): T | undefined {
  const textValue = getSharePointText(value);
  if (!textValue) return undefined;
  const normalized = textValue.toLowerCase();
  return (Object.entries(choices) as [T, string][]).find(
    ([key, label]: [T, string]) => key.toLowerCase() === normalized || label.toLowerCase() === normalized,
  )?.[0];
}

function mapSharePointVehicleRequest(record: RequestKendaraanAppsRead): RequestKendaraan {
  return {
    id: record.ID ?? 0,
    title: getSharePointText(record.Title) ?? '',
    adminDecisionKey: findChoiceKey(record.AdminDecision, RequestKendaraanAdminDecisionKeyToLabel),
    adminNote: getSharePointText(record.AdminNote),
    catatan: getSharePointText(record.CatatanRequester),
    created: getSharePointText(record.Created),
    createdDate: getSharePointText(record.CreatedDate),
    currentStatusKey: findChoiceKey(record.CurrentStatus, RequestKendaraanCurrentStatusKeyToLabel),
    departemenKey: normalizeVehicleDepartment(record.Departemen),
    emailPemohon: getSharePointText(record.EmailPemohon),
    jam: getSharePointText(record.Jam),
    jumlahPenumpang: getSharePointText(record.JumlahPenumpang),
    keperluan: getSharePointText(record.Keperluan),
    lastUpdate: getSharePointText(record.LastUpdate),
    namaPemohon: getSharePointText(record.NamaPemohon),
    plantDirectorDecisionKey: findChoiceKey(record.PlantDirectorDecision, RequestKendaraanPlantDirectorDecisionKeyToLabel),
    plantDirectorNote: getSharePointText(record.PlantDirectorNote),
    tanggal: getSharePointText(record.Tanggal),
    titikJemput: getSharePointText(record.TitikJemput),
    tujuanKey: normalizeVehicleDestination(record.Tujuan),
    tujuanLainnyaDet: getSharePointText(record.TujuanLainnyaDet),
  };
}

export function useVehicleRequests(options?: IGetAllOptions, enabled = true) {
  return useQuery({
    queryKey: ['requestKendaraanApps-list', options],
    enabled,
    queryFn: async () => {
      await new Promise<void>((resolve: () => void) => window.setTimeout(resolve, 500));
      await initialize();
      const records: RequestKendaraanAppsRead[] = [];
      let skip = options?.skip ?? 0;

      while (true) {
        const remaining = options?.top === undefined ? undefined : options.top - records.length;
        if (remaining !== undefined && remaining <= 0) break;
        const pageSize = Math.min(options?.maxPageSize ?? VEHICLE_PAGE_SIZE, remaining ?? VEHICLE_PAGE_SIZE);
        const result = await RequestKendaraanAppsService.getAll({
          ...options,
          orderBy: options?.orderBy ?? ['Created desc'],
          maxPageSize: pageSize,
          top: pageSize,
          skip,
        });
        if (!result.success) throw result.error;
        records.push(...result.data);
        if (result.data.length < pageSize) break;
        skip += result.data.length;
      }

      return records
        .map((record: RequestKendaraanAppsRead) => mapSharePointVehicleRequest(record))
        .sort((a: RequestKendaraan, b: RequestKendaraan) =>
          compareNewestSharePointDate(a.created ?? a.createdDate, b.created ?? b.createdDate, a.id, b.id),
        );
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: () => document.visibilityState === 'visible' ? 15_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: 3,
    retryDelay: (attempt: number) => 500 * 2 ** attempt,
  });
}

function mapTextFields(data: VehicleRequestUpdateInput): Partial<Omit<RequestKendaraanAppsWrite, 'ID'>> {
  const departmentKey = data.departemenKey ? normalizeVehicleDepartment(data.departemenKey) : undefined;
  const destinationKey = data.tujuanKey ? normalizeVehicleDestination(data.tujuanKey) : undefined;
  const departmentLabel = departmentKey ? getVehicleDepartmentSharePointValue(departmentKey) : undefined;
  const destinationLabel = destinationKey ? vehicleDestinationLabels[destinationKey] : undefined;
  const currentStatusLabel = data.currentStatusKey
    ? RequestKendaraanCurrentStatusKeyToLabel[data.currentStatusKey]
    : undefined;
  const adminDecisionLabel = data.adminDecisionKey
    ? RequestKendaraanAdminDecisionKeyToLabel[data.adminDecisionKey]
    : undefined;
  const plantDirectorDecisionLabel = data.plantDirectorDecisionKey
    ? RequestKendaraanPlantDirectorDecisionKeyToLabel[data.plantDirectorDecisionKey]
    : undefined;

  return {
    ...(departmentLabel ? { Departemen: departmentLabel } : {}),
    ...(destinationLabel ? { Tujuan: destinationLabel } : {}),
    ...(data.currentStatusKey !== undefined ? { CurrentStatus: currentStatusLabel } : {}),
    ...('adminDecisionKey' in data ? { AdminDecision: adminDecisionLabel ?? '' } : {}),
    ...('plantDirectorDecisionKey' in data ? { PlantDirectorDecision: plantDirectorDecisionLabel ?? '' } : {}),
  };
}

function mapVehicleUpdate(data: VehicleRequestUpdateInput): Partial<Omit<RequestKendaraanAppsWrite, 'ID'>> {
  const choices = mapTextFields(data);
  return {
    ...choices,
    ...(data.title !== undefined ? { Title: data.title } : {}),
    ...(data.namaPemohon !== undefined ? { NamaPemohon: data.namaPemohon } : {}),
    ...(data.emailPemohon !== undefined ? { EmailPemohon: data.emailPemohon } : {}),
    ...(data.tanggal !== undefined ? { Tanggal: data.tanggal } : {}),
    ...(data.jam !== undefined ? { Jam: data.jam } : {}),
    ...(data.tujuanLainnyaDet !== undefined ? { TujuanLainnyaDet: data.tujuanLainnyaDet } : {}),
    ...(data.keperluan !== undefined ? { Keperluan: data.keperluan } : {}),
    ...(data.jumlahPenumpang !== undefined ? { JumlahPenumpang: data.jumlahPenumpang } : {}),
    ...(data.catatan !== undefined ? { CatatanRequester: data.catatan } : {}),
    ...(data.titikJemput !== undefined ? { TitikJemput: data.titikJemput } : {}),
    ...(data.adminNote !== undefined ? { AdminNote: data.adminNote } : {}),
    ...(data.plantDirectorNote !== undefined ? { PlantDirectorNote: data.plantDirectorNote } : {}),
    ...(data.createdDate !== undefined ? { CreatedDate: data.createdDate } : {}),
    ...(data.lastUpdate !== undefined ? { LastUpdate: data.lastUpdate } : {}),
  };
}

function getChoiceWriteError(error: unknown): Error {
  const detail = error instanceof Error ? error.message : String(error);
  return new Error(`Request kendaraan gagal disimpan ke SharePoint. Detail: ${detail}`);
}

export function useCreateVehicleRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VehicleRequestCreateInput) => {
      await initialize();
      const departmentLabel = getVehicleDepartmentSharePointValue(data.departemenKey);
      const destinationKey = normalizeVehicleDestination(data.tujuanKey);
      const destinationLabel = destinationKey ? vehicleDestinationLabels[destinationKey] : undefined;

      if (!departmentLabel) {
        throw new Error('Departemen wajib dipilih dan harus sesuai dengan pilihan Departemen di SharePoint.');
      }
      if (!destinationLabel) {
        throw new Error('Tujuan wajib dipilih dan harus sesuai dengan pilihan Tujuan di SharePoint.');
      }
      const choiceFields = mapTextFields({
        departemenKey: data.departemenKey,
        tujuanKey: destinationKey,
        currentStatusKey: 'Submitted',
      });

      const record: Omit<RequestKendaraanAppsWrite, 'ID'> = {
        Title: data.title,
        NamaPemohon: data.namaPemohon,
        EmailPemohon: data.emailPemohon,
        ...choiceFields,
        Tanggal: data.tanggal,
        Jam: data.jam,

        TujuanLainnyaDet: destinationKey === 'Lainnya' ? data.tujuanLainnyaDet : undefined,
        Keperluan: data.keperluan,
        CatatanRequester: data.catatan,
        JumlahPenumpang: data.jumlahPenumpang,
        TitikJemput: data.titikJemput,

        CreatedDate: data.createdDate,
        LastUpdate: data.lastUpdate,
      };

      const result = await RequestKendaraanAppsService.create(record);
      if (!result.success) throw getChoiceWriteError(result.error);
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requestKendaraanApps-list'] });
    },
  });
}

export function useUpdateVehicleRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, changedFields }: { id: string; changedFields: VehicleRequestUpdateInput }) => {
      const record = mapVehicleUpdate(changedFields);
      await initialize();
      const result = await RequestKendaraanAppsService.update(id, record);
      if (!result.success) throw getChoiceWriteError(result.error);
      return result.data;
    },
    onSuccess: (_data: RequestKendaraanAppsRead, variables: { id: string; changedFields: VehicleRequestUpdateInput }) => {
      void queryClient.invalidateQueries({ queryKey: ['requestKendaraanApps-list'] });
      void queryClient.invalidateQueries({ queryKey: ['requestKendaraanApps', variables.id] });
    },
  });
}

export function useDeleteVehicleRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await initialize();
      await RequestKendaraanAppsService.delete(id);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['requestKendaraanApps-list'] }),
  });
}
