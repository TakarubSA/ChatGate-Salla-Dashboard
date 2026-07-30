import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Users } from 'lucide-react';
import { TemplateOption, AudienceOption, CampaignBuilderInitialValues, CampaignFormValues } from '@/types/campaigns.types';


// Swap these for real data (e.g. useTemplates(), useAudiences()) once
// those hooks are available. Only APPROVED templates should be sendable.
const MOCK_TEMPLATES: TemplateOption[] = [
  { id: 'tpl_1', name: 'order_update', language: 'en_US' },
  { id: 'tpl_2', name: 'welcome_offer', language: 'en_US' },
  { id: 'tpl_3', name: 'appointment_reminder', language: 'ar' },
  { id: 'tpl_4', name: 'feedback_request', language: 'en_US' },
  { id: 'tpl_5', name: 'restock_alert', language: 'es_ES' },
  { id: 'tpl_6', name: 'holiday_promo', language: 'en_US' },
];

const MOCK_AUDIENCES: AudienceOption[] = [
  { id: 'aud_all', name: 'All customers', count: 8420 },
  { id: 'aud_vip', name: 'VIP tier', count: 612 },
  { id: 'aud_new', name: 'Recent signups', count: 1930 },
  { id: 'aud_cart', name: 'Abandoned cart', count: 447 },
];

const emptyValues: CampaignBuilderInitialValues = {
  name: '',
  templateId: '',
  audienceId: '',
  scheduleNow: true,
  scheduledAt: '',
};

interface CampaignBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CampaignFormValues) => void | Promise<void>;
  initialValues?: CampaignBuilderInitialValues;
  isSubmitting?: boolean;
  title?: string;
  description?: string;
  submitLabel?: string;
}

export function CampaignBuilder({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  isSubmitting = false,
  title = 'New Campaign',
  description = 'Send a template message to a chosen audience.',
  submitLabel = 'Create campaign',
}: CampaignBuilderProps) {
  const [values, setValues] = useState<CampaignBuilderInitialValues>(
    initialValues ?? emptyValues,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues(initialValues ?? emptyValues);
      setError(null);
    }
  }, [open, initialValues]);

  const selectedAudience = MOCK_AUDIENCES.find((a) => a.id === values.audienceId);

  const handleSubmit = () => {
    if (!values.name.trim()) return setError('Give the campaign a name.');
    if (!values.templateId) return setError('Choose a template to send.');
    if (!values.audienceId) return setError('Choose an audience.');
    if (!values.scheduleNow && !values.scheduledAt) {
      return setError('Pick a date and time, or send immediately.');
    }
    setError(null);
    onSubmit({
      name: values.name.trim(),
      templateId: values.templateId,
      audienceId: values.audienceId,
      scheduleNow: values.scheduleNow,
      scheduledAt: values.scheduleNow ? '' : values.scheduledAt,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign name</Label>
            <Input
              id="campaign-name"
              placeholder="e.g. Summer restock alert"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Template</Label>
            <Select
              value={values.templateId}
              onValueChange={(templateId) => setValues((v) => ({ ...v, templateId }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an approved template" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_TEMPLATES.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id}>
                    {tpl.name} · {tpl.language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Audience</Label>
            <Select
              value={values.audienceId}
              onValueChange={(audienceId) => setValues((v) => ({ ...v, audienceId }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select who receives this" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_AUDIENCES.map((aud) => (
                  <SelectItem key={aud.id} value={aud.id}>
                    {aud.name} ({aud.count.toLocaleString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAudience && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {selectedAudience.count.toLocaleString()} recipients
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Delivery</Label>
            <RadioGroup
              value={values.scheduleNow ? 'now' : 'later'}
              onValueChange={(val) =>
                setValues((v) => ({ ...v, scheduleNow: val === 'now' }))
              }
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="now" id="send-now" />
                <Label htmlFor="send-now" className="font-normal cursor-pointer">
                  Send now
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="later" id="send-later" />
                <Label htmlFor="send-later" className="font-normal cursor-pointer">
                  Schedule for later
                </Label>
              </div>
            </RadioGroup>
            {!values.scheduleNow && (
              <Input
                type="datetime-local"
                value={values.scheduledAt}
                onChange={(e) =>
                  setValues((v) => ({ ...v, scheduledAt: e.target.value }))
                }
                className="mt-1"
              />
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { MOCK_TEMPLATES, MOCK_AUDIENCES };
