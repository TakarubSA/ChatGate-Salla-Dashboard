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
  Megaphone,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  Loader2,
  Calendar,
  Send,
  CheckCheck,
  Eye,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel } from '@/lib/export-excel';
import { useLanguage } from '@/hooks/use-language';

import { useCampaigns } from '@/hooks/use-campaigns';
import { CampaignBuilder, MOCK_AUDIENCES, MOCK_TEMPLATES } from '@/components/campaigns/CampaignBuilder';
import { CampaignStatus, CampaignFormValues, Campaign, CampaignBuilderInitialValues } from '@/types/campaigns.types';

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<CampaignStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  SCHEDULED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  SENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  SENT: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  PAUSED: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  FAILED: 'bg-destructive/10 text-destructive',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Converts the builder's form shape into a campaign creation payload.
// Adjust field names here if your backend expects something different.
function buildCampaignPayload(values: CampaignFormValues) {
  const template = MOCK_TEMPLATES.find((t) => t.id === values.templateId);
  const audience = MOCK_AUDIENCES.find((a) => a.id === values.audienceId);

  return {
    name: values.name,
    templateId: values.templateId,
    templateName: template?.name ?? '',
    language: template?.language ?? 'en_US',
    audienceName: audience?.name ?? '',
    audienceCount: audience?.count ?? 0,
    scheduledAt: values.scheduleNow ? null : new Date(values.scheduledAt).toISOString(),
  };
}

function campaignToInitialValues(campaign: Campaign): CampaignBuilderInitialValues {
  return {
    name: `${campaign.name}_copy`,
    templateId: campaign.templateId,
    audienceId: MOCK_AUDIENCES.find((a) => a.name === campaign.audienceName)?.id ?? '',
    scheduleNow: true,
    scheduledAt: '',
  };
}

export default function CampaignsPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const {
    campaigns,
    pageInfo,
    hasNextPage,
    hasPrevPage,
    isLoadingCampaigns,
    loadCampaigns,
    createCampaign,
    deleteCampaign,
  } = useCampaigns();

  const [search, setSearch] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [builderInitialValues, setBuilderInitialValues] =
    useState<CampaignBuilderInitialValues | undefined>(undefined);
  const [campaignToDelete, setCampaignToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCampaigns({ limit: PAGE_SIZE, offset: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goNext = () => {
    if (!hasNextPage || !pageInfo) return;
    loadCampaigns({ limit: PAGE_SIZE, offset: pageInfo.offset + pageInfo.limit });
  };

  const goPrev = () => {
    if (!hasPrevPage || !pageInfo) return;
    const prevOffset = Math.max(pageInfo.offset - pageInfo.limit, 0);
    loadCampaigns({ limit: PAGE_SIZE, offset: prevOffset });
  };

  const filteredCampaigns = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.templateName?.toLowerCase().includes(q) ||
        c.status?.toLowerCase().includes(q) ||
        c.audienceName?.toLowerCase().includes(q)
    );
  }, [campaigns, search]);

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === selectedCampaignId),
    [campaigns, selectedCampaignId]
  );

  const handleExport = () => {
    exportToExcel(
      campaigns.map((c) => ({
        [t.campaigns?.name ?? 'Name']: c.name,
        [t.campaigns?.template ?? 'Template']: c.templateName,
        [t.campaigns?.audience ?? 'Audience']: c.audienceName,
        [t.campaigns?.status ?? 'Status']: c.status,
        [t.campaigns?.scheduled ?? 'Scheduled']: formatDate(c.scheduledAt),
        [t.campaigns?.recipients ?? 'Recipients']: c.stats.recipients,
        [t.campaigns?.delivered ?? 'Delivered']: c.stats.delivered,
        [t.campaigns?.read ?? 'Read']: c.stats.read,
      })),
      `campaigns-${new Date().toISOString().slice(0, 10)}`,
      t.campaigns?.title ?? 'Campaigns'
    );
    toast({
      title: t.campaigns?.exportSuccessTitle ?? 'Export ready',
      description: t.campaigns?.exportSuccessDescription ?? 'Campaigns were exported to Excel.',
    });
  };

  const openNewCampaign = () => {
    setBuilderInitialValues(undefined);
    setIsBuilderOpen(true);
  };

  const handleDuplicate = (campaign: Campaign) => {
    setBuilderInitialValues(campaignToInitialValues(campaign));
    setIsBuilderOpen(true);
  };

  const handleCreateCampaign = async (values: CampaignFormValues) => {
    setIsCreating(true);
    try {
      const payload = buildCampaignPayload(values);
      await createCampaign(payload);

      toast({
        title: t.campaigns?.createSuccessTitle ?? 'Campaign created',
        description: values.scheduleNow
          ? t.campaigns?.createSuccessNowDescription ?? 'Your campaign is being sent.'
          : t.campaigns?.createSuccessScheduledDescription ?? 'Your campaign has been scheduled.',
      });

      setIsBuilderOpen(false);
      setBuilderInitialValues(undefined);
      loadCampaigns({ limit: PAGE_SIZE, offset: 0 });
    } catch (error) {
      toast({
        title: t.campaigns?.createErrorTitle ?? 'Failed to create campaign',
        description:
          error instanceof Error
            ? error.message
            : t.campaigns?.createErrorDescription ?? 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!campaignToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCampaign(campaignToDelete.id);

      toast({
        title: t.campaigns?.deleteSuccessTitle ?? 'Campaign deleted',
        description: t.campaigns?.deleteSuccessDescription ?? 'The campaign was removed.',
      });

      setCampaignToDelete(null);
      if (selectedCampaignId === campaignToDelete.id) {
        setSelectedCampaignId(null);
      }
      loadCampaigns({ limit: PAGE_SIZE, offset: pageInfo?.offset ?? 0 });
    } catch (error) {
      toast({
        title: t.campaigns?.deleteErrorTitle ?? 'Failed to delete campaign',
        description:
          error instanceof Error
            ? error.message
            : t.campaigns?.deleteErrorDescription ?? 'Something went wrong.',
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
            {t.campaigns?.title ?? 'Campaigns'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t.campaigns?.pageSubtitle ?? 'Send template messages to your audiences and track delivery'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {t.campaigns?.exportPage ?? 'Export'}
          </Button>
          <Button size="sm" onClick={openNewCampaign}>
            <Plus className="h-4 w-4 mr-2" />
            {t.campaigns?.newCampaign ?? 'New Campaign'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-end gap-4 justify-between">
          <div className="space-y-1 w-full sm:w-[280px]">
            <label className="text-sm font-medium text-muted-foreground">
              {t.campaigns?.search ?? 'Search'}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.campaigns?.searchHint ?? 'Name, template, status...'}
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
                  <th className="px-6 py-3">{t.campaigns?.name ?? 'Name'}</th>
                  <th className="px-6 py-3">{t.campaigns?.template ?? 'Template'}</th>
                  <th className="px-6 py-3">{t.campaigns?.audience ?? 'Audience'}</th>
                  <th className="px-6 py-3">{t.campaigns?.status ?? 'Status'}</th>
                  <th className="px-6 py-3">{t.campaigns?.scheduled ?? 'Scheduled'}</th>
                  <th className="px-6 py-3">{t.campaigns?.delivered ?? 'Delivered'}</th>
                  <th className="px-6 py-3 text-right">
                    {t.campaigns?.actions ?? 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingCampaigns ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center">
                        <RotateCcw className="h-5 w-5 animate-spin mr-2" />
                        {t.campaigns?.loading ?? 'Loading campaigns...'}
                      </div>
                    </td>
                  </tr>
                ) : filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Megaphone className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">
                        {t.campaigns?.noCampaignsFound ?? 'No campaigns found'}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {t.campaigns?.tryAdjustingSearch ?? 'Try adjusting your search'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setSelectedCampaignId(c.id)}
                    >
                      <td className="px-6 py-4 font-medium text-primary group-hover:underline">
                        {c.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        {c.templateName}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {c.audienceName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_STYLES[c.status]}`}
                        >
                          {c.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(c.scheduledAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {c.stats.sent > 0
                          ? `${c.stats.delivered.toLocaleString()} / ${c.stats.recipients.toLocaleString()}`
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={t.campaigns?.duplicate ?? 'Duplicate'}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(c);
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title={t.campaigns?.delete ?? 'Delete'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCampaignToDelete({ id: c.id, name: c.name });
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
              ? (t.campaigns?.showingCampaigns ?? 'Showing {{from}}–{{to}} of {{total}} campaigns')
                  .replace('{{from}}', String(pageInfo.offset + 1))
                  .replace('{{to}}', String(pageInfo.offset + pageInfo.count))
                  .replace('{{total}}', String(pageInfo.total))
              : (t.campaigns?.campaignsCount ?? '{{count}} campaigns').replace(
                  '{{count}}',
                  String(filteredCampaigns.length)
                )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goPrev}
              disabled={isLoadingCampaigns || !hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t.campaigns?.previous ?? 'Previous'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goNext}
              disabled={isLoadingCampaigns || !hasNextPage}
            >
              {t.campaigns?.next ?? 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      <CampaignBuilder
        open={isBuilderOpen}
        onOpenChange={(open) => {
          setIsBuilderOpen(open);
          if (!open) setBuilderInitialValues(undefined);
        }}
        onSubmit={handleCreateCampaign}
        initialValues={builderInitialValues}
        isSubmitting={isCreating}
        title={
          builderInitialValues
            ? t.campaigns?.duplicateCampaign ?? 'Duplicate Campaign'
            : t.campaigns?.newCampaign ?? 'New Campaign'
        }
        description={
          t.campaigns?.newCampaignDescription ??
          'Send a template message to a chosen audience.'
        }
        submitLabel={t.campaigns?.submitCampaign ?? 'Create campaign'}
      />

      <Dialog
        open={selectedCampaignId !== null}
        onOpenChange={(open) => !open && setSelectedCampaignId(null)}
      >
        <DialogContent className="!w-auto !max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedCampaign?.name || '...'}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedCampaign ? (
            <div className="space-y-6 mt-4">
              <div className="flex justify-between items-start p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t.campaigns?.template ?? 'Template'}
                  </p>
                  <p className="font-mono text-sm font-medium mt-1">{selectedCampaign.templateName}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {t.campaigns?.status ?? 'Status'}
                  </p>
                  <span
                    className={`inline-block mt-1 text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_STYLES[selectedCampaign.status]}`}
                  >
                    {selectedCampaign.status.toLowerCase()}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {t.campaigns?.scheduled ?? 'Scheduled'}
                  </p>
                  <p className="font-medium mt-1">{formatDate(selectedCampaign.scheduledAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground mb-2 text-sm flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {t.campaigns?.audience ?? 'Audience'}: {selectedCampaign.audienceName}
                </p>
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg border border-border text-center">
                    <Send className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-semibold">{selectedCampaign.stats.sent.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{t.campaigns?.sent ?? 'Sent'}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border text-center">
                    <CheckCheck className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
                    <p className="text-lg font-semibold">{selectedCampaign.stats.delivered.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{t.campaigns?.delivered ?? 'Delivered'}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border text-center">
                    <Eye className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                    <p className="text-lg font-semibold">{selectedCampaign.stats.read.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{t.campaigns?.read ?? 'Read'}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border text-center">
                    <XCircle className="h-4 w-4 mx-auto mb-1 text-destructive" />
                    <p className="text-lg font-semibold">{selectedCampaign.stats.failed.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{t.campaigns?.failed ?? 'Failed'}</p>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button
                  variant="destructive"
                  onClick={() =>
                    setCampaignToDelete({
                      id: selectedCampaign.id,
                      name: selectedCampaign.name,
                    })
                  }
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t.campaigns?.delete ?? 'Delete'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleDuplicate(selectedCampaign);
                    setSelectedCampaignId(null);
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {t.campaigns?.duplicate ?? 'Duplicate'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {t.campaigns?.failedToLoadDetails ?? 'Failed to load campaign details'}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={campaignToDelete !== null}
        onOpenChange={(open) => !open && setCampaignToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t.campaigns?.deleteConfirmTitle ?? 'Delete campaign'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(
                t.campaigns?.deleteConfirmDescription ??
                'This will permanently delete "{{name}}". This action cannot be undone.'
              ).replace('{{name}}', campaignToDelete?.name ?? '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t.campaigns?.cancel ?? 'Cancel'}
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
              {t.campaigns?.delete ?? 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
