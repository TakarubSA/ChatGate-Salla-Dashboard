import { useCallback, useState } from "react";
import { useAuth } from "./use-auth";
import { Campaign, CampaignStatus, CampaignStats } from "@/types/campaigns.types";
import { useTemplates } from "./use-template";

// ---- Raw shape returned by GET /campaigns ----
export interface CampaignsApiResponse {
  count: number;
  limit: number;
  offset: number;
  total: number;
  data: Campaign[];
}

// ---- Payload shape for creating a campaign ----
export interface CreateCampaignRequest {
  name: string;
  templateId: string;
  templateName: string;
  language: string;
  audienceName: string;
  audienceCount: number;
  scheduledAt?: string | null;
}

export interface CreateCampaignResponse {
  id: string;
  status: CampaignStatus;
}

// ---- Raw shape returned by GET /merchant/templates/analytics (proxying 360dialog) ----
interface TemplateAnalyticsDataPoint {
  start: number;
  end: number;
  value: number;
}

interface TemplateAnalyticsMetric {
  metric_type: string;
  granularity: string;
  data_points: TemplateAnalyticsDataPoint[];
}

interface TemplateAnalyticsEntry {
  template_id: string;
  analytics: TemplateAnalyticsMetric[];
}

interface TemplateAnalyticsApiResponse {
  id: string;
  template_analytics: TemplateAnalyticsEntry[];
}

export interface TemplateAnalyticsRequest {
  template_ids: string[];
  start?: number;
  end?: number;
  granularity?: "DAILY" | "MONTHLY";
  metric_types?: Array<"sent" | "delivered" | "read" | "failed">;
}

// 360dialog metric_type -> our CampaignStats field.
const METRIC_TO_STAT: Record<string, keyof CampaignStats> = {
  sent: "sent",
  delivered: "delivered",
  read: "read",
  failed: "failed",
};

// Sums each metric's data_points into a flat stats object for a single template.
function reduceTemplateAnalytics(entry: TemplateAnalyticsEntry): Partial<CampaignStats> {
  const stats: Partial<CampaignStats> = {};
  for (const metric of entry.analytics) {
    const key = METRIC_TO_STAT[metric.metric_type];
    if (!key) continue;
    stats[key] = metric.data_points.reduce((sum, dp) => sum + dp.value, 0);
  }
  return stats;
}

// Mirrors useTemplates.ts's authHeaders: attaches D360-API-KEY for endpoints
// that proxy 360dialog directly (template_analytics), same as the templates
// endpoint does.
function authHeaders(token?: string, apiKey?: string): HeadersInit {
  return {
    Accept: "application/json",
    "D360-API-KEY": apiKey!,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

function jsonAuthHeaders(token?: string): HeadersInit {
  return {
    ...authHeaders(token),
    "Content-Type": "application/json",
  };
}

export interface GetCampaignsRequest {
  offset?: number;
  limit?: number;
}

export interface CampaignsPageInfo {
  offset: number;
  limit: number;
  count: number;
  total: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// This hits your own backend, which should own campaign persistence and,
// for analytics, attach the D360-API-KEY header server-side. Never send
// that key from the browser.
const CAMPAIGNS_ENDPOINT = `${API_BASE_URL}/campaigns`;
const TEMPLATE_ANALYTICS_ENDPOINT = `${API_BASE_URL}/merchant/templates/analytics`;

export function useCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pageInfo, setPageInfo] = useState<CampaignsPageInfo | null>(null);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  // Composed rather than duplicated — reuses the existing fetch/mapping
  // logic (and the 360dialog header handling) from useTemplates so campaign
  // creation UIs can pick a template without a second implementation to
  // keep in sync.
  const {
    templates,
    pageInfo: templatesPageInfo,
    isLoadingTemplates,
    loadTemplates,
    hasNextPage: templatesHasNextPage,
    hasPrevPage: templatesHasPrevPage,
  } = useTemplates();

  const loadCampaigns = useCallback(
    async ({ offset = 0, limit = 20 }: GetCampaignsRequest = {}) => {
      try {
        setIsLoadingCampaigns(true);
        const params = new URLSearchParams();
        params.append("limit", String(limit));
        params.append("offset", String(offset));

        const response = await fetch(`${CAMPAIGNS_ENDPOINT}?${params.toString()}`, {
          headers: authHeaders(user?.token, user?.whatsapp_api_key),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const json = (await response.json()) as CampaignsApiResponse;
        setCampaigns(json.data ?? []);
        setPageInfo({
          offset: json.offset,
          limit: json.limit,
          count: json.count,
          total: json.total,
        });
        return json.data ?? [];
      } catch (err) {
        console.error(err);
        setCampaigns([]);
        setPageInfo(null);
        return [];
      } finally {
        setIsLoadingCampaigns(false);
      }
    },
    [user?.token, user?.whatsapp_api_key]
  );

  // Creates a campaign via the backend. Throws on failure so callers can
  // handle the error (e.g. show a toast) — does not touch campaigns state
  // directly; call loadCampaigns() afterwards to refresh the list.
  const createCampaign = useCallback(
    async (payload: CreateCampaignRequest) => {
      const response = await fetch(CAMPAIGNS_ENDPOINT, {
        method: "POST",
        headers: jsonAuthHeaders(user?.token),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return (await response.json()) as CreateCampaignResponse;
    },
    [user?.token]
  );

  // Deletes a campaign by id. Matches a DELETE /campaigns/:id backend route.
  const deleteCampaign = useCallback(
    async (id: string) => {
      const response = await fetch(`${CAMPAIGNS_ENDPOINT}/${id}`, {
        method: "DELETE",
        headers: authHeaders(user?.token, user?.whatsapp_api_key),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      setPageInfo((prev) =>
        prev
          ? {
              ...prev,
              count: Math.max(prev.count - 1, 0),
              total: Math.max(prev.total - 1, 0),
            }
          : prev
      );
    },
    [user?.token, user?.whatsapp_api_key]
  );

  // Fetches delivered/read/sent/failed counts for one or more templates from
  // MerchantController#getTemplateAnalytics (which proxies 360dialog's
  // GET /marketing/template_analytics) and merges the results into the
  // matching campaigns' stats.
  //
  // Note: that backend route is a GET expecting a JSON body, but the Fetch
  // spec forbids a body on GET requests in the browser, so the payload is
  // JSON-encoded into a query search param instead. MerchantController
  // needs a matching @QueryParam("query") fallback for this to work.
  const refreshCampaignAnalytics = useCallback(
    async (templateIds: string[], options?: Omit<TemplateAnalyticsRequest, "template_ids">) => {
      try {
        const payload: TemplateAnalyticsRequest = {
          template_ids: templateIds,
          granularity: "DAILY",
          metric_types: ["sent", "delivered", "read", "failed"],
          ...options,
        };

        const params = new URLSearchParams();
        params.append("query", JSON.stringify(payload));

        const response = await fetch(`${TEMPLATE_ANALYTICS_ENDPOINT}?${params.toString()}`, {
          headers: authHeaders(user?.token, user?.whatsapp_api_key),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const json = (await response.json()) as TemplateAnalyticsApiResponse;
        const statsByTemplateId = new Map<string, Partial<CampaignStats>>();
        for (const entry of json.template_analytics ?? []) {
          statsByTemplateId.set(entry.template_id, reduceTemplateAnalytics(entry));
        }

        setCampaigns((prev) =>
          prev.map((c) => {
            const partialStats = statsByTemplateId.get(c.templateId);
            return partialStats ? { ...c, stats: { ...c.stats, ...partialStats } } : c;
          })
        );

        return statsByTemplateId;
      } catch (err) {
        console.error(err);
        return new Map<string, Partial<CampaignStats>>();
      }
    },
    [user?.token, user?.whatsapp_api_key]
  );

  const clear = useCallback(() => {
    setCampaigns([]);
    setPageInfo(null);
  }, []);

  const hasNextPage = pageInfo ? pageInfo.offset + pageInfo.count < pageInfo.total : false;
  const hasPrevPage = pageInfo ? pageInfo.offset > 0 : false;

  return {
    campaigns,
    pageInfo,
    hasNextPage,
    hasPrevPage,
    isLoadingCampaigns,
    loadCampaigns,
    createCampaign,
    deleteCampaign,
    refreshCampaignAnalytics,
    clear,
    // Templates, exposed for campaign-creation flows (e.g. a template picker).
    templates,
    templatesPageInfo,
    isLoadingTemplates,
    loadTemplates,
    templatesHasNextPage,
    templatesHasPrevPage,
  };
}