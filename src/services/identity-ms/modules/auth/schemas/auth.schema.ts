import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const SignUpSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirm_password: z.string().min(8),
    first_name: z.string().min(3).max(50),
    last_name: z.string().min(3).max(50).optional(),
    avatar_url: z.string().url().optional(),
    metadata: z.record(z.any()).optional().default({}),
    organization_id: z.string(),
    role: z.enum(['member', 'admin', 'owner', 'superadmin']).default('member'),
    is_global_admin: z.boolean().optional(),
    global_admin_key: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

export type SignInInput = z.infer<typeof SignInSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;

export const SignInDTO = createZodDto(SignInSchema);
export const SignUpDTO = createZodDto(SignUpSchema);
