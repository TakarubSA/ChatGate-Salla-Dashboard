import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileSpreadsheet,
  RotateCcw,
  Search,
  MessageSquare,
  Tag,
  Globe,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  ImageIcon,
  Plus,
  Copy,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel } from '@/lib/export-excel';
import { useLanguage } from '@/hooks/use-language';
import { useTemplates } from '@/hooks/use-template';
import { TemplateBuilder } from '@/components/templates/TemplateBuilder';
import {
  TemplateFormValues,
  TemplateBuilderInitialValues,
  TemplateButtonValues,
} from '@/components/templates/types';

const PAGE_SIZE = 20;

// Converts the builder's form shape into a WhatsApp template creation payload.
// Adjust field names here if your backend expects something different.
function buildTemplatePayload(values: TemplateFormValues) {
  const sampleMap = new Map(
    values.variableSamples.map((sample) => [sample.key, sample.value]),
  );

  const components: Record<string, unknown>[] = [];

  if (values.header.format !== 'NONE') {
    if (values.header.format === 'TEXT') {
      const headerVariables = Array.from(
        (values.header.text ?? '').matchAll(/\{\{(\d+)\}\}/g),
      ).map((match) => sampleMap.get(match[1]) ?? '');

      components.push({
        type: 'HEADER',
        format: 'TEXT',
        text: values.header.text,
        ...(headerVariables.length > 0 && {
          example: { header_text: headerVariables },
        }),
      });
    } else {
      components.push({
        type: 'HEADER',
        format: values.header.format,
        ...(values.header.mediaUrl && {
          example: { header_handle: [values.header.mediaUrl] },
        }),
      });
    }
  }

  const bodyVariables = Array.from(
    values.body.matchAll(/\{\{(\d+)\}\}/g),
  ).map((match) => sampleMap.get(match[1]) ?? '');

  components.push({
    type: 'BODY',
    text: values.body,
    ...(bodyVariables.length > 0 && {
      example: { body_text: [bodyVariables] },
    }),
  });

  if (values.footer?.trim()) {
    components.push({
      type: 'FOOTER',
      text: values.footer,
    });
  }

  if (values.buttons.length > 0) {
    components.push({
      type: 'BUTTONS',
      buttons: values.buttons.map((button) => {
        if (button.type === 'URL') {
          return { type: 'URL', text: button.text, url: button.url };
        }
        if (button.type === 'PHONE_NUMBER') {
          return {
            type: 'PHONE_NUMBER',
            text: button.text,
            phone_number: button.phoneNumber,
          };
        }
        if (button.type === 'COPY_CODE') {
          return {
            type: 'COPY_CODE',
            text: button.text,
            example: [button.copyCode],
          };
        }
        return { type: 'QUICK_REPLY', text: button.text };
      }),
    });
  }

  return {
    name: values.name,
    category: values.category,
    language: values.language,
    components,
  };
}

// Reverse mapping: takes an existing template (as shown in the detail dialog)
// and produces TemplateBuilder initial values, for the "duplicate" flow.
// Adjust field access here if your template list item shape differs.
function templateToInitialValues(tpl: {
  name: string;
  category: string;
  language: string;
  headerText?: string | null;
  headerImageUrl?: string | null;
  body: string;
  bodyParamsExample?: string[] | null;
  buttons: Array<{
    type: string;
    text: string;
    url?: string;
    phone_number?: string;
    example?: string[];
  }>;
}): TemplateBuilderInitialValues {
  const variableSamples = (tpl.bodyParamsExample ?? []).map((value, index) => ({
    key: String(index + 1),
    value,
  }));

  const buttons: TemplateButtonValues[] = tpl.buttons.map((btn) => ({
    type: btn.type as TemplateButtonValues['type'],
    text: btn.text,
    url: btn.type === 'URL' ? btn.url ?? '' : '',
    phoneNumber: btn.type === 'PHONE_NUMBER' ? btn.phone_number ?? '' : '',
    copyCode: btn.type === 'COPY_CODE' ? btn.example?.[0] ?? '' : '',
  }));

  return {
    name: `${tpl.name}_copy`,
    category: tpl.category as TemplateFormValues['category'],
    language: tpl.language,
    header: {
      format: tpl.headerImageUrl ? 'IMAGE' : tpl.headerText ? 'TEXT' : 'NONE',
      text: tpl.headerText ?? '',
      mediaUrl: tpl.headerImageUrl ?? '',
    },
    body: tpl.body,
    variableSamples,
    buttons,
  };
}

export default function TemplatesPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const {
    templates,
    pageInfo,
    hasNextPage,
    hasPrevPage,
    isLoadingTemplates,
    loadTemplates,
    createTemplate,
    deleteTemplate,
  } = useTemplates();

  const [search, setSearch] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [builderInitialValues, setBuilderInitialValues] =
    useState<TemplateBuilderInitialValues | undefined>(undefined);
  const [templateToDelete, setTemplateToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadTemplates({ limit: PAGE_SIZE, offset: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goNext = () => {
    if (!hasNextPage || !pageInfo) return;
    loadTemplates({ limit: PAGE_SIZE, offset: pageInfo.offset + pageInfo.limit });
  };

  const goPrev = () => {
    if (!hasPrevPage || !pageInfo) return;
    const prevOffset = Math.max(pageInfo.offset - pageInfo.limit, 0);
    loadTemplates({ limit: PAGE_SIZE, offset: prevOffset });
  };

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (tpl) =>
        tpl.name?.toLowerCase().includes(q) ||
        tpl.category?.toLowerCase().includes(q) ||
        tpl.status?.toLowerCase().includes(q) ||
        tpl.language?.toLowerCase().includes(q)
    );
  }, [templates, search]);

  const selectedTemplate = useMemo(
    () => templates.find((tpl) => tpl.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  const handleExport = () => {
    exportToExcel(
      templates.map((tpl) => ({
        [t.templates?.name ?? 'Name']: tpl.name,
        [t.templates?.category ?? 'Category']: tpl.category,
        [t.templates?.status ?? 'Status']: tpl.status,
        [t.templates?.language ?? 'Language']: tpl.language,
        [t.templates?.header ?? 'Header']: tpl.headerText ?? (tpl.headerImageUrl ? '[Image]' : ''),
        [t.templates?.body ?? 'Body']: tpl.body,
        [t.templates?.buttons ?? 'Buttons']: tpl.buttons.length,
      })),
      `message-templates-${new Date().toISOString().slice(0, 10)}`,
      t.templates?.title ?? 'Templates'
    );
    toast({
      title: t.templates?.exportSuccessTitle ?? 'Export ready',
      description: t.templates?.exportSuccessDescription ?? 'Templates were exported to Excel.',
    });
  };

  const openNewTemplate = () => {
    setBuilderInitialValues(undefined);
    setIsBuilderOpen(true);
  };

  const handleDuplicate = (tpl: (typeof templates)[number]) => {
    setBuilderInitialValues(templateToInitialValues(tpl));
    setIsBuilderOpen(true);
  };

  const handleCreateTemplate = async (values: TemplateFormValues) => {
    setIsCreating(true);
    try {
      const payload = buildTemplatePayload(values);
      await createTemplate(payload);

      toast({
        title: t.templates?.createSuccessTitle ?? 'Template submitted',
        description:
          t.templates?.createSuccessDescription ??
          'Your template was submitted for approval.',
      });

      setIsBuilderOpen(false);
      setBuilderInitialValues(undefined);
      loadTemplates({ limit: PAGE_SIZE, offset: pageInfo?.offset ?? 0 });
    } catch (error) {
      toast({
        title: t.templates?.createErrorTitle ?? 'Failed to create template',
        description:
          error instanceof Error
            ? error.message
            : t.templates?.createErrorDescription ?? 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
     await deleteTemplate(templateToDelete.name);

      toast({
        title: t.templates?.deleteSuccessTitle ?? 'Template deleted',
        description:
          t.templates?.deleteSuccessDescription ??
          'The template was removed.',
      });

      setTemplateToDelete(null);
      if (selectedTemplateId === templateToDelete.id) {
        setSelectedTemplateId(null);
      }
      loadTemplates({ limit: PAGE_SIZE, offset: pageInfo?.offset ?? 0 });
    } catch (error) {
      toast({
        title: t.templates?.deleteErrorTitle ?? 'Failed to delete template',
        description:
          error instanceof Error
            ? error.message
            : t.templates?.deleteErrorDescription ?? 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t.templates?.title ?? 'Message Templates'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t.templates?.pageSubtitle ?? 'Browse your WhatsApp message templates'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {t.templates?.exportPage ?? 'Export'}
          </Button>
          <Button size="sm" onClick={openNewTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            {t.templates?.newTemplate ?? 'New Template'}
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-end gap-4 justify-between">
          <div className="space-y-1 w-full sm:w-[280px]">
            <label className="text-sm font-medium text-muted-foreground">
              {t.templates?.search ?? 'Search'}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.templates?.searchHint ?? 'Name, category, status...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>
        </div>
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
                <tr>
                  <th className="px-6 py-3">{t.templates?.name ?? 'Name'}</th>
                  <th className="px-6 py-3">{t.templates?.category ?? 'Category'}</th>
                  <th className="px-6 py-3">{t.templates?.status ?? 'Status'}</th>
                  <th className="px-6 py-3">{t.templates?.language ?? 'Language'}</th>
                  <th className="px-6 py-3">{t.templates?.buttons ?? 'Buttons'}</th>
                  <th className="px-6 py-3 text-right">
                    {t.templates?.actions ?? 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingTemplates ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center">
                        <RotateCcw className="h-5 w-5 animate-spin mr-2" />
                        {t.templates?.loading ?? 'Loading templates...'}
                      </div>
                    </td>
                  </tr>
                ) : filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">
                        {t.templates?.noTemplatesFound ?? 'No templates found'}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {t.templates?.tryAdjustingSearch ?? 'Try adjusting your search'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTemplates.map((tpl) => (
                    <tr
                      key={tpl.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setSelectedTemplateId(tpl.id)}
                    >
                      <td className="px-6 py-4 font-mono font-medium text-primary group-hover:underline">
                        {tpl.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-muted">
                          <Tag className="h-3 w-3" />
                          {tpl.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground capitalize">
                        {tpl.status?.toLowerCase()}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5" />
                          {tpl.language}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {tpl.buttons.length}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={t.templates?.duplicate ?? 'Duplicate'}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(tpl);
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title={t.templates?.delete ?? 'Delete'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setTemplateToDelete({ id: tpl.id, name: tpl.name });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {pageInfo
              ? (t.templates?.showingTemplates ?? 'Showing {{from}}–{{to}} of {{total}} templates')
                  .replace('{{from}}', String(pageInfo.offset + 1))
                  .replace('{{to}}', String(pageInfo.offset + pageInfo.count))
                  .replace('{{total}}', String(pageInfo.total))
              : (t.templates?.templatesCount ?? '{{count}} templates').replace(
                  '{{count}}',
                  String(filteredTemplates.length)
                )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goPrev}
              disabled={isLoadingTemplates || !hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t.templates?.previous ?? 'Previous'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goNext}
              disabled={isLoadingTemplates || !hasNextPage}
            >
              {t.templates?.next ?? 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      <TemplateBuilder
        open={isBuilderOpen}
        onOpenChange={(open) => {
          setIsBuilderOpen(open);
          if (!open) setBuilderInitialValues(undefined);
        }}
        onSubmit={handleCreateTemplate}
        initialValues={builderInitialValues}
        isSubmitting={isCreating}
        title={
          builderInitialValues
            ? t.templates?.duplicateTemplate ?? 'Duplicate Template'
            : t.templates?.newTemplate ?? 'New Template'
        }
        description={
          t.templates?.newTemplateDescription ??
          'Create a WhatsApp template for approval.'
        }
        submitLabel={t.templates?.submitTemplate ?? 'Submit template'}
      />

      <Dialog
        open={selectedTemplateId !== null}
        onOpenChange={(open) => !open && setSelectedTemplateId(null)}
      >
        <DialogContent className="!w-auto !max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedTemplate?.name || '...'}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedTemplate ? (
            <div className="space-y-6 mt-4">
              <div className="flex justify-between items-start p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t.templates?.category ?? 'Category'}
                  </p>
                  <p className="font-semibold mt-1">{selectedTemplate.category}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {t.templates?.status ?? 'Status'}
                  </p>
                  <p className="font-medium mt-1 capitalize">
                    {selectedTemplate.status?.toLowerCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {t.templates?.language ?? 'Language'}
                  </p>
                  <p className="font-medium mt-1">{selectedTemplate.language}</p>
                </div>
              </div>
              {selectedTemplate.headerText && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    {t.templates?.header ?? 'Header'}
                  </p>
                  <p className="font-medium">{selectedTemplate.headerText}</p>
                </div>
              )}
              {selectedTemplate.headerImageUrl && (
                <div>
                  <p className="text-muted-foreground mb-2 text-sm flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />
                    {t.templates?.headerImage ?? 'Header image'}
                  </p>
                  <img
                    src={selectedTemplate.headerImageUrl}
                    className="rounded-lg border border-border max-h-48 object-cover"
                  />
                </div>
              )}
              <div>
                <p className="text-muted-foreground mb-1 text-sm">
                  {t.templates?.body ?? 'Body'}
                </p>
                <p className="text-sm whitespace-pre-wrap">{selectedTemplate.body}</p>
                {selectedTemplate.bodyParamsExample &&
                  selectedTemplate.bodyParamsExample.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {t.templates?.exampleParams ?? 'Example params'}:{' '}
                      {selectedTemplate.bodyParamsExample.join(', ')}
                    </p>
                  )}
              </div>
              {selectedTemplate.buttons.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-2 text-sm">
                    {(t.templates?.buttons).replace(
                      '{{count}}',
                      String(selectedTemplate.buttons.length)
                    )}
                  </p>
                  <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                    {selectedTemplate.buttons.map((btn, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3">
                        <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{btn.text}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {btn.type === 'URL'
                              ? btn.url
                              : btn.type === 'PHONE_NUMBER'
                              ? btn.phone_number
                              : btn.type === 'COPY_CODE'
                              ? `${t.templates?.code ?? 'Code'}: ${btn.example?.[0] ?? ''}`
                              : btn.type}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2 sm:justify-between">
                <Button
                  variant="destructive"
                  onClick={() =>
                    setTemplateToDelete({
                      id: selectedTemplate.id,
                      name: selectedTemplate.name,
                    })
                  }
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t.templates?.delete ?? 'Delete'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleDuplicate(selectedTemplate);
                    setSelectedTemplateId(null);
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {t.templates?.duplicate ?? 'Duplicate'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {t.templates?.failedToLoadDetails ?? 'Failed to load template details'}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={templateToDelete !== null}
        onOpenChange={(open) => !open && setTemplateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.templates?.deleteConfirmTitle ?? 'Delete template'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(
                t.templates?.deleteConfirmDescription ??
                'This will permanently delete "{{name}}". This action cannot be undone.'
              ).replace('{{name}}', templateToDelete?.name ?? '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t.templates?.cancel ?? 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {t.templates?.delete ?? 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}