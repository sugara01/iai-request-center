import { z } from 'zod';

/**
 * Zod schema for RequestKendaraanApps validation
 */
export const RequestKendaraanAppsSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  adminDecision: z.string().optional(),
  adminNote: z.string().optional(),
  createdDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  currentStatus: z.string().optional(),
  departemen: z.string().optional(),
  emailPemohon: z.string().optional(),
  jam: z.string().optional(),
  jumlahPenumpang: z.string().optional(),
  keperluan: z.string().optional(),
  lastUpdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  namaPemohon: z.string().optional(),
  plantDirectorDecision: z.string().optional(),
  plantDirectorNote: z.string().optional(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  titikJemput: z.string().optional(),
  tujuan: z.string().optional(),
  tujuanLainnyaDet: z.string().optional(),
});

/**
 * Schema for creating a new RequestKendaraanApps (omits system-generated ID)
 */
export const CreateRequestKendaraanAppsSchema = RequestKendaraanAppsSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestKendaraanApps
 */
export const UpdateRequestKendaraanAppsSchema = RequestKendaraanAppsSchema;

export type RequestKendaraanAppsInput = z.infer<typeof RequestKendaraanAppsSchema>;
export type CreateRequestKendaraanAppsInput = z.infer<typeof CreateRequestKendaraanAppsSchema>;
export type UpdateRequestKendaraanAppsInput = z.infer<typeof UpdateRequestKendaraanAppsSchema>;