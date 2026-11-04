import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExtraMealReqService } from "../services/extra-meal-req-service";
import type { ExtraMealReq } from "../models/extra-meal-req-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ExtraMealReq records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, title, additionalRequest, approvalTrigger, currentStatus, department, durationHours, endDate, mealCategory, purpose, quantity, recordID, requestCreatedAt, requesterEmail, requesterName, requestID, serviceDate, startDate
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useExtraMealReqList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["extraMealReq-list", options],
    queryFn: () => ExtraMealReqService.getAll(options),
  });
}

/**
 * Retrieve a single ExtraMealReq record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useExtraMealReq(id: string) {
  return useQuery({
    queryKey: ["extraMealReq", id],
    queryFn: () => ExtraMealReqService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ExtraMealReq record.
 * @remarks Form validation: use CreateExtraMealReqSchema with zodResolver for type-safe create forms
 */
export function useCreateExtraMealReq() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ExtraMealReq, "id">) => ExtraMealReqService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["extraMealReq-list"] });
    },
  });
}

/**
 * Update an existing ExtraMealReq record.
 * @remarks Form validation: use UpdateExtraMealReqSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateExtraMealReq() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ExtraMealReq, "id">>;
    }) => ExtraMealReqService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["extraMealReq-list"] });
      client.invalidateQueries({ queryKey: ["extraMealReq", variables.id] });
    },
  });
}

/**
 * Delete a ExtraMealReq record by its unique identifier.
 */
export function useDeleteExtraMealReq() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ExtraMealReqService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["extraMealReq-list"] });
      client.invalidateQueries({ queryKey: ["extraMealReq", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ExtraMealReq_DATA_SOURCE_TYPE = 'SharePoint' as const;

export { ExtraMealReqSchema, CreateExtraMealReqSchema, UpdateExtraMealReqSchema } from "../validators/extra-meal-req-validator";
export type { ExtraMealReqInput, CreateExtraMealReqInput, UpdateExtraMealReqInput } from "../validators/extra-meal-req-validator";