import { z } from 'zod';

export const BreveEmailTemplateSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    subject: z.string(),
    isActive: z.boolean(),
    sender: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
    tag: z.string(),
    htmlContent: z.string(),
  })
  .transform((data) => ({
    // Solo devolvés las claves que querés mantener
    external_id: data.id.toString(), // <- reemplaza id
    slug: data.name.toLowerCase(), // <- reemplaza name
    subject: data.subject,
    isActive: data.isActive,
    sender: data.sender,
    tag: data.tag,
    htmlContent: data.htmlContent,
  }));

export type BrevoEmailTemplate = z.infer<typeof BreveEmailTemplateSchema>;
