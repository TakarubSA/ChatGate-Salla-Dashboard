import { useCallback, useState } from "react";
import { useAuth } from "./use-auth";
import {
  Campaign,
  CampaignStatus,
} from "@/types/campaigns.types";
import { useTemplates } from "./use-template";

export interface CampaignsApiResponse {
  success: boolean;
  campaigns: Campaign[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

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

export interface GetCampaignsRequest {
  offset?: number;
  limit?: number;
}

export interface CampaignsPageInfo {
  offset: number;
  limit: number;
  count: number;
  total: number;
  page: number;
  totalPages: number;
}

function authHeaders(
  token?: string,
  apiKey?: string
): HeadersInit {
  return {
    Accept: "application/json",
    ...(apiKey
      ? {
          "D360-API-KEY": apiKey,
        }
      : {}),
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}

function jsonAuthHeaders(
  token?: string
): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

const CAMPAIGNS_ENDPOINT =
  `${API_BASE_URL}/merchant/campaigns`;

export function useCampaigns() {
  const { user } = useAuth();

  const [campaigns, setCampaigns] =
    useState<Campaign[]>([]);

  const [pageInfo, setPageInfo] =
    useState<CampaignsPageInfo | null>(null);

  const [
    isLoadingCampaigns,
    setIsLoadingCampaigns,
  ] = useState(false);

  const {
    templates,
    pageInfo: templatesPageInfo,
    isLoadingTemplates,
    loadTemplates,
    hasNextPage: templatesHasNextPage,
    hasPrevPage: templatesHasPrevPage,
  } = useTemplates();

  // =========================================================
  // LOAD CAMPAIGNS
  // =========================================================

  const loadCampaigns = useCallback(
    async ({
      offset = 0,
      limit = 20,
    }: GetCampaignsRequest = {}) => {
      if (!user?.installedStoreId) {
        console.error(
          "[Campaigns] Installed store ID is missing."
        );

        setCampaigns([]);
        setPageInfo(null);

        return [];
      }

      setIsLoadingCampaigns(true);

      try {
        const params = new URLSearchParams();

        params.set("limit", String(limit));
        params.set("offset", String(offset));
        params.set(
          "installedStoreId",
          String(user.installedStoreId)
        );

        const response = await fetch(
          `${CAMPAIGNS_ENDPOINT}?${params.toString()}`,
          {
            method: "GET",
            headers: authHeaders(
              user.token,
              user.whatsapp_api_key
            ),
          }
        );

        const text =
          await response.text();

        let data: any = null;

        try {
          data = text
            ? JSON.parse(text)
            : null;
        } catch {
          data = text;
        }

        if (!response.ok) {
          throw new Error(
            typeof data === "string"
              ? data
              : data?.error?.message ||
                  data?.message ||
                  data?.error ||
                  `Request failed with status ${response.status}.`
          );
        }

        if (!data?.success) {
          throw new Error(
            data?.error?.message ||
              data?.message ||
              "Failed to load campaigns."
          );
        }

        const campaignData: Campaign[] =
          data.campaigns ?? [];

        const pagination =
          data.pagination ?? {};

        const total =
          pagination.total ??
          campaignData.length;

        setCampaigns(campaignData);

        setPageInfo({
          offset:
            pagination.offset ?? offset,
          limit:
            pagination.limit ?? limit,
          count:
            campaignData.length,
          total,
          page:
            pagination.page ??
            Math.floor(offset / limit) + 1,
          totalPages:
            pagination.totalPages ??
            Math.ceil(total / limit),
        });

        console.log(
          "[Campaigns] Loaded:",
          campaignData
        );

        return campaignData;
      } catch (error) {
        console.error(
          "[Campaigns] Failed to load:",
          error
        );

        setCampaigns([]);
        setPageInfo(null);

        return [];
      } finally {
        setIsLoadingCampaigns(false);
      }
    },
    [
      user?.token,
      user?.installedStoreId,
      user?.whatsapp_api_key,
    ]
  );

  // =========================================================
  // CREATE CAMPAIGN
  // =========================================================

  const createCampaign = useCallback(
    async (
      payload: CreateCampaignRequest
    ) => {
      if (!user?.installedStoreId) {
        throw new Error(
          "Installed store ID is missing."
        );
      }

      if (!payload.name?.trim()) {
        throw new Error(
          "Campaign name is required."
        );
      }

      if (!payload.templateName?.trim()) {
        throw new Error(
          "Template name is required."
        );
      }

      const requestBody = {
        ...payload,

        name: payload.name.trim(),
        templateName:
          payload.templateName.trim(),
        language:
          payload.language.trim(),

        installedStoreId:
          user.installedStoreId,
      };

      console.log(
        "[Campaigns] Create campaign:",
        requestBody
      );

      const response = await fetch(
        CAMPAIGNS_ENDPOINT,
        {
          method: "POST",
          headers: jsonAuthHeaders(
            user.token
          ),
          body: JSON.stringify(
            requestBody
          ),
        }
      );

      const text =
        await response.text();

      let data: any = null;

      try {
        data = text
          ? JSON.parse(text)
          : null;
      } catch {
        data = text;
      }

      if (!response.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data?.error?.message ||
                data?.message ||
                data?.error ||
                `Request failed with status ${response.status}.`
        );
      }

      if (data?.success === false) {
        throw new Error(
          data?.error?.message ||
            data?.message ||
            "Failed to create campaign."
        );
      }

      return data as CreateCampaignResponse;
    },
    [
      user?.token,
      user?.installedStoreId,
    ]
  );

  // =========================================================
  // DELETE CAMPAIGN
  // =========================================================

  const deleteCampaign = useCallback(
    async (id: string) => {
      if (!id) {
        throw new Error(
          "Campaign ID is required."
        );
      }

      if (!user?.installedStoreId) {
        throw new Error(
          "Installed store ID is missing."
        );
      }

      const response = await fetch(
        `${CAMPAIGNS_ENDPOINT}/${id}?installedStoreId=${user.installedStoreId}`,
        {
          method: "DELETE",
          headers: authHeaders(
            user.token,
            user.whatsapp_api_key
          ),
        }
      );

      const text =
        await response.text();

      if (!response.ok) {
        let message = text;

        try {
          const data =
            JSON.parse(text);

          message =
            data?.error?.message ||
            data?.message ||
            data?.error ||
            text;
        } catch {
          // Keep raw response.
        }

        throw new Error(
          message ||
            `Request failed with status ${response.status}.`
        );
      }

      setCampaigns((previous) =>
        previous.filter(
          (campaign) =>
            String(campaign.id) !==
            String(id)
        )
      );

      setPageInfo((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          count: Math.max(
            previous.count - 1,
            0
          ),
          total: Math.max(
            previous.total - 1,
            0
          ),
        };
      });
    },
    [
      user?.token,
      user?.installedStoreId,
      user?.whatsapp_api_key,
    ]
  );

  // =========================================================
  // CLEAR
  // =========================================================

  const clear = useCallback(() => {
    setCampaigns([]);
    setPageInfo(null);
  }, []);

  // =========================================================
  // PAGINATION
  // =========================================================

  const hasNextPage =
    pageInfo
      ? pageInfo.offset +
          pageInfo.count <
        pageInfo.total
      : false;

  const hasPrevPage =
    pageInfo
      ? pageInfo.offset > 0
      : false;

  return {
    campaigns,
    pageInfo,
    hasNextPage,
    hasPrevPage,
    isLoadingCampaigns,

    loadCampaigns,
    createCampaign,
    deleteCampaign,
    clear,

    templates,
    templatesPageInfo,
    isLoadingTemplates,
    loadTemplates,
    templatesHasNextPage,
    templatesHasPrevPage,
  };
}