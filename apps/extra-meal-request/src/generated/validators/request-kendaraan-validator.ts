import { z } from 'zod';

/**
 * Zod schema for RequestKendaraan validation
 */
export const RequestKendaraanSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  adminDecisionKey: z.enum(['Approved', 'Rejected', 'Available', 'NotAvailable']).optional(),
  adminNote: z.string().optional(),
  catatan: z.string().optional(),
  createdDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  currentStatusKey: z.enum(['Submitted', 'Approved', 'RejectedVehicleNotAvailable', 'PendingPlantDirectorApproval']).optional(),
  departemenKey: z.enum(['Commercial', 'FinanceAccounting', 'HR', 'ITS', 'Lab', 'Maintenance', 'Operation', 'PDLogistic', 'Procurement', 'SHE']).optional(),
  emailPemohon: z.string().optional(),
  jam: z.string().optional(),
  jumlahPenumpang: z.string().optional(),
  keperluan: z.string().optional(),
  lastUpdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  namaPemohon: z.string().optional(),
  plantDirectorDecisionKey: z.enum(['Approved', 'Rejected']).optional(),
  plantDirectorNote: z.string().optional(),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  titikJemput: z.string().optional(),
  tujuanKey: z.enum(['JakartaMerak', 'MerakJakartaHO', 'Lainnya']).optional(),
  tujuanLainnyaDet: z.string().optional(),
});

/**
 * Schema for creating a new RequestKendaraan (omits system-generated ID)
 */
export const CreateRequestKendaraanSchema = RequestKendaraanSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestKendaraan
 */
export const UpdateRequestKendaraanSchema = RequestKendaraanSchema;

export type RequestKendaraanInput = z.infer<typeof RequestKendaraanSchema>;
export type CreateRequestKendaraanInput = z.infer<typeof CreateRequestKendaraanSchema>;
export type UpdateRequestKendaraanInput = z.infer<typeof UpdateRequestKendaraanSchema>;