import { z } from "zod";

export const phonebookEntrySchema = z.object({
  number: z
    .string()
    .regex(/^[\d+]+$/, "Number must be digits or + only")
    .min(5)
    .max(20),
  name: z.string().min(1).max(50),
  type: z
    .enum([
      "phone",
      "fax",
      "ivr",
      "number-readout",
      "music",
      "sip",
      "other",
      "modem",
      "mobile",
      "voicemail",
      "gateway",
      "conference",
      "emergency",
    ])
    .default("phone"),
  language: z
    .enum(["en", "zhs", "de", "fr", "ru", "multi", "other", "unknown"])
    .default("unknown"),
  hidden: z.boolean().default(false),
});

export type PhonebookEntryDTO = z.infer<typeof phonebookEntrySchema>;
