// Shared types for the Campaigns feature.
// Mirrors the shape used by components/templates/types.ts so the two
// features stay consistent. Adjust field names here if your backend's
// campaign shape differs.

export type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'SENDING'
  | 'SENT'
  | 'PAUSED'
  | 'FAILED';

export interface CampaignStats {
  recipients: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  templateId: string;
  templateName: string;
  language: string;
  audienceName: string;
  audienceCount: number;
  scheduledAt: string | null; // ISO string, null if not yet scheduled
  createdAt: string; // ISO string
  stats: CampaignStats;
}

// Values collected by the campaign creation/duplication form.
export interface CampaignFormValues {
  name: string;
  templateId: string;
  audienceId: string;
  scheduleNow: boolean;
  scheduledAt: string; // ISO string, only used when scheduleNow is false
}

export interface CampaignBuilderInitialValues {
  name: string;
  templateId: string;
  audienceId: string;
  scheduleNow: boolean;
  scheduledAt: string;
}

// Minimal shape needed to populate the template/audience pickers in the
// builder. Swap these for real hooks (e.g. useTemplates, useAudiences)
// once those data sources are wired up.
export interface TemplateOption {
  id: string;
  name: string;
  language: string;
}

export interface AudienceOption {
  id: string;
  name: string;
  count: number;
}
