import { useCallback, useState } from "react";
import { useAuth } from "./use-auth";

// ---- Raw shape returned by /merchant/templates (proxying 360dialog) ----

export interface TemplateExample {
  header_handle?: string[];
  body_text?: string[][];
}

export interface TemplateHeaderComponent {
  type: "HEADER";
  format: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "LOCATION";
  text?: string;
  example?: TemplateExample;
}

export interface TemplateBodyComponent {
  type: "BODY";
  text: string;
  example?: TemplateExample;
}

export interface TemplateFooterComponent {
  type: "FOOTER";
  text: string;
}

export interface TemplateButtonItem {
  type: string; // "URL" | "PHONE_NUMBER" | "QUICK_REPLY" | "COPY_CODE"
  text: string;
  url?: string;
  phone_number?: string;
  example?: string[];
}

export interface TemplateButtonsComponent {
  type: "BUTTONS";
  buttons: TemplateButtonItem[];
}

export type TemplateComponent =
  | TemplateHeaderComponent
  | TemplateBodyComponent
  | TemplateFooterComponent
  | TemplateButtonsComponent;

export interface QualityScore {
  score: string;
  reasons: string[] | null;
}

export interface WabaTemplate {
  id: string;
  external_id: string;
  name: string;
  namespace: string;
  language: string;
  category: string;
  status: string;
  components: TemplateComponent[];
  created_at: string;
  modified_at: string;
  waba_account_id: string;
  partner_id: string;
  rejected_reason?: string;
  quality_score?: QualityScore;
}

export interface TemplatesApiResponse {
  count: number;
  limit: number;
  offset: number;
  total: number;
  sort: string[];
  filters: Record<string, unknown>;
  waba_templates: WabaTemplate[];
}

// ---- Friendly shape derived from `components`, used by the UI ----

export interface MessageTemplate {
  id: string;
  // 360dialog's external_id — this is what Meta/WhatsApp actually calls the
  // template on their side, and it's what the delete endpoint's `hsm_id`
  // query param expects. `id` alone is 360dialog's internal record id and
  // will get rejected (400) if sent as hsm_id.
  externalId: string;
  name: string;
  category: string;
  language: string;
  status: string;
  headerText?: string;
  headerImageUrl?: string;
  body: string;
  bodyParamsExample?: string[];
  buttons: TemplateButtonItem[];
}

// ---- Payload shape for creating a template (mirrors 360dialog's create API) ----

export interface CreateTemplateRequest {
  name: string;
  category: string;
  language: string;
  components: TemplateComponent[];
}

export interface CreateTemplateResponse {
  id: string;
  status?: string;
  category?: string;
}

function findComponent<T extends TemplateComponent["type"]>(
  components: TemplateComponent[],
  type: T
) {
  return components.find((c) => c.type === type);
}

function mapWabaTemplate(raw: WabaTemplate): MessageTemplate {
  const header = findComponent(raw.components, "HEADER") as
    | TemplateHeaderComponent
    | undefined;
  const body = findComponent(raw.components, "BODY") as
    | TemplateBodyComponent
    | undefined;
  const buttonsComp = findComponent(raw.components, "BUTTONS") as
    | TemplateButtonsComponent
    | undefined;

  return {
    id: raw.id,
    externalId: raw.external_id,
    name: raw.name,
    category: raw.category,
    language: raw.language,
    status: raw.status,
    headerText: header?.format === "TEXT" ? header.text : undefined,
    headerImageUrl:
      header?.format === "IMAGE"
        ? header.example?.header_handle?.[0]
        : undefined,
    body: body?.text ?? "",
    bodyParamsExample: body?.example?.body_text?.[0],
    buttons: buttonsComp?.buttons ?? [],
  };
}

function authHeaders(token?: string,apiKey?:string): HeadersInit {
  return {
    Accept: "application/json",
    'D360-API-KEY':apiKey!,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

function jsonAuthHeaders(token?: string): HeadersInit {
  return {
    ...authHeaders(token),
    "Content-Type": "application/json",
  };
}

export interface GetTemplatesRequest {
  offset?: number;
  limit?: number;
}

export interface TemplatesPageInfo {
  offset: number;
  limit: number;
  count: number;
  total: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// This hits your own backend, which should attach the D360-API-KEY header
// server-side. Never send that key from the browser.
const TEMPLATES_ENDPOINT = `${API_BASE_URL}/merchant/templates`;

export function useTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [pageInfo, setPageInfo] = useState<TemplatesPageInfo | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  const loadTemplates = useCallback(
    async ({ offset = 0, limit = 20 }: GetTemplatesRequest = {}) => {
      try {
        setIsLoadingTemplates(true);
        const params = new URLSearchParams();
        params.append("limit", String(limit));
        params.append("offset", String(offset));

        const response = await fetch(
          `${TEMPLATES_ENDPOINT}?${params.toString()}`,
          {
            headers: authHeaders(user?.token,user?.whatsapp_api_key),
          }
        );

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const json = (await response.json()) as TemplatesApiResponse;
        const mapped = (json.waba_templates ?? []).map(mapWabaTemplate);

        setTemplates(mapped);
        setPageInfo({
          offset: json.offset,
          limit: json.limit,
          count: json.count,
          total: json.total,
        });

        return mapped;
      } catch (err) {
        console.error(err);
        setTemplates([]);
        setPageInfo(null);
        return [];
      } finally {
        setIsLoadingTemplates(false);
      }
    },
    [user?.token]
  );

  // Creates a template via the backend. Throws on failure so callers can
  // handle the error (e.g. show a toast) — does not touch `templates` state
  // directly since new templates start in PENDING status; call loadTemplates()
  // afterwards to refresh the list.
  const createTemplate = useCallback(
    async (payload: CreateTemplateRequest) => {
      const response = await fetch(TEMPLATES_ENDPOINT, {
        method: "POST",
        headers: jsonAuthHeaders(user?.token),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return (await response.json()) as CreateTemplateResponse;
    },
    [user?.token]
  );

  // Deletes a template by name (and optionally a specific hsm_id — 360dialog's
  // external_id — to scope the delete to a single language variant). Matches
  // the backend's DELETE /merchant/templates?name=...&hsm_id=... route.
 const deleteTemplate = useCallback(
    async (name: string) => {
      const params = new URLSearchParams();
      params.append("name", name);

      const response = await fetch(
        `${TEMPLATES_ENDPOINT}?${params.toString()}`,
        {
          method: "DELETE",
          headers: authHeaders(user?.token),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setTemplates((prev) => prev.filter((tpl) => tpl.name !== name));
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
    [user?.token]
  );

  const clear = useCallback(() => {
    setTemplates([]);
    setPageInfo(null);
  }, []);

  const hasNextPage = pageInfo
    ? pageInfo.offset + pageInfo.count < pageInfo.total
    : false;
  const hasPrevPage = pageInfo ? pageInfo.offset > 0 : false;

  return {
    templates,
    pageInfo,
    hasNextPage,
    hasPrevPage,
    isLoadingTemplates,
    loadTemplates,
    createTemplate,
    deleteTemplate,
    clear,
  };
}