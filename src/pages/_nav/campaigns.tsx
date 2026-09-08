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

import { BroadcastBuilder } from '@/components/broadcasts/BroadcastBuilder';

import {
  FileSpreadsheet,
  Search,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Copy,
  Trash2,
  Loader2,
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { exportToExcel } from '@/lib/export-excel';
import { useLanguage } from '@/hooks/use-language';
import { useCampaigns } from '@/hooks/use-campaigns';
import { useTemplates } from '@/hooks/use-template';
import { useMarketing } from '@/hooks/use-marketing';
import { useContacts } from '@/hooks/use-contacts';

import {
  Campaign,
  CampaignStatus,
} from '@/types/campaigns.types';

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<
  CampaignStatus,
  string
> = {
  DRAFT:
    'bg-muted text-muted-foreground',
  SCHEDULED:
    'bg-blue-500/10 text-blue-600',
  ACTIVE:
    'bg-amber-500/10 text-amber-600',
  COMPLETED:
    'bg-green-500/10 text-green-600',
  PAUSED:
    'bg-muted text-muted-foreground',
  CANCELLED:
    'bg-red-500/10 text-red-600',
};

function formatDate(
  value: string | number | null | undefined,
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  const date =
    typeof value === 'number'
      ? new Date(value)
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return (
    <div className="flex flex-col">
      <span className="text-sm text-foreground">
        {date.toLocaleDateString()}
      </span>

      <span className="text-xs text-muted-foreground">
        {date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
}

function formatStatus(
  status: CampaignStatus,
) {
  return status
    .toLowerCase()
    .replace('_', ' ');
}

function getDeliveryRate(
  campaign: Campaign,
) {
  if (!campaign.totalRecipients) {
    return 0;
  }

  return Math.round(
    (campaign.delivered /
      campaign.totalRecipients) *
      100,
  );
}

function getReadRate(
  campaign: Campaign,
) {
  if (!campaign.delivered) {
    return 0;
  }

  return Math.round(
    (campaign.read /
      campaign.delivered) *
      100,
  );
}

export default function CampaignsPage() {
  const { toast } = useToast();
  const { t } = useLanguage();

  const campaignT =
    t.campaigns ?? {};

  const {
    campaigns,
    pageInfo,
    hasNextPage,
    hasPrevPage,
    isLoadingCampaigns,
    loadCampaigns,
    deleteCampaign,
  } = useCampaigns();

  const {
    templates,
    isLoadingTemplates,
    loadTemplates,
  } = useTemplates();

  const {
    createBroadcast,
    handleTestMarketingMessage,
    scheduleBroadcast,
    isTesting,
    isSubmitting,
  } = useMarketing();

  const { getContacts } =
    useContacts();

  const [search, setSearch] =
    useState('');

  const [
    selectedCampaignId,
    setSelectedCampaignId,
  ] = useState<
    string | number | null
  >(null);

  const [
    campaignToDelete,
    setCampaignToDelete,
  ] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [
    broadcastTemplate,
    setBroadcastTemplate,
  ] = useState<
    (typeof templates)[number] | null
  >(null);

  const [
    isBroadcastOpen,
    setIsBroadcastOpen,
  ] = useState(false);

  useEffect(() => {
    loadCampaigns({
      limit: PAGE_SIZE,
      offset: 0,
    });
  }, [loadCampaigns]);

  useEffect(() => {
    loadTemplates({
      limit: 100,
      offset: 0,
    });
  }, [loadTemplates]);

  const filteredCampaigns =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return campaigns;
      }

      return campaigns.filter(
        (campaign) =>
          campaign.name
            ?.toLowerCase()
            .includes(query) ||
          campaign.templateName
            ?.toLowerCase()
            .includes(query) ||
          campaign.status
            ?.toLowerCase()
            .includes(query),
      );
    }, [campaigns, search]);

  const selectedCampaign =
    useMemo(
      () =>
        campaigns.find(
          (campaign) =>
            campaign.id ===
            selectedCampaignId,
        ),
      [
        campaigns,
        selectedCampaignId,
      ],
    );

  const handleExport = () => {
    if (!campaigns.length) {
      return;
    }

    exportToExcel(
      campaigns.map((campaign) => ({
        [campaignT.name ??
          'Name']:
          campaign.name,

        [campaignT.template ??
          'Template']:
          campaign.templateName,

        [campaignT.status ??
          'Status']:
          campaign.status,

        [campaignT.recipients ??
          'Recipients']:
          campaign.totalRecipients,

        [campaignT.sent ??
          'Sent']:
          campaign.sent,

        [campaignT.delivered ??
          'Delivered']:
          campaign.delivered,

        [campaignT.read ??
          'Read']:
          campaign.read,

        [campaignT.failed ??
          'Failed']:
          campaign.failed,

        [campaignT.createdAt ??
          'Created At']:
          campaign.createdAt
            ? new Date(
                campaign.createdAt,
              ).toLocaleString()
            : '',
      })),
      `campaigns-${new Date()
        .toISOString()
        .slice(0, 10)}`,
      campaignT.title ??
        'Campaigns',
    );

    toast({
      title:
        campaignT.exportSuccessTitle ??
        'Export ready',

      description:
        campaignT.exportSuccessDescription ??
        'Campaigns were exported successfully.',
    });
  };

  const goNext = () => {
    if (
      !pageInfo ||
      !hasNextPage ||
      isLoadingCampaigns
    ) {
      return;
    }

    loadCampaigns({
      limit: PAGE_SIZE,
      offset:
        pageInfo.offset +
        pageInfo.limit,
    });
  };

  const goPrev = () => {
    if (
      !pageInfo ||
      !hasPrevPage ||
      isLoadingCampaigns
    ) {
      return;
    }

    loadCampaigns({
      limit: PAGE_SIZE,
      offset: Math.max(
        pageInfo.offset -
          pageInfo.limit,
        0,
      ),
    });
  };

  const openBroadcast = (
    template: (typeof templates)[number],
  ) => {
    setBroadcastTemplate(
      template,
    );

    setIsBroadcastOpen(true);
  };

  const handleTest = async ({
    phone,
    variables,
  }: {
    phone: string;
    variables: string[];
  }) => {
    if (!broadcastTemplate) {
      return;
    }

    const components: any[] = [];

    if (
      broadcastTemplate.headerImageUrl
    ) {
      components.push({
        type: 'header',
        parameters: [
          {
            type: 'image',
            image: {
              link:
                broadcastTemplate.headerImageUrl,
            },
          },
        ],
      });
    }

    if (variables.length > 0) {
      components.push({
        type: 'body',
        parameters:
          variables.map(
            (value) => ({
              type: 'text',
              text: value,
            }),
          ),
      });
    }

    await handleTestMarketingMessage({
      phone,
      templateName:
        broadcastTemplate.name,
      language:
        broadcastTemplate.language,
      components,
    });
  };

  const handleSubmit = async ({
    contactListIds,
    variables,
    schedule,
    scheduledAt,
  }: {
    contactListIds: string[];
    variables: string[];
    schedule: boolean;
    scheduledAt?: string;
  }) => {
    if (!broadcastTemplate) {
      return;
    }

    if (!contactListIds.length) {
      toast({
        title:
          'No contact lists selected',
        description:
          'Please select at least one contact list.',
        variant: 'destructive',
      });

      return;
    }

    try {
      const recipients: string[] =
        [];

      for (const listId of contactListIds) {
        const firstPage =
          await getContacts(
            listId,
            1,
            100,
          );

        recipients.push(
          ...firstPage.contacts,
        );

        const totalPages =
          firstPage.totalPages ?? 1;

        for (
          let page = 2;
          page <= totalPages;
          page++
        ) {
          const result =
            await getContacts(
              listId,
              page,
              100,
            );

          recipients.push(
            ...result.contacts,
          );
        }
      }

      const uniqueRecipients =
        Array.from(
          new Set(
            recipients
              .map((phone) =>
                phone?.trim(),
              )
              .filter(Boolean),
          ),
        );

      if (!uniqueRecipients.length) {
        toast({
          title:
            'No contacts found',
          description:
            'The selected contact lists do not contain any valid phone numbers.',
          variant: 'destructive',
        });

        return;
      }

      const components: any[] =
        [];

      if (
        broadcastTemplate.headerImageUrl
      ) {
        components.push({
          type: 'header',
          parameters: [
            {
              type: 'image',
              image: {
                link:
                  broadcastTemplate.headerImageUrl,
              },
            },
          ],
        });
      }

      if (variables.length > 0) {
        components.push({
          type: 'body',
          parameters:
            variables.map(
              (value) => ({
                type: 'text',
                text: value,
              }),
            ),
        });
      }

      if (schedule) {
        if (!scheduledAt) {
          throw new Error(
            'Scheduled date and time are required.',
          );
        }

        await scheduleBroadcast({
          recipients:
            uniqueRecipients,
          templateName:
            broadcastTemplate.name,
          language:
            broadcastTemplate.language,
          components,
          scheduledAt,
        });
      } else {
        await createBroadcast({
          recipients:
            uniqueRecipients,
          templateName:
            broadcastTemplate.name,
          language:
            broadcastTemplate.language,
          components,
        });
      }

      toast({
        title: schedule
          ? 'Campaign scheduled'
          : 'Campaign sent',

        description: schedule
          ? `Campaign scheduled for ${scheduledAt}.`
          : `Campaign sent to ${uniqueRecipients.length} contacts.`,
      });

      setIsBroadcastOpen(false);
      setBroadcastTemplate(null);

      await loadCampaigns({
        limit: PAGE_SIZE,
        offset: 0,
      });
    } catch (error) {
      toast({
        title: schedule
          ? 'Failed to schedule campaign'
          : 'Failed to send campaign',

        description:
          error instanceof Error
            ? error.message
            : 'Something went wrong.',

        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = (
    campaign: Campaign,
  ) => {
    const template =
      templates.find(
        (item) =>
          item.name ===
          campaign.templateName,
      );

    if (!template) {
      toast({
        title:
          'Template not found',
        description:
          'The template used by this campaign is no longer available.',
        variant: 'destructive',
      });

      return;
    }

    openBroadcast(template);
  };

  const handleConfirmDelete =
    async () => {
      if (!campaignToDelete) {
        return;
      }

      setIsDeleting(true);

      try {
        await deleteCampaign(
          campaignToDelete.id,
        );

        toast({
          title:
            'Campaign deleted',

          description:
            'The campaign was removed successfully.',
        });

        setCampaignToDelete(
          null,
        );

        if (
          selectedCampaignId ===
          campaignToDelete.id
        ) {
          setSelectedCampaignId(
            null,
          );
        }

        await loadCampaigns({
          limit: PAGE_SIZE,
          offset:
            pageInfo?.offset ??
            0,
        });
      } catch (error) {
        toast({
          title:
            'Failed to delete campaign',

          description:
            error instanceof Error
              ? error.message
              : 'Something went wrong.',

          variant: 'destructive',
        });
      } finally {
        setIsDeleting(false);
      }
    };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {campaignT.title ??
              'Campaigns'}
          </h1>

          <p className="text-muted-foreground mt-1">
            {campaignT.pageSubtitle ??
              'Manage your WhatsApp campaigns.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={
              campaigns.length ===
              0
            }
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />

            {campaignT.exportPage ??
              'Export'}
          </Button>

          <Button
            size="sm"
            onClick={() =>
              setIsBroadcastOpen(
                false,
              ) ||
              setBroadcastTemplate(
                null,
              )
            }
          >
            {campaignT.newCampaign ??
              'New Campaign'}
          </Button>
        </div>
      </div>

      {/* Search */}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-end gap-4 justify-between">
          <div className="space-y-1 w-full sm:w-[320px]">
            <label className="text-sm font-medium text-muted-foreground">
              {campaignT.search ??
                'Search'}
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <Input
                placeholder={
                  campaignT.searchHint ??
                  'Name, template, status...'
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

        {/* Table */}

        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">

              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
                <tr>

                  <th className="px-6 py-3">
                    {campaignT.name ??
                      'Name'}
                  </th>

                  <th className="px-6 py-3">
                    {campaignT.template ??
                      'Template'}
                  </th>

                  <th className="px-6 py-3">
                    {campaignT.status ??
                      'Status'}
                  </th>

                  <th className="px-6 py-3">
                    {campaignT.recipients ??
                      'Recipients'}
                  </th>

                  <th className="px-6 py-3">
                    {campaignT.sent ??
                      'Sent'}
                  </th>

                  <th className="px-6 py-3">
                    {campaignT.delivered ??
                      'Delivered'}
                  </th>

                  <th className="px-6 py-3">
                    {campaignT.read ??
                      'Read'}
                  </th>

                  <th className="px-6 py-3">
                    {campaignT.failed ??
                      'Failed'}
                  </th>

                  <th className="px-6 py-3">
                    {campaignT.createdAt ??
                      'Created At'}
                  </th>

                  <th className="px-6 py-3 text-right">
                    {campaignT.actions ??
                      'Actions'}
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-border">

                {isLoadingCampaigns ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-10 text-center text-muted-foreground"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />

                        {campaignT.loading ??
                          'Loading campaigns...'}
                      </div>
                    </td>
                  </tr>
                ) : filteredCampaigns.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-12 text-center"
                    >
                      <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />

                      <p className="text-muted-foreground font-medium">
                        {campaignT.noCampaignsFound ??
                          'No campaigns found'}
                      </p>

                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {campaignT.tryAdjustingSearch ??
                          'Try adjusting your search'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map(
                    (campaign) => (
                      <tr
                        key={
                          campaign.id
                        }
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() =>
                          setSelectedCampaignId(
                            campaign.id,
                          )
                        }
                      >

                        {/* Name */}

                        <td className="px-6 py-4 font-medium whitespace-nowrap max-w-[220px]">
                          <span className="truncate block group-hover:text-primary">
                            {
                              campaign.name
                            }
                          </span>
                        </td>

                        {/* Template */}

                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap max-w-[220px]">
                          <span className="truncate block">
                            {
                              campaign.templateName
                            }
                          </span>
                        </td>

                        {/* Status */}

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[campaign.status]}`}
                          >
                            {formatStatus(
                              campaign.status,
                            )}
                          </span>
                        </td>

                        {/* Recipients */}

                        <td className="px-6 py-4 text-muted-foreground">
                          {campaign.totalRecipients.toLocaleString()}
                        </td>

                        {/* Sent */}

                        <td className="px-6 py-4 text-muted-foreground">
                          {campaign.sent.toLocaleString()}
                        </td>

                        {/* Delivered */}

                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                          {
                            campaign.delivered
                          }

                          <span className="text-xs ml-1">
                            (
                            {
                              getDeliveryRate(
                                campaign,
                              )
                            }
                            %)
                          </span>
                        </td>

                        {/* Read */}

                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                          {
                            campaign.read
                          }

                          <span className="text-xs ml-1">
                            (
                            {
                              getReadRate(
                                campaign,
                              )
                            }
                            %)
                          </span>
                        </td>

                        {/* Failed */}

                        <td className="px-6 py-4 text-muted-foreground">
                          {
                            campaign.failed
                          }
                        </td>

                        {/* Created */}

                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                          {formatDate(
                            campaign.createdAt,
                          )}
                        </td>

                        {/* Actions */}

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title={
                                campaignT.duplicate ??
                                'Duplicate'
                              }
                              onClick={(
                                event,
                              ) => {
                                event.stopPropagation();

                                handleDuplicate(
                                  campaign,
                                );
                              }}
                              disabled={
                                isLoadingTemplates
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title={
                                campaignT.delete ??
                                'Delete'
                              }
                              onClick={(
                                event,
                              ) => {
                                event.stopPropagation();

                                setCampaignToDelete(
                                  {
                                    id: String(
                                      campaign.id,
                                    ),
                                    name:
                                      campaign.name,
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

        {/* Pagination */}

        <div className="flex items-center justify-between text-sm text-muted-foreground">

          <div>
            {pageInfo
              ? (
                  campaignT.showingCampaigns ??
                  'Showing {{from}}–{{to}} of {{total}} campaigns'
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
              : ''}
          </div>

          <div className="flex items-center gap-2">

            <Button
              variant="outline"
              size="sm"
              onClick={goPrev}
              disabled={
                isLoadingCampaigns ||
                !hasPrevPage
              }
            >
              <ChevronLeft className="h-4 w-4 mr-1" />

              {campaignT.previous ??
                'Previous'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={goNext}
              disabled={
                isLoadingCampaigns ||
                !hasNextPage
              }
            >
              {campaignT.next ??
                'Next'}

              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>

          </div>
        </div>
      </div>

      {/* Broadcast Builder */}

      <BroadcastBuilder
        open={isBroadcastOpen}
        onOpenChange={(open) => {
          setIsBroadcastOpen(
            open,
          );

          if (!open) {
            setBroadcastTemplate(
              null,
            );
          }
        }}
        template={
          broadcastTemplate
        }
        onTest={handleTest}
        onSubmit={handleSubmit}
        isTesting={isTesting}
        isSubmitting={
          isSubmitting
        }
      />

      {/* Campaign Details */}

      <Dialog
        open={
          selectedCampaignId !==
          null
        }
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCampaignId(
              null,
            );
          }
        }}
      >
        <DialogContent className="!w-auto !max-w-3xl">

          <DialogHeader>
            <DialogTitle>
              {selectedCampaign?.name ??
                'Campaign'}
            </DialogTitle>
          </DialogHeader>

          {selectedCampaign && (
            <div className="space-y-6 mt-4">

              <div className="flex justify-between items-start p-4 bg-muted/30 rounded-lg border border-border">

                <div>
                  <p className="text-sm text-muted-foreground">
                    {campaignT.template ??
                      'Template'}
                  </p>

                  <p className="font-medium mt-1 font-mono text-sm">
                    {
                      selectedCampaign.templateName
                    }
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {campaignT.status ??
                      'Status'}
                  </p>

                  <p className="font-medium mt-1 capitalize">
                    {formatStatus(
                      selectedCampaign.status,
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {campaignT.language ??
                      'Language'}
                  </p>

                  <p className="font-medium mt-1">
                    {
                      selectedCampaign.language
                    }
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground">
                    {campaignT.recipients ??
                      'Recipients'}
                  </p>

                  <p className="text-xl font-semibold mt-1">
                    {
                      selectedCampaign.totalRecipients
                    }
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground">
                    {campaignT.sent ??
                      'Sent'}
                  </p>

                  <p className="text-xl font-semibold mt-1">
                    {
                      selectedCampaign.sent
                    }
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground">
                    {campaignT.delivered ??
                      'Delivered'}
                  </p>

                  <p className="text-xl font-semibold mt-1">
                    {
                      selectedCampaign.delivered
                    }
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs text-muted-foreground">
                    {campaignT.read ??
                      'Read'}
                  </p>

                  <p className="text-xl font-semibold mt-1">
                    {
                      selectedCampaign.read
                    }
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {campaignT.failed ??
                      'Failed'}
                  </p>

                  <p className="font-medium">
                    {
                      selectedCampaign.failed
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {campaignT.pending ??
                      'Pending'}
                  </p>

                  <p className="font-medium">
                    {
                      selectedCampaign.pending
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {campaignT.messageCount ??
                      'Messages'}
                  </p>

                  <p className="font-medium">
                    {
                      selectedCampaign.messageCount
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {campaignT.createdAt ??
                      'Created At'}
                  </p>

                  <div className="font-medium">
                    {formatDate(
                      selectedCampaign.createdAt,
                    )}
                  </div>
                </div>

              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {campaignT.deliveryRate ??
                    'Delivery rate'}
                </p>

                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${getDeliveryRate(
                        selectedCampaign,
                      )}%`,
                    }}
                  />
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  {
                    getDeliveryRate(
                      selectedCampaign,
                    )
                  }
                  %
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleDuplicate(
                      selectedCampaign,
                    );

                    setSelectedCampaignId(
                      null,
                    );
                  }}
                  disabled={
                    isLoadingTemplates
                  }
                >
                  <Copy className="h-4 w-4 mr-2" />

                  {campaignT.duplicate ??
                    'Duplicate'}
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => {
                    setCampaignToDelete(
                      {
                        id: String(
                          selectedCampaign.id,
                        ),
                        name:
                          selectedCampaign.name,
                      },
                    );

                    setSelectedCampaignId(
                      null,
                    );
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />

                  {campaignT.delete ??
                    'Delete'}
                </Button>
              </DialogFooter>

            </div>
          )}

        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}

      <AlertDialog
        open={
          campaignToDelete !==
          null
        }
        onOpenChange={(open) => {
          if (!open) {
            setCampaignToDelete(
              null,
            );
          }
        }}
      >
        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>
              {campaignT.deleteConfirmTitle ??
                'Delete campaign?'}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {(
                campaignT.deleteConfirmDescription ??
                'This will permanently delete "{{name}}". This action cannot be undone.'
              ).replace(
                '{{name}}',
                campaignToDelete?.name ??
                  '',
              )}
            </AlertDialogDescription>

          </AlertDialogHeader>

          <AlertDialogFooter>

            <AlertDialogCancel
              disabled={isDeleting}
            >
              {campaignT.cancel ??
                'Cancel'}
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();

                handleConfirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}

              {campaignT.delete ??
                'Delete'}
            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}