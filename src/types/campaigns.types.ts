export type CampaignStatus =
  | 'ACTIVE'
  | 'COMPLETED'
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PAUSED'
  | 'CANCELLED';

export interface Campaign {
  id: string | number;
  installedStoreId: number;
  name: string;
  templateId: string | null;
  templateName: string;
  language: string;
  status: CampaignStatus;

  totalRecipients: number;
  messageCount: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  pending: number;

  createdAt: string | number | null;
  updatedAt: string | number | null;

  // These are not currently returned by the campaigns API.
  audienceName?: string | null;
  audienceCount?: number;
  scheduledAt?: string | number | null;
}

export interface CampaignFormValues {
  name: string;
  templateId: string;
  audienceId: string;
  scheduleNow: boolean;
  scheduledAt: string;
}

export interface CampaignBuilderInitialValues {
  name: string;
  templateId: string;
  audienceId: string;
  scheduleNow: boolean;
  scheduledAt: string;
}

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