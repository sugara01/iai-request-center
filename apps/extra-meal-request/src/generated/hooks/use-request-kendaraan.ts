import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestKendaraanService } from "../services/request-kendaraan-service";
import type { RequestKendaraan } from "../models/request-kendaraan-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestKendaraan records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, title, adminDecisionKey, adminNote, catatan, createdDate, currentStatusKey, departemenKey, emailPemohon, jam, jumlahPenumpang, keperluan, lastUpdate, namaPemohon, plantDirectorDecisionKey, plantDirectorNote, tanggal, titikJemput, tujuanKey, tujuanLainnyaDet
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestKendaraanList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestKendaraan-list", options],
    queryFn: () => RequestKendaraanService.getAll(options),
  });
}

/**
 * Retrieve a single RequestKendaraan record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestKendaraan(id: string) {
  return useQuery({
    queryKey: ["requestKendaraan", id],
    queryFn: () => RequestKendaraanService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestKendaraan record.
 * @remarks Form validation: use CreateRequestKendaraanSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestKendaraan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestKendaraan, "id">) => RequestKendaraanService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestKendaraan-list"] });
    },
  });
}

/**
 * Update an existing RequestKendaraan record.
 * @remarks Form validation: use UpdateRequestKendaraanSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestKendaraan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestKendaraan, "id">>;
    }) => RequestKendaraanService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestKendaraan-list"] });
      client.invalidateQueries({ queryKey: ["requestKendaraan", variables.id] });
    },
  });
}

/**
 * Delete a RequestKendaraan record by its unique identifier.
 */
export function useDeleteRequestKendaraan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestKendaraanService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestKendaraan-list"] });
      client.invalidateQueries({ queryKey: ["requestKendaraan", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestKendaraan_DATA_SOURCE_TYPE = 'SharePoint' as const;

export { RequestKendaraanSchema, CreateRequestKendaraanSchema, UpdateRequestKendaraanSchema } from "../validators/request-kendaraan-validator";
export type { RequestKendaraanInput, CreateRequestKendaraanInput, UpdateRequestKendaraanInput } from "../validators/request-kendaraan-validator";