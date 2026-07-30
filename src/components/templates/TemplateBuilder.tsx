import { useEffect, useMemo } from 'react';
import { FileText, ImageIcon, Loader2, MessageSquare, Save } from 'lucide-react';
import { useForm, type FieldErrors, type Resolver } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { templateSchema } from './schema';
import { TemplateButtons } from './TemplateButtons';
import { TemplateEditor } from './TemplateEditor';
import { TemplatePreview } from './TemplatePreview';
import { VariablePicker } from './VariablePicker';
import {
  createDefaultTemplateValues,
  getTemplateVariableNumbers,
  templateCategories,
  templateHeaderFormats,
  templateLanguages,
  type TemplateBuilderInitialValues,
  type TemplateFormValues,
  type TemplateHeaderFormat,
} from './types';
import { useLanguage } from '@/hooks/use-language';

function addZodIssue(
  errors: FieldErrors<TemplateFormValues>,
  issue: { path: PropertyKey[]; code: string; message: string },
) {
  const path = issue.path.map(String);
  if (path.length === 0) return;
  let current = errors as Record<string, unknown>;
  path.slice(0, -1).forEach((segment) => {
    current[segment] ??= {};
    current = current[segment] as Record<string, unknown>;
  });
  const fieldName = path[path.length - 1];
  current[fieldName] ??= {
    type: issue.code,
    message: issue.message,
  };
}

const templateResolver: Resolver<TemplateFormValues> = async (values) => {
  const result = await templateSchema.safeParseAsync(values);
  if (result.success) {
    return {
      values: result.data,
      errors: {},
    };
  }
  const errors: FieldErrors<TemplateFormValues> = {};
  result.error.issues.forEach((issue) => addZodIssue(errors, issue));
  return {
    values: {},
    errors,
  };
};

const headerFormatIcons: Partial<Record<TemplateHeaderFormat, typeof ImageIcon>> = {
  IMAGE: ImageIcon,
  VIDEO: MessageSquare,
  DOCUMENT: FileText,
};

export interface TemplateBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TemplateFormValues) => void | Promise<void>;
  initialValues?: TemplateBuilderInitialValues;
  title?: string;
  description?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
}

export function TemplateBuilder({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  title,
  description,
  submitLabel,
  isSubmitting = false,
  className,
}: TemplateBuilderProps) {
  const { t } = useLanguage();

  const resolvedTitle = title ?? t.templates?.builderTitle ?? 'Template Builder';
  const resolvedDescription =
    description ??
    t.templates?.builderDescription ??
    'Configure your WhatsApp message template.';
  const resolvedSubmitLabel = submitLabel ?? t.templates?.saveTemplate ?? 'Save Template';

  const categoryLabels: Record<TemplateFormValues['category'], string> = {
    MARKETING: t.templates?.marketing ?? 'Marketing',
    UTILITY: t.templates?.utility ?? 'Utility',
    AUTHENTICATION: t.templates?.authentication ?? 'Authentication',
  };

  const headerFormatLabels: Record<TemplateHeaderFormat, string> = {
    NONE: t.templates?.none ?? 'None',
    TEXT: t.templates?.text ?? 'Text',
    IMAGE: t.templates?.image ?? 'Image',
    VIDEO: t.templates?.video ?? 'Video',
    DOCUMENT: t.templates?.document ?? 'Document',
  };

  const defaultValues = useMemo(
    () => createDefaultTemplateValues(initialValues),
    [initialValues],
  );

  const languageOptions = useMemo(
    () => Array.from(new Set([...templateLanguages, defaultValues.language])),
    [defaultValues.language],
  );

  const form = useForm<TemplateFormValues>({
    resolver: templateResolver,
    mode: 'onBlur',
    defaultValues,
  });

  const watchedValues = form.watch();
  const usedVariables = getTemplateVariableNumbers(watchedValues);
  const variableKey = usedVariables.join(',');
  const isBusy = form.formState.isSubmitting || isSubmitting;
  const variableSamplesError = form.formState.errors.variableSamples?.message;

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, open]);

  useEffect(() => {
    const currentSamples = form.getValues('variableSamples');
    const nextSamples = usedVariables.map((variableNumber) => {
      const key = String(variableNumber);
      return (
        currentSamples.find((sample) => sample.key === key) ?? {
          key,
          value: '',
        }
      );
    });

    const currentSignature = currentSamples
      .map((sample) => `${sample.key}:${sample.value}`)
      .join('|');
    const nextSignature = nextSamples
      .map((sample) => `${sample.key}:${sample.value}`)
      .join('|');

    if (currentSignature !== nextSignature) {
      form.setValue('variableSamples', nextSamples, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, variableKey]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  const insertHeaderVariable = (token: string) => {
    const currentValue = form.getValues('header.text') ?? '';
    const separator = currentValue && !currentValue.endsWith(' ') ? ' ' : '';
    form.setValue('header.text', `${currentValue}${separator}${token}`, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const selectedHeaderFormat = form.watch('header.format');
  const HeaderMediaIcon = headerFormatIcons[selectedHeaderFormat] ?? ImageIcon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          '!left-0 !top-0 h-dvh !max-h-dvh w-screen !max-w-none !translate-x-0 !translate-y-0 gap-0 overflow-hidden rounded-none border-0 p-0 sm:rounded-none',
          className,
        )}
      >
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
            <div className="border-b border-border px-5 py-4 pr-14">
              <DialogHeader>
                <DialogTitle>{resolvedTitle}</DialogTitle>
                <DialogDescription>{resolvedDescription}</DialogDescription>
              </DialogHeader>
            </div>
            <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_420px]">
              <ScrollArea className="min-h-0">
                <div className="space-y-8 p-5 lg:p-6">
                  <section className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold">
                        {t.templates?.templateDetails ?? 'Template Details'}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t.templates?.approvalMetadata ??
                          'This information is used for template approval.'}
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="md:col-span-1">
                            <FormLabel>{t.templates?.name ?? 'Name'}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                autoComplete="off"
                                placeholder="order_update"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.templates?.category ?? 'Category'}</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {templateCategories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {categoryLabels[category]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.templates?.language ?? 'Language'}</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {languageOptions.map((language) => (
                                  <SelectItem key={language} value={language}>
                                    {language}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </section>
                  <Separator />
                  <section className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold">
                        {t.templates?.header ?? 'Header'}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t.templates?.optionalOpeningContent ??
                          'Optional opening content for your message.'}
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="header.format"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.templates?.format ?? 'Format'}</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue('header.text', '', {
                                shouldDirty: true,
                              });
                              form.setValue('header.mediaUrl', '', {
                                shouldDirty: true,
                              });
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {templateHeaderFormats.map((format) => (
                                <SelectItem key={format} value={format}>
                                  {headerFormatLabels[format]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {selectedHeaderFormat === 'TEXT' && (
                      <FormField
                        control={form.control}
                        name="header.text"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t.templates?.headerText ?? 'Header text'}
                            </FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  {...field}
                                  maxLength={60}
                                  placeholder={
                                    t.templates?.headerTextPlaceholder ??
                                    'Your order is ready'
                                  }
                                />
                              </FormControl>
                              <VariablePicker
                                usedVariables={usedVariables}
                                onInsert={insertHeaderVariable}
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(
                      selectedHeaderFormat,
                    ) && (
                      <FormField
                        control={form.control}
                        name="header.mediaUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t.templates?.sampleMediaUrl ?? 'Sample media URL'}
                            </FormLabel>
                            <div className="flex gap-2">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                                <HeaderMediaIcon className="h-4 w-4" />
                              </div>
                              <FormControl>
                                <Input
                                  {...field}
                                  inputMode="url"
                                  placeholder={
                                    t.templates?.sampleMediaUrlPlaceholder ??
                                    'https://example.com/header.jpg'
                                  }
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </section>
                  <Separator />
                  <section className="space-y-4">
                    <FormField
                      control={form.control}
                      name="body"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.templates?.body ?? 'Body'}</FormLabel>
                          <FormControl>
                            <TemplateEditor
                              value={field.value}
                              onChange={field.onChange}
                              usedVariables={usedVariables}
                              disabled={isBusy}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="footer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.templates?.footer ?? 'Footer'}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              maxLength={60}
                              placeholder={
                                t.templates?.footerPlaceholder ??
                                'Reply STOP to opt out'
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </section>
                  {usedVariables.length > 0 && (
                    <>
                      <Separator />
                      <section className="space-y-4">
                        <div>
                          <h3 className="text-sm font-semibold">
                            {t.templates?.variableExamples ?? 'Variable Examples'}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {t.templates?.variableExamplesDescription ??
                              'Provide sample values for each variable used in your template.'}
                          </p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {usedVariables.map((variableNumber, index) => (
                            <FormField
                              key={variableNumber}
                              control={form.control}
                              name={`variableSamples.${index}.value`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{`{{${variableNumber}}}`}</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder={(
                                        t.templates?.variableExamplePlaceholder ??
                                        'Example {{number}}'
                                      ).replace(
                                        '{{number}}',
                                        String(variableNumber),
                                      )}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        {variableSamplesError && (
                          <p className="text-sm font-medium text-destructive">
                            {variableSamplesError}
                          </p>
                        )}
                      </section>
                    </>
                  )}
                  <Separator />
                  <TemplateButtons />
                  <div className="lg:hidden">
                    <Separator className="mb-6" />
                    <TemplatePreview value={watchedValues} />
                  </div>
                </div>
              </ScrollArea>
              <div className="hidden min-h-0 border-l border-border bg-muted/30 p-5 lg:block">
                <ScrollArea className="h-full">
                  <TemplatePreview value={watchedValues} />
                </ScrollArea>
              </div>
            </div>
            <DialogFooter className="border-t border-border px-5 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isBusy}
              >
                {t.templates?.cancel ?? 'Cancel'}
              </Button>
              <Button type="submit" disabled={isBusy}>
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {resolvedSubmitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}