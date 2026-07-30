import { z } from 'zod';
import {
  getTemplateVariableNumbers,
  templateButtonTypes,
  templateCategories,
  templateHeaderFormats,
  type TemplateFormValues,
} from './types';

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''));

function isValidUrl(value: string) {
  try {
    const url = new URL(value.replace(/\{\{\d+\}\}/g, 'sample'));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const variableSampleSchema = z.object({
  key: z.string().regex(/^\d+$/, 'Variable key must be a number'),
  value: z.string().trim().min(1, 'Add an example value'),
});

export const templateHeaderSchema = z
  .object({
    format: z.enum(templateHeaderFormats),
    text: optionalTrimmedString,
    mediaUrl: optionalTrimmedString,
  })
  .superRefine((header, ctx) => {
    if (header.format === 'TEXT') {
      if (!header.text?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['text'],
          message: 'Header text is required',
        });
      }

      if ((header.text?.length ?? 0) > 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_big,
          maximum: 60,
          origin: 'string',
          path: ['text'],
          inclusive: true,
          message: 'Header text must be 60 characters or less',
        });
      }
    }

    if (
      ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header.format) &&
      header.mediaUrl &&
      !isValidUrl(header.mediaUrl)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mediaUrl'],
        message: 'Use a valid http or https URL',
      });
    }
  });

export const templateButtonSchema = z
  .object({
    type: z.enum(templateButtonTypes),
    text: z
      .string()
      .trim()
      .min(1, 'Button label is required')
      .max(25, 'Button label must be 25 characters or less'),
    url: optionalTrimmedString,
    phoneNumber: optionalTrimmedString,
    copyCode: optionalTrimmedString,
  })
  .superRefine((button, ctx) => {
    if (button.type === 'URL') {
      if (!button.url?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['url'],
          message: 'URL is required',
        });
      } else if (!isValidUrl(button.url)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['url'],
          message: 'Use a valid http or https URL',
        });
      }
    }

    if (button.type === 'PHONE_NUMBER') {
      if (!button.phoneNumber?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phoneNumber'],
          message: 'Phone number is required',
        });
      } else if (!/^\+[1-9]\d{7,14}$/.test(button.phoneNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phoneNumber'],
          message: 'Use E.164 format, for example +966500000000',
        });
      }
    }

    if (button.type === 'COPY_CODE' && !button.copyCode?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['copyCode'],
        message: 'Copy code is required',
      });
    }
  });

export const templateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Template name is required')
      .max(512, 'Template name must be 512 characters or less')
      .regex(
        /^[a-z0-9_]+$/,
        'Use lowercase letters, numbers, and underscores only',
      ),
    category: z.enum(templateCategories),
    language: z
      .string()
      .trim()
      .min(2, 'Language is required')
      .max(10, 'Language code is too long')
      .regex(
        /^[a-z]{2,3}(_[A-Z0-9]{2,3})?$/,
        'Use a locale code such as en_US or ar',
      ),
    header: templateHeaderSchema,
    body: z
      .string()
      .trim()
      .min(1, 'Message body is required')
      .max(1024, 'Message body must be 1024 characters or less'),
    footer: z
      .string()
      .trim()
      .max(60, 'Footer must be 60 characters or less')
      .optional()
      .or(z.literal('')),
    variableSamples: z.array(variableSampleSchema),
    buttons: z
      .array(templateButtonSchema)
      .max(10, 'Templates can include at most 10 buttons'),
  })
  .superRefine((values, ctx) => {
    const variableNumbers = getTemplateVariableNumbers(values);
    const sampleMap = new Map(
      values.variableSamples.map((sample) => [sample.key, sample.value]),
    );

    variableNumbers.forEach((variableNumber, index) => {
      const expected = index + 1;
      if (variableNumber !== expected) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['body'],
          message: 'Variables must be sequential, starting with {{1}}',
        });
      }

      const sampleValue = sampleMap.get(String(variableNumber));
      if (!sampleValue?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['variableSamples'],
          message: `Add an example value for {{${variableNumber}}}`,
        });
      }
    });
  }) satisfies z.ZodType<TemplateFormValues>;
