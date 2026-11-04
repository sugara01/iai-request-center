import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestKendaraanAppsService } from "../services/request-kendaraan-apps-service";
import type { RequestKendaraanApps } from "../models/request-kendaraan-apps-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestKendaraanApps records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, title, adminDecision, adminNote, createdDate, currentStatus, departemen, emailPemohon, jam, jumlahPenumpang, keperluan, lastUpdate, namaPemohon, plantDirectorDecision, plantDirectorNote, tanggal, titikJemput, tujuan, tujuanLainnyaDet
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestKendaraanAppsList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestKendaraanApps-list", options],
    queryFn: () => RequestKendaraanAppsService.getAll(options),
  });
}

/**
 * Retrieve a single RequestKendaraanApps record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestKendaraanApps(id: string) {
  return useQuery({
    queryKey: ["requestKendaraanApps", id],
    queryFn: () => RequestKendaraanAppsService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestKendaraanApps record.
 * @remarks Form validation: use CreateRequestKendaraanAppsSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestKendaraanApps() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestKendaraanApps, "id">) => RequestKendaraanAppsService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestKendaraanApps-list"] });
    },
  });
}

/**
 * Update an existing RequestKendaraanApps record.
 * @remarks Form validation: use UpdateRequestKendaraanAppsSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestKendaraanApps() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestKendaraanApps, "id">>;
    }) => RequestKendaraanAppsService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestKendaraanApps-list"] });
      client.invalidateQueries({ queryKey: ["requestKendaraanApps", variables.id] });
    },
  });
}

/**
 * Delete a RequestKendaraanApps record by its unique identifier.
 */
export function useDeleteRequestKendaraanApps() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestKendaraanAppsService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestKendaraanApps-list"] });
      client.invalidateQueries({ queryKey: ["requestKendaraanApps", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestKendaraanApps_DATA_SOURCE_TYPE = 'SharePoint' as const;

export { RequestKendaraanAppsSchema, CreateRequestKendaraanAppsSchema, UpdateRequestKendaraanAppsSchema } from "../validators/request-kendaraan-apps-validator";
export type { RequestKendaraanAppsInput, CreateRequestKendaraanAppsInput, UpdateRequestKendaraanAppsInput } from "../validators/request-kendaraan-apps-validator";