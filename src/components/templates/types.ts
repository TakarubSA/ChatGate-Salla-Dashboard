export const templateCategories = [
  'MARKETING',
  'UTILITY',
  'AUTHENTICATION',
] as const;

export const templateLanguages = [
  // 'en_US',
  'ar',
  // 'ar_SA',
  'en',
  // 'fr',
  // 'es',
] as const;

export const templateHeaderFormats = [
  'NONE',
  'TEXT',
  'IMAGE',
  'VIDEO',
  'DOCUMENT',
] as const;

export const templateButtonTypes = [
  'QUICK_REPLY',
  'URL',
  'PHONE_NUMBER',
  'COPY_CODE',
] as const;

export type TemplateCategory = (typeof templateCategories)[number];
export type TemplateLanguage = string;
export type TemplateHeaderFormat = (typeof templateHeaderFormats)[number];
export type TemplateButtonType = (typeof templateButtonTypes)[number];

export interface TemplateHeaderValues {
  format: TemplateHeaderFormat;
  text?: string;
  mediaUrl?: string;
}

export interface TemplateButtonValues {
  type: TemplateButtonType;
  text: string;
  url?: string;
  phoneNumber?: string;
  copyCode?: string;
}

export interface TemplateVariableSample {
  key: string;
  value: string;
}

export interface TemplateFormValues {
  name: string;
  category: TemplateCategory;
  language: TemplateLanguage;
  header: TemplateHeaderValues;
  body: string;
  footer?: string;
  variableSamples: TemplateVariableSample[];
  buttons: TemplateButtonValues[];
}

export type TemplateBuilderInitialValues = Partial<
  Omit<TemplateFormValues, 'header' | 'buttons' | 'variableSamples'>
> & {
  header?: Partial<TemplateHeaderValues>;
  buttons?: TemplateButtonValues[];
  variableSamples?: TemplateVariableSample[];
};

export interface TemplateBuilderSubmitResult {
  values: TemplateFormValues;
}

export const variableTokenPattern = /\{\{(\d+)\}\}/g;

export function extractTemplateVariableNumbers(value?: string): number[] {
  if (!value) return [];

  const variables = new Set<number>();
  for (const match of value.matchAll(variableTokenPattern)) {
    const variableNumber = Number(match[1]);
    if (Number.isInteger(variableNumber) && variableNumber > 0) {
      variables.add(variableNumber);
    }
  }

  return Array.from(variables).sort((a, b) => a - b);
}

export function getTemplateVariableNumbers(
  values: Pick<TemplateFormValues, 'header' | 'body' | 'buttons'>,
): number[] {
  const candidateText = [
    values.header.format === 'TEXT' ? values.header.text : '',
    values.body,
    ...values.buttons.map((button) => button.url ?? ''),
  ].join('\n');

  return extractTemplateVariableNumbers(candidateText);
}

export function getNextTemplateVariableNumber(usedVariables: number[]): number {
  const used = new Set(usedVariables);
  let next = 1;

  while (used.has(next)) {
    next += 1;
  }

  return next;
}

export function createTemplateVariableToken(variableNumber: number): string {
  return `{{${variableNumber}}}`;
}

export function createDefaultTemplateValues(
  initialValues: TemplateBuilderInitialValues = {},
): TemplateFormValues {
  return {
    name: initialValues.name ?? '',
    category: initialValues.category ?? 'UTILITY',
    language: initialValues.language ?? 'en_US',
    header: {
      format: initialValues.header?.format ?? 'NONE',
      text: initialValues.header?.text ?? '',
      mediaUrl: initialValues.header?.mediaUrl ?? '',
    },
    body: initialValues.body ?? '',
    footer: initialValues.footer ?? '',
    variableSamples: initialValues.variableSamples ?? [],
    buttons: initialValues.buttons ?? [],
  };
}
