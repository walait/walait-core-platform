import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const OrganizationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3),
  slug: z.string().min(3),
  logo_url: z.string().url().optional(),
  domain: z.string().optional(),
});

export type OrganizationType = z.infer<typeof OrganizationSchema>;
export class OrganizationDTO extends createZodDto(OrganizationSchema) {}
