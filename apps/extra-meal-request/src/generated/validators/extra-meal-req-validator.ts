import { z } from 'zod';

/**
 * Zod schema for ExtraMealReq validation
 */
export const ExtraMealReqSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  additionalRequest: z.string().optional(),
  approvalTrigger: z.boolean().optional(),
  currentStatus: z.string().optional(),
  department: z.string().optional(),
  durationHours: z.number().int().optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  mealCategory: z.string().optional(),
  purpose: z.string().optional(),
  quantity: z.number().int().optional(),
  recordID: z.string().optional(),
  requestCreatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  requesterEmail: z.string().optional(),
  requesterName: z.string().optional(),
  requestID: z.string().optional(),
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
});

/**
 * Schema for creating a new ExtraMealReq (omits system-generated ID)
 */
export const CreateExtraMealReqSchema = ExtraMealReqSchema.omit({ id: true });

/**
 * Schema for updating an existing ExtraMealReq
 */
export const UpdateExtraMealReqSchema = ExtraMealReqSchema;

export type ExtraMealReqInput = z.infer<typeof ExtraMealReqSchema>;
export type CreateExtraMealReqInput = z.infer<typeof CreateExtraMealReqSchema>;
export type UpdateExtraMealReqInput = z.infer<typeof UpdateExtraMealReqSchema>;