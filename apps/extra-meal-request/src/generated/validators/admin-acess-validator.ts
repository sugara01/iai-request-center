import { z } from 'zod';

/**
 * Zod schema for AdminAcess validation
 */
export const AdminAcessSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  mealAdmin: z.string().optional(),
  vehicleAdmin: z.string().optional(),
});

/**
 * Schema for creating a new AdminAcess (omits system-generated ID)
 */
export const CreateAdminAcessSchema = AdminAcessSchema.omit({ id: true });

/**
 * Schema for updating an existing AdminAcess
 */
export const UpdateAdminAcessSchema = AdminAcessSchema;

export type AdminAcessInput = z.infer<typeof AdminAcessSchema>;
export type CreateAdminAcessInput = z.infer<typeof CreateAdminAcessSchema>;
export type UpdateAdminAcessInput = z.infer<typeof UpdateAdminAcessSchema>;