import { useCallback, useState } from "react";
import { useAuth } from "./use-auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type MarketingComponent = Record<string, unknown>;

interface BroadcastPayload {
  campaignName: string;
  recipients: string[];
  templateName: string;
  language: string;
  components?: MarketingComponent[];
}

interface ScheduleBroadcastPayload
  extends BroadcastPayload {
  scheduledAt: string;
}

interface TestBroadcastPayload {
  phone: string;
  campaignName?: string;
  templateName: string;
  language: string;
  components?: MarketingComponent[];
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
  token?: string,
  apiKey?: string
): HeadersInit {
  return {
    ...authHeaders(token, apiKey),
    "Content-Type": "application/json",
  };
}

async function parseResponse(
  response: Response
): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(
  data: unknown,
  fallback: string
): string {
  if (!data) {
    return fallback;
  }

  if (typeof data === "string") {
    return data.trim() || fallback;
  }

  if (typeof data === "object") {
    const value = data as Record<string, unknown>;

    const messages = [
      value.message,
      value.error,
      value.error_message,
      value.detail,
    ];

    for (const message of messages) {
      if (
        typeof message === "string" &&
        message.trim()
      ) {
        return message.trim();
      }
    }

    if (value.messages) {
      try {
        if (Array.isArray(value.messages)) {
          return value.messages
            .map((item) => {
              if (typeof item === "string") {
                return item;
              }

              if (
                item &&
                typeof item === "object"
              ) {
                const itemValue =
                  item as Record<
                    string,
                    unknown
                  >;

                return (
                  itemValue.message ||
                  itemValue.error ||
                  JSON.stringify(item)
                );
              }

              return String(item);
            })
            .join(", ");
        }

        return JSON.stringify(
          value.messages
        );
      } catch {
        return fallback;
      }
    }

    try {
      return JSON.stringify(data);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function normalizeRecipients(
  recipients: string[]
): string[] {
  return Array.from(
    new Set(
      recipients
        .map((phone) =>
          typeof phone === "string"
            ? phone.trim()
            : ""
        )
        .filter(Boolean)
    )
  );
}

function buildTemplate(
  templateName: string,
  language: string,
  components?: MarketingComponent[]
) {
  return {
    name: templateName.trim(),
    language: {
      code: language.trim(),
    },
    ...(components?.length
      ? {
          components,
        }
      : {}),
  };
}

async function executeRequest(
  url: string,
  options: RequestInit
): Promise<unknown> {
  const response = await fetch(
    url,
    options
  );

  const data = await parseResponse(
    response
  );

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        `Request failed with status ${response.status}.`
      )
    );
  }

  return data;
}

export function useMarketing() {
  const { user } = useAuth();

  const [isTesting, setIsTesting] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  // =========================================================
  // SEND BROADCAST NOW
  // =========================================================

  const createBroadcast = useCallback(
    async ({
      campaignName,
      recipients,
      templateName,
      language,
      components,
    }: BroadcastPayload) => {
      const normalizedRecipients =
        normalizeRecipients(recipients);

      if (!campaignName?.trim()) {
        throw new Error(
          "Campaign name is required."
        );
      }

      if (
        normalizedRecipients.length === 0
      ) {
        throw new Error(
          "No recipients were provided."
        );
      }

      if (!templateName?.trim()) {
        throw new Error(
          "Template name is required."
        );
      }

      if (!language?.trim()) {
        throw new Error(
          "Template language is required."
        );
      }

      if (!user?.installedStoreId) {
        throw new Error(
          "Installed store ID is missing."
        );
      }

      setIsSubmitting(true);

      try {
        const requestBody = {
          installedStoreId:
            user.installedStoreId,

          campaignName:
            campaignName.trim(),

          recipients:
            normalizedRecipients,

          type: "template",

          template: buildTemplate(
            templateName,
            language,
            components
          ),
        };

        console.log(
          "[Marketing] Send broadcast:",
          requestBody
        );

        const data =
          await executeRequest(
            `${API_BASE_URL}/merchant/marketing-messages`,
            {
              method: "POST",
              headers:
                jsonAuthHeaders(
                  user.token,
                  user.whatsapp_api_key
                ),
              body: JSON.stringify(
                requestBody
              ),
            }
          );

        console.log(
          "[Marketing] Send response:",
          data
        );

        return data;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      user?.token,
      user?.whatsapp_api_key,
      user?.installedStoreId,
    ]
  );

  // =========================================================
  // TEST MESSAGE
  // =========================================================

  const handleTestMarketingMessage =
    useCallback(
      async ({
        phone,
        campaignName,
        templateName,
        language,
        components,
      }: TestBroadcastPayload) => {
        const normalizedPhone =
          phone?.trim();

        if (!normalizedPhone) {
          throw new Error(
            "Phone number is required."
          );
        }

        if (!templateName?.trim()) {
          throw new Error(
            "Template name is required."
          );
        }

        if (!language?.trim()) {
          throw new Error(
            "Template language is required."
          );
        }

        if (!user?.installedStoreId) {
          throw new Error(
            "Installed store ID is missing."
          );
        }

        setIsTesting(true);

        try {
          const requestBody = {
            installedStoreId:
              user.installedStoreId,

            ...(campaignName?.trim()
              ? {
                  campaignName:
                    campaignName.trim(),
                }
              : {}),

            recipients: [
              normalizedPhone,
            ],

            type: "template",

            template: buildTemplate(
              templateName,
              language,
              components
            ),
          };

          console.log(
            "[Marketing] Test message:",
            requestBody
          );

          const data =
            await executeRequest(
              `${API_BASE_URL}/merchant/marketing-messages`,
              {
                method: "POST",
                headers:
                  jsonAuthHeaders(
                    user.token,
                    user.whatsapp_api_key
                  ),
                body: JSON.stringify(
                  requestBody
                ),
              }
            );

          console.log(
            "[Marketing] Test response:",
            data
          );

          return data;
        } finally {
          setIsTesting(false);
        }
      },
      [
        user?.token,
        user?.whatsapp_api_key,
        user?.installedStoreId,
      ]
    );

  // =========================================================
  // SCHEDULE BROADCAST
  // =========================================================

  const scheduleBroadcast = useCallback(
    async ({
      campaignName,
      recipients,
      templateName,
      language,
      components,
      scheduledAt,
    }: ScheduleBroadcastPayload) => {
      const normalizedRecipients =
        normalizeRecipients(recipients);

      if (!campaignName?.trim()) {
        throw new Error(
          "Campaign name is required."
        );
      }

      if (
        normalizedRecipients.length === 0
      ) {
        throw new Error(
          "No recipients were provided."
        );
      }

      if (!templateName?.trim()) {
        throw new Error(
          "Template name is required."
        );
      }

      if (!language?.trim()) {
        throw new Error(
          "Template language is required."
        );
      }

      if (!scheduledAt?.trim()) {
        throw new Error(
          "Scheduled date and time are required."
        );
      }

      if (!user?.installedStoreId) {
        throw new Error(
          "Installed store ID is missing."
        );
      }

      const date = new Date(
        scheduledAt
      );

      if (Number.isNaN(date.getTime())) {
        throw new Error(
          "Invalid scheduled date and time."
        );
      }

      if (
        date.getTime() <=
        Date.now()
      ) {
        throw new Error(
          "Scheduled date and time must be in the future."
        );
      }

      setIsSubmitting(true);

      try {
        const requestBody = {
          installedStoreId:
            user.installedStoreId,

          campaignName:
            campaignName.trim(),

          recipients:
            normalizedRecipients,

          scheduledAt,

          type: "template",

          template: buildTemplate(
            templateName,
            language,
            components
          ),
        };

        console.log(
          "[Marketing] Schedule broadcast:",
          requestBody
        );

        const data =
          await executeRequest(
            `${API_BASE_URL}/merchant/marketing-messages/schedule`,
            {
              method: "POST",
              headers:
                jsonAuthHeaders(
                  user.token,
                  user.whatsapp_api_key
                ),
              body: JSON.stringify(
                requestBody
              ),
            }
          );

        console.log(
          "[Marketing] Schedule response:",
          data
        );

        return data;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      user?.token,
      user?.whatsapp_api_key,
      user?.installedStoreId,
    ]
  );

  return {
    createBroadcast,
    handleTestMarketingMessage,
    scheduleBroadcast,
    isTesting,
    isSubmitting,
  };
}