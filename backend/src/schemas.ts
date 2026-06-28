import { z } from "zod";

let validIso6393Codes: Set<string> | null = null;

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
      "echo-test",
    ])
    .default("phone"),
  language: z
    .string()
    .refine(
      async (val) => {
        if (!validIso6393Codes) {
          const mod = await import("iso-639-3");
          validIso6393Codes = new Set(
            mod.iso6393.map((lang: { iso6393: string }) => lang.iso6393),
          );
        }
        return validIso6393Codes.has(val);
      },
      {
        message: "Invalid ISO 639-3 language code",
      },
    )
    .default("und"),
  hidden: z.boolean().default(false),
  sms: z.boolean().default(false),
});

export type PhonebookEntryDTO = z.infer<typeof phonebookEntrySchema>;
