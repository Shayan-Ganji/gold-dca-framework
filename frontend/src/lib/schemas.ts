import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "نام کاربری حداقل ۳ کاراکتر است")
  .max(32)
  .regex(/^[a-zA-Z0-9_.-]+$/, "فقط حروف انگلیسی، عدد و _ . - مجاز است");

export const entrySchema = z.object({
  id: z.string().nullable(),
  entry_at: z.string(),
  entry_type: z.string().max(24),
  notes: z.string().max(300),
  mazaneh: z.number(),
  gold_in: z.number(),
  gold_out: z.number(),
  fiat_debtor: z.number(),
  fiat_creditor: z.number(),
  is_short: z.boolean(),
  is_settled: z.boolean(),
});

export type LedgerEntryInput = z.infer<typeof entrySchema>;
