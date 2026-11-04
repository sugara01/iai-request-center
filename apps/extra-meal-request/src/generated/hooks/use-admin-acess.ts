import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminAcessService } from "../services/admin-acess-service";
import type { AdminAcess } from "../models/admin-acess-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all AdminAcess records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, title, mealAdmin, vehicleAdmin
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useAdminAcessList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["adminAcess-list", options],
    queryFn: () => AdminAcessService.getAll(options),
  });
}

/**
 * Retrieve a single AdminAcess record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useAdminAcess(id: string) {
  return useQuery({
    queryKey: ["adminAcess", id],
    queryFn: () => AdminAcessService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new AdminAcess record.
 * @remarks Form validation: use CreateAdminAcessSchema with zodResolver for type-safe create forms
 */
export function useCreateAdminAcess() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<AdminAcess, "id">) => AdminAcessService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["adminAcess-list"] });
    },
  });
}

/**
 * Update an existing AdminAcess record.
 * @remarks Form validation: use UpdateAdminAcessSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateAdminAcess() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<AdminAcess, "id">>;
    }) => AdminAcessService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["adminAcess-list"] });
      client.invalidateQueries({ queryKey: ["adminAcess", variables.id] });
    },
  });
}

/**
 * Delete a AdminAcess record by its unique identifier.
 */
export function useDeleteAdminAcess() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminAcessService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["adminAcess-list"] });
      client.invalidateQueries({ queryKey: ["adminAcess", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const AdminAcess_DATA_SOURCE_TYPE = 'SharePoint' as const;

export { AdminAcessSchema, CreateAdminAcessSchema, UpdateAdminAcessSchema } from "../validators/admin-acess-validator";
export type { AdminAcessInput, CreateAdminAcessInput, UpdateAdminAcessInput } from "../validators/admin-acess-validator";