import { Copy, ExternalLink, MessageCircleReply, Phone, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { templateButtonTypes, type TemplateButtonType, type TemplateFormValues } from './types';

const buttonTypeLabels: Record<TemplateButtonType, string> = {
  QUICK_REPLY: 'Quick reply',
  URL: 'Website URL',
  PHONE_NUMBER: 'Phone number',
  COPY_CODE: 'Copy code',
};

const buttonTypeIcons: Record<TemplateButtonType, typeof MessageCircleReply> = {
  QUICK_REPLY: MessageCircleReply,
  URL: ExternalLink,
  PHONE_NUMBER: Phone,
  COPY_CODE: Copy,
};

export interface TemplateButtonsProps {
  className?: string;
  maxButtons?: number;
}

export function TemplateButtons({
  className,
  maxButtons = 10,
}: TemplateButtonsProps) {
  const form = useFormContext<TemplateFormValues>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'buttons',
  });

  const addButton = () => {
    append({
      type: 'QUICK_REPLY',
      text: '',
      url: '',
      phoneNumber: '',
      copyCode: '',
    });
  };

  const updateButtonType = (index: number, type: TemplateButtonType) => {
    form.setValue(`buttons.${index}.type`, type, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue(`buttons.${index}.url`, '', { shouldDirty: true });
    form.setValue(`buttons.${index}.phoneNumber`, '', { shouldDirty: true });
    form.setValue(`buttons.${index}.copyCode`, '', { shouldDirty: true });
  };

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">Buttons</h3>
          <p className="text-xs text-muted-foreground">
            {fields.length} of {maxButtons} configured
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addButton}
          disabled={fields.length >= maxButtons}
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          No buttons added
        </div>
      ) : (
        <div className="rounded-md border border-border">
          {fields.map((field, index) => {
            const selectedType = form.watch(
              `buttons.${index}.type`,
            ) as TemplateButtonType;
            const Icon = buttonTypeIcons[selectedType] ?? MessageCircleReply;

            return (
              <div key={field.id}>
                <div className="space-y-4 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="grid min-w-0 flex-1 gap-4 md:grid-cols-[220px_1fr]">
                      <FormField
                        control={form.control}
                        name={`buttons.${index}.type`}
                        render={({ field: typeField }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select
                              value={typeField.value}
                              onValueChange={(value) =>
                                updateButtonType(index, value as TemplateButtonType)
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {templateButtonTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {buttonTypeLabels[type]}
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
                        name={`buttons.${index}.text`}
                        render={({ field: textField }) => (
                          <FormItem>
                            <FormLabel>Label</FormLabel>
                            <FormControl>
                              <Input
                                {...textField}
                                maxLength={25}
                                placeholder="Button label"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      aria-label={`Remove button ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {selectedType === 'URL' && (
                    <FormField
                      control={form.control}
                      name={`buttons.${index}.url`}
                      render={({ field: urlField }) => (
                        <FormItem>
                          <FormLabel>URL</FormLabel>
                          <FormControl>
                            <Input
                              {...urlField}
                              inputMode="url"
                              placeholder="https://example.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {selectedType === 'PHONE_NUMBER' && (
                    <FormField
                      control={form.control}
                      name={`buttons.${index}.phoneNumber`}
                      render={({ field: phoneField }) => (
                        <FormItem>
                          <FormLabel>Phone number</FormLabel>
                          <FormControl>
                            <Input
                              {...phoneField}
                              inputMode="tel"
                              placeholder="+966500000000"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {selectedType === 'COPY_CODE' && (
                    <FormField
                      control={form.control}
                      name={`buttons.${index}.copyCode`}
                      render={({ field: copyCodeField }) => (
                        <FormItem>
                          <FormLabel>Code</FormLabel>
                          <FormControl>
                            <Input {...copyCodeField} placeholder="SAVE20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                {index < fields.length - 1 && <Separator />}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
