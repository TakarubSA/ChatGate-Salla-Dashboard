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

// ---------------------------------------------------------
// Build WhatsApp template payload
// ---------------------------------------------------------

function buildTemplatePayload(
  values: TemplateFormValues,
  imageHeaderHandle?: string,
) {
  const sampleMap = new Map(
    values.variableSamples.map((sample) => [
      sample.key,
      sample.value,
    ]),
  );

  const components: Record<
    string,
    unknown
  >[] = [];

  // Header
  if (values.header.format !== 'NONE') {
    if (
      values.header.format === 'TEXT'
    ) {
      const headerVariables =
        Array.from(
          (
            values.header.text ?? ''
          ).matchAll(
            /\{\{(\d+)\}\}/g,
          ),
        ).map(
          (match) =>
            sampleMap.get(
              match[1],
            ) ?? '',
        );

      components.push({
        type: 'HEADER',
        format: 'TEXT',
        text: values.header.text,

        ...(headerVariables.length >
          0 && {
          example: {
            header_text:
              headerVariables,
          },
        }),
      });
    } else {
      components.push({
        type: 'HEADER',
        format: values.header.format,

        ...(values.header
          .mediaUrl && {
          example: {
            header_handle: [
              imageHeaderHandle ??
                values.header
                  .mediaUrl,
            ],
          },
        }),
      });
    }
  }

  // Body
  const bodyVariables =
    Array.from(
      values.body.matchAll(
        /\{\{(\d+)\}\}/g,
      ),
    ).map(
      (match) =>
        sampleMap.get(
          match[1],
        ) ?? '',
    );

  components.push({
    type: 'BODY',
    text: values.body,

    ...(bodyVariables.length >
      0 && {
      example: {
        body_text: [
          bodyVariables,
        ],
      },
    }),
  });

  // Footer
  if (values.footer?.trim()) {
    components.push({
      type: 'FOOTER',
      text: values.footer,
    });
  }

  // Buttons
  if (values.buttons.length > 0) {
    components.push({
      type: 'BUTTONS',

      buttons: values.buttons.map(
        (button) => {
          if (
            button.type ===
            'URL'
          ) {
            return {
              type: 'URL',
              text: button.text,
              url: button.url,
            };
          }

          if (
            button.type ===
            'PHONE_NUMBER'
          ) {
            return {
              type: 'PHONE_NUMBER',
              text: button.text,
              phone_number:
                button.phoneNumber,
            };
          }

          if (
            button.type ===
            'COPY_CODE'
          ) {
            return {
              type: 'COPY_CODE',
              text: button.text,
              example: [
                button.copyCode,
              ],
            };
          }

          return {
            type: 'QUICK_REPLY',
            text: button.text,
          };
        },
      ),
    });
  }

  return {
    name: values.name,
    category: values.category,
    language: values.language,
    components,
  };
}

// ---------------------------------------------------------
// Convert template into builder initial values
// ---------------------------------------------------------

function templateToInitialValues(
  tpl: {
    name: string;
    category: string;
    language: string;
    headerText?: string | null;
    headerImageUrl?: string | null;
    body: string;
    bodyParamsExample?:
      | string[]
      | null;
    buttons: Array<{
      type: string;
      text: string;
      url?: string;
      phone_number?: string;
      example?: string[];
    }>;
  },
): TemplateBuilderInitialValues {
  const variableSamples = (
    tpl.bodyParamsExample ?? []
  ).map(
    (value, index) => ({
      key: String(index + 1),
      value,
    }),
  );

  const buttons: TemplateButtonValues[] =
    tpl.buttons.map((btn) => ({
      type: btn.type as TemplateButtonValues['type'],
      text: btn.text,

      url:
        btn.type === 'URL'
          ? btn.url ?? ''
          : '',

      phoneNumber:
        btn.type ===
        'PHONE_NUMBER'
          ? btn.phone_number ??
            ''
          : '',

      copyCode:
        btn.type ===
        'COPY_CODE'
          ? btn.example?.[0] ??
            ''
          : '',
    }));

  return {
    name: `${tpl.name}_copy`,

    category:
      tpl.category as TemplateFormValues['category'],

    language: tpl.language,

    header: {
      format: tpl.headerImageUrl
        ? 'IMAGE'
        : tpl.headerText
          ? 'TEXT'
          : 'NONE',

      text:
        tpl.headerText ??
        '',

      mediaUrl:
        tpl.headerImageUrl ??
        '',
    },

    body: tpl.body,

    variableSamples,

    buttons,
  };
}

// =========================================================
// PAGE
// =========================================================

export default function TemplatesPage() {
  const { toast } = useToast();
  const { t ,language} = useLanguage();

  // IMPORTANT:
  // Normalize the templates translation section once.
  // This prevents "Cannot read properties of undefined".
  const templateT =
    t.templates

  const {
    templates,
    pageInfo,
    hasNextPage,
    hasPrevPage,
    isLoadingTemplates,
    loadTemplates,
    createTemplate,
    uploadTemplateMedia,
    deleteTemplate,
  } = useTemplates();

  const [search, setSearch] =
    useState('');

  const [
    selectedTemplateId,
    setSelectedTemplateId,
  ] = useState<string | null>(
    null,
  );

  const [
    isBuilderOpen,
    setIsBuilderOpen,
  ] = useState(false);

  const [
    isCreating,
    setIsCreating,
  ] = useState(false);

  const [
    builderInitialValues,
    setBuilderInitialValues,
  ] = useState<
    TemplateBuilderInitialValues | undefined
  >(undefined);

  const [
    templateToDelete,
    setTemplateToDelete,
  ] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  // ---------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------

  useEffect(() => {
    loadTemplates({
      limit: PAGE_SIZE,
      offset: 0,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------

  const goNext = () => {
    if (
      !hasNextPage ||
      !pageInfo ||
      isLoadingTemplates
    ) {
      return;
    }

    loadTemplates({
      limit: PAGE_SIZE,
      offset:
        pageInfo.offset +
        pageInfo.limit,
    });
  };

  const goPrev = () => {
    if (
      !hasPrevPage ||
      !pageInfo ||
      isLoadingTemplates
    ) {
      return;
    }

    const prevOffset =
      Math.max(
        pageInfo.offset -
          pageInfo.limit,
        0,
      );

    loadTemplates({
      limit: PAGE_SIZE,
      offset: prevOffset,
    });
  };

  // ---------------------------------------------------------
  // Search
  // ---------------------------------------------------------

  const filteredTemplates =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      if (!q) {
        return templates;
      }

      return templates.filter(
        (tpl) =>
          tpl.name
            ?.toLowerCase()
            .includes(q) ||
          tpl.category
            ?.toLowerCase()
            .includes(q) ||
          tpl.status
            ?.toLowerCase()
            .includes(q) ||
          tpl.language
            ?.toLowerCase()
            .includes(q),
      );
    }, [templates, search]);

  // ---------------------------------------------------------
  // Selected template
  // ---------------------------------------------------------

  const selectedTemplate =
    useMemo(
      () =>
        templates.find(
          (tpl) =>
            tpl.id ===
            selectedTemplateId,
        ),
      [
        templates,
        selectedTemplateId,
      ],
    );

  // ---------------------------------------------------------
  // Date formatting
  // ---------------------------------------------------------

  const formatCreatedAt = (
    createdAt?: string,
  ) => {
    if (!createdAt) {
      return '—';
    }

    const date =
      new Date(createdAt);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return '—';
    }

    return (
      <div className="flex flex-col">
        <span className="text-sm text-foreground">
          {date.toLocaleDateString()}
        </span>

        <span className="text-xs text-muted-foreground">
          {date.toLocaleTimeString(
            [],
            {
              hour: '2-digit',
              minute: '2-digit',
            },
          )}
        </span>
      </div>
    );
  };

  // ---------------------------------------------------------
  // Export
  // ---------------------------------------------------------

  const handleExport = () => {
    exportToExcel(
      templates.map((tpl) => ({
        [templateT.title ??
          'Name']:
          tpl.name,

        [templateT.category ??
          'Category']:
          tpl.category,

        [templateT.status ??
          'Status']:
          tpl.status,

        [templateT.language ??
          'Language']:
          tpl.language,

        [templateT.createdAt ??
          'Created At']:
          tpl.createdAt
            ? new Date(
                tpl.createdAt,
              ).toLocaleString()
            : '',

        [templateT.header ??
          'Header']:
          tpl.headerText ??
          (tpl.headerImageUrl
            ? templateT.image ??
              'Image'
            : ''),

        [templateT.body ??
          'Body']:
          tpl.body,

        [templateT.buttons ??
          'Buttons']:
          tpl.buttons.length,
      })),

      `message-templates-${new Date()
        .toISOString()
        .slice(0, 10)}`,

      templateT.title ??
        'Templates',
    );

    toast({
      title:
        templateT.exportSuccessTitle ??
        'Export ready',

      description:
        templateT.exportSuccessDescription ??
        'Templates were exported to Excel.',
    });
  };

  // ---------------------------------------------------------
  // New template
  // ---------------------------------------------------------

  const openNewTemplate = () => {
    setBuilderInitialValues(
      undefined,
    );

    setIsBuilderOpen(true);
  };

  // ---------------------------------------------------------
  // Duplicate
  // ---------------------------------------------------------

  const handleDuplicate = (
    tpl: (typeof templates)[number],
  ) => {
    setBuilderInitialValues(
      templateToInitialValues(
        tpl,
      ),
    );

    setIsBuilderOpen(true);
  };

  // ---------------------------------------------------------
  // Create
  // ---------------------------------------------------------

  const handleCreateTemplate =
    async (
      values: TemplateFormValues,
    ) => {
      setIsCreating(true);

      try {
        let imageHeaderHandle:
          | string
          | undefined;

        if (
          values.header.format ===
            'IMAGE' &&
          values.header.mediaUrl
        ) {
          imageHeaderHandle =
            await uploadTemplateMedia(
              values.header
                .mediaUrl,
            );
        }

        const payload =
          buildTemplatePayload(
            values,
            imageHeaderHandle,
          );

        console.log(
          'WhatsApp template payload:',
          JSON.stringify(
            payload,
            null,
            2,
          ),
        );

        await createTemplate(
          payload,
        );

        toast({
          title:
            templateT.createSuccessTitle ??
            'Template submitted',

          description:
            templateT.createSuccessDescription ??
            'Your template was submitted for approval.',
        });

        setIsBuilderOpen(false);

        setBuilderInitialValues(
          undefined,
        );

        await loadTemplates({
          limit: PAGE_SIZE,
          offset:
            pageInfo?.offset ??
            0,
        });
      } catch (error) {
        toast({
          title:
            templateT.createErrorTitle ??
            'Failed to create template',

          description:
            error instanceof Error
              ? error.message
              : templateT.createErrorDescription ??
                'Something went wrong.',

          variant:
            'destructive',
        });
      } finally {
        setIsCreating(false);
      }
    };

  // ---------------------------------------------------------
  // Delete
  // ---------------------------------------------------------

  const handleConfirmDelete =
    async () => {
      if (!templateToDelete) {
        return;
      }

      setIsDeleting(true);

      try {
        await deleteTemplate(
          templateToDelete.name,
        );

        toast({
          title:
            templateT.deleteSuccessTitle ??
            'Template deleted',

          description:
            templateT.deleteSuccessDescription ??
            'The template was removed.',
        });

        setTemplateToDelete(
          null,
        );

        if (
          selectedTemplateId ===
          templateToDelete.id
        ) {
          setSelectedTemplateId(
            null,
          );
        }

        await loadTemplates({
          limit: PAGE_SIZE,
          offset:
            pageInfo?.offset ??
            0,
        });
      } catch (error) {
        toast({
          title:
            templateT.deleteErrorTitle ??
            'Failed to delete template',

          description:
            error instanceof Error
              ? error.message
              : templateT.deleteErrorDescription ??
                'Something went wrong.',

          variant:
            'destructive',
        });
      } finally {
        setIsDeleting(false);
      }
    };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ================================================= */}
      {/* Header */}
      {/* ================================================= */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {templateT.title ??
              'Templates'}
          </h1>

          <p className="text-muted-foreground mt-1">
            {templateT.pageSubtitle ??
              'Manage your WhatsApp message templates.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />

            {templateT.exportPage ??
              'Export Templates'}
          </Button>

          <Button
            size="sm"
            onClick={
              openNewTemplate
            }
          >
            <Plus className="h-4 w-4 mr-2" />

            {templateT.newTemplate ??
              'Add new Template'}
          </Button>
        </div>
      </div>

      {/* ================================================= */}
      {/* Search */}
      {/* ================================================= */}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-end gap-4 justify-between">
          <div className="space-y-1 w-full sm:w-[280px]">
            <label className="text-sm font-medium text-muted-foreground">
              {templateT.search ??
                'Search'}
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <Input
                placeholder={
                  templateT.searchHint ??
                  'Name, category, status...'
                }
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value,
                  )
                }
                className="pl-9 w-full"
              />
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* Table */}
        {/* ================================================= */}

        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">

              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
                <tr>

                  <th className="px-6 py-3">
                 {templateT.name}
                  </th>

                  <th className="px-6 py-3">
                    {templateT.category ??
                      'Category'}
                  </th>

                  <th className="px-6 py-3">
                    {templateT.status ??
                      'Status'}
                  </th>

                  <th className="px-6 py-3">
                    {templateT.language ??
                      'Language'}
                  </th>

                  <th className="px-6 py-3">
                    {templateT.createdAt ??
                      'Created At'}
                  </th>

                  <th className="px-6 py-3">
                    {templateT.buttons ??
                      'Buttons'}
                  </th>

                  <th className="px-6 py-3 text-right">
                    {templateT.actions ??
                      'Actions'}
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-border">

                {/* Loading */}
                {isLoadingTemplates ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-muted-foreground"
                    >
                      <div className="flex items-center justify-center">

                        <RotateCcw className="h-5 w-5 animate-spin mr-2" />

                        {templateT.loading ??
                          'Loading templates...'}

                      </div>
                    </td>
                  </tr>
                ) : filteredTemplates.length ===
                  0 ? (

                  /* Empty */
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center"
                    >
                      <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />

                      <p className="text-muted-foreground font-medium">
                        {templateT.noTemplatesFound ??
                          'No templates found'}
                      </p>

                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {templateT.tryAdjustingSearch ??
                          'Try adjusting your search'}
                      </p>
                    </td>
                  </tr>

                ) : (

                  /* Rows */
                  filteredTemplates.map(
                    (tpl) => (
                      <tr
                        key={tpl.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() =>
                          setSelectedTemplateId(
                            tpl.id,
                          )
                        }
                      >

                        {/* Name */}
                        <td className="px-6 py-4 font-mono font-medium text-primary group-hover:underline">
                          {tpl.name}
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-muted">
                            <Tag className="h-3 w-3" />

                            {tpl.category}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-muted-foreground capitalize">
                          {tpl.status?.toLowerCase()}
                        </td>

                        {/* Language */}
                        <td className="px-6 py-4 text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5" />

                            {tpl.language}
                          </span>
                        </td>

                        {/* Created At */}
                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                          {formatCreatedAt(
                            tpl.createdAt,
                          )}
                        </td>

                        {/* Buttons */}
                        <td className="px-6 py-4 text-muted-foreground">
                          {tpl.buttons.length}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">

                            {/* Duplicate */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title={
                                templateT.duplicate ??
                                'Duplicate'
                              }
                              onClick={(e) => {
                                e.stopPropagation();

                                handleDuplicate(
                                  tpl,
                                );
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title={
                                templateT.delete ??
                                'Delete'
                              }
                              onClick={(e) => {
                                e.stopPropagation();

                                setTemplateToDelete(
                                  {
                                    id: tpl.id,
                                    name: tpl.name,
                                  },
                                );
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>

                          </div>
                        </td>

                      </tr>
                    ),
                  )
                )}

              </tbody>
            </table>
          </div>
        </div>

        {/* ================================================= */}
        {/* Pagination */}
        {/* ================================================= */}

        <div className="flex items-center justify-between text-sm text-muted-foreground">

          <div>
            {pageInfo
              ? (
                  templateT.showingTemplates ??
                  'Showing {{from}}–{{to}} of {{total}} templates'
                )
                  .replace(
                    '{{from}}',
                    String(
                      pageInfo.offset +
                        1,
                    ),
                  )
                  .replace(
                    '{{to}}',
                    String(
                      pageInfo.offset +
                        pageInfo.count,
                    ),
                  )
                  .replace(
                    '{{total}}',
                    String(
                      pageInfo.total,
                    ),
                  )
              : (
                  templateT.templatesCount ??
                  '{{count}} templates'
                ).replace(
                  '{{count}}',
                  String(
                    filteredTemplates.length,
                  ),
                )}
          </div>

          <div className="flex items-center gap-2">

            <Button
              variant="outline"
              size="sm"
              onClick={goPrev}
              disabled={
                isLoadingTemplates ||
                !hasPrevPage
              }
            >
              <ChevronLeft className="h-4 w-4 mr-1" />

              {templateT.previous ??
                'Previous'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={goNext}
              disabled={
                isLoadingTemplates ||
                !hasNextPage
              }
            >
              {templateT.next ??
                'Next'}

              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>

          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* Template Builder */}
      {/* ================================================= */}

      <TemplateBuilder
        open={isBuilderOpen}
        onOpenChange={(open) => {
          setIsBuilderOpen(open);

          if (!open) {
            setBuilderInitialValues(
              undefined,
            );
          }
        }}
        onSubmit={
          handleCreateTemplate
        }
        initialValues={
          builderInitialValues
        }
        isSubmitting={isCreating}
        title={
          builderInitialValues
            ? templateT.duplicateTemplate ??
              'Duplicate Template'
            : templateT.newTemplate ??
              'Add new Template'
        }
        description={
          templateT.newTemplateDescription ??
          'Create a WhatsApp template for approval.'
        }
        submitLabel={
          templateT.submitTemplate ??
          'Submit template'
        }
      />

      {/* ================================================= */}
      {/* Template Details */}
      {/* ================================================= */}

      <Dialog
        open={
          selectedTemplateId !==
          null
        }
        onOpenChange={(open) =>
          !open &&
          setSelectedTemplateId(
            null,
          )
        }
      >
        <DialogContent className="!w-auto !max-w-3xl">

          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>
                {selectedTemplate?.name ??
                  '...'}
              </span>
            </DialogTitle>
          </DialogHeader>

          {selectedTemplate ? (
            <div className="space-y-6 mt-4">

              {/* Metadata */}
              <div className="flex justify-between items-start p-4 bg-muted/30 rounded-lg border border-border">

                <div>
                  <p className="text-sm text-muted-foreground">
                    {templateT.category ??
                      'Category'}
                  </p>

                  <p className="font-semibold mt-1">
                    {
                      selectedTemplate.category
                    }
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {templateT.status ??
                      'Status'}
                  </p>

                  <p className="font-medium mt-1 capitalize">
                    {selectedTemplate.status?.toLowerCase()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {templateT.language ??
                      'Language'}
                  </p>

                  <p className="font-medium mt-1">
                    {
                      selectedTemplate.language
                    }
                  </p>
                </div>

              </div>

              {/* Created At */}
              <div>
                <p className="text-muted-foreground mb-1 text-sm">
                  {templateT.createdAt ??
                    'Created At'}
                </p>

                <p className="font-medium">
                  {formatCreatedAt(
                    selectedTemplate.createdAt,
                  )}
                </p>
              </div>

              {/* Header */}
              {selectedTemplate.headerText && (
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">
                    {templateT.header ??
                      'Header'}
                  </p>

                  <p className="font-medium">
                    {
                      selectedTemplate.headerText
                    }
                  </p>
                </div>
              )}

              {/* Header Image */}
              {selectedTemplate.headerImageUrl && (
                <div>
                  <p className="text-muted-foreground mb-2 text-sm flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />

                    {templateT.headerImage ??
                      'Header image'}
                  </p>

                  <img
                    src={
                      selectedTemplate.headerImageUrl
                    }
                    alt={
                      templateT.image ??
                      'Image'
                    }
                    className="rounded-lg border border-border max-h-48 object-cover"
                  />
                </div>
              )}

              {/* Body */}
              <div>
                <p className="text-muted-foreground mb-1 text-sm">
                  {templateT.body ??
                    'Body'}
                </p>

                <p className="text-sm whitespace-pre-wrap">
                  {
                    selectedTemplate.body
                  }
                </p>

                {selectedTemplate.bodyParamsExample &&
                  selectedTemplate.bodyParamsExample.length >
                    0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {templateT.exampleParams ??
                        'Example params'}
                      :{' '}
                      {selectedTemplate.bodyParamsExample.join(
                        ', ',
                      )}
                    </p>
                  )}
              </div>

              {/* Buttons */}
              {selectedTemplate.buttons
                .length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-2 text-sm">
                    {templateT.buttons ??
                      'Buttons'}
                  </p>

                  <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">

                    {selectedTemplate.buttons.map(
                      (btn, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3"
                        >
                          <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />

                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">
                              {btn.text}
                            </p>

                            <p className="text-xs text-muted-foreground truncate">
                              {btn.type ===
                              'URL'
                                ? btn.url
                                : btn.type ===
                                    'PHONE_NUMBER'
                                  ? btn.phone_number
                                  : btn.type ===
                                      'COPY_CODE'
                                    ? `${templateT.code ?? 'Code'}: ${
                                        btn.example?.[0] ??
                                        ''
                                      }`
                                    : btn.type}
                            </p>
                          </div>
                        </div>
                      ),
                    )}

                  </div>
                </div>
              )}

              {/* Footer */}
              <DialogFooter className="gap-2 sm:justify-between">

                <Button
                  variant="destructive"
                  onClick={() =>
                    setTemplateToDelete(
                      {
                        id: selectedTemplate.id,
                        name: selectedTemplate.name,
                      },
                    )
                  }
                >
                  <Trash2 className="h-4 w-4 mr-2" />

                  {templateT.delete ??
                    'Delete'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    handleDuplicate(
                      selectedTemplate,
                    );

                    setSelectedTemplateId(
                      null,
                    );
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />

                  {templateT.duplicate ??
                    'Duplicate'}
                </Button>

              </DialogFooter>

            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {templateT.failedToLoadDetails ??
                'Failed to load template details'}
            </div>
          )}

        </DialogContent>
      </Dialog>

      {/* ================================================= */}
      {/* Delete Confirmation */}
      {/* ================================================= */}

      <AlertDialog
        open={
          templateToDelete !==
          null
        }
        onOpenChange={(open) =>
          !open &&
          setTemplateToDelete(
            null,
          )
        }
      >
        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>
              {templateT.deleteConfirmTitle ??
                'Delete template'}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {(
                templateT.deleteConfirmDescription ??
                'This will permanently delete "{{name}}". This action cannot be undone.'
              ).replace(
                '{{name}}',
                templateToDelete?.name ??
                  '',
              )}
            </AlertDialogDescription>

          </AlertDialogHeader>

          <AlertDialogFooter>

            <AlertDialogCancel
              disabled={isDeleting}
            >
              {templateT.cancel ??
                'Cancel'}
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

              {templateT.delete ??
                'Delete'}
            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
