import { useCallback, useState } from "react";
import { useAuth } from "./use-auth";

// =========================================================
// RAW SHAPE RETURNED BY /merchant/templates
// =========================================================

export interface TemplateExample {
  header_handle?: string[];
  body_text?: string[][];
}

export interface TemplateHeaderComponent {
  type: "HEADER";
  format:
    | "TEXT"
    | "IMAGE"
    | "VIDEO"
    | "DOCUMENT"
    | "LOCATION";

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
  type: string;
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

// =========================================================
// FRIENDLY UI SHAPE
// =========================================================

export interface MessageTemplate {
  id: string;

  externalId: string;

  name: string;

  category: string;

  language: string;

  status: string;

  createdAt: string;

  modifiedAt: string;

  headerText?: string;

  headerImageUrl?: string;

  body: string;

  bodyParamsExample?: string[];

  buttons: TemplateButtonItem[];
}

// =========================================================
// CREATE TEMPLATE
// =========================================================

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

// =========================================================
// HELPERS
// =========================================================

function findComponent<
  T extends TemplateComponent["type"]
>(
  components: TemplateComponent[],
  type: T
) {
  return components.find(
    (component) =>
      component.type === type
  );
}

// =========================================================
// MAP WABA TEMPLATE
// =========================================================

function mapWabaTemplate(
  raw: WabaTemplate
): MessageTemplate {
  const header = findComponent(
    raw.components,
    "HEADER"
  ) as
    | TemplateHeaderComponent
    | undefined;

  const body = findComponent(
    raw.components,
    "BODY"
  ) as
    | TemplateBodyComponent
    | undefined;

  const buttonsComp = findComponent(
    raw.components,
    "BUTTONS"
  ) as
    | TemplateButtonsComponent
    | undefined;

  return {
    id: raw.id,

    externalId:
      raw.external_id,

    name: raw.name,

    category: raw.category,

    language: raw.language,

    status: raw.status,

    createdAt:
      raw.created_at,

    modifiedAt:
      raw.modified_at,

    headerText:
      header?.format === "TEXT"
        ? header.text
        : undefined,

    headerImageUrl:
      header?.format === "IMAGE"
        ? header.example
            ?.header_handle?.[0]
        : undefined,

    body:
      body?.text ?? "",

    bodyParamsExample:
      body?.example?.body_text?.[0],

    buttons:
      buttonsComp?.buttons ?? [],
  };
}

// =========================================================
// AUTH HEADERS
// =========================================================

function authHeaders(
  token?: string,
  apiKey?: string
): HeadersInit {
  return {
    Accept:
      "application/json",

    /*
     * 360dialog API key
     */
    "D360-API-KEY":
      apiKey ?? "",

    /*
     * Your application auth
     */
    ...(token && {
      Authorization:
        `Bearer ${token}`,
    }),
  };
}

function jsonAuthHeaders(
  token?: string,
  apiKey?: string
): HeadersInit {
  return {
    ...authHeaders(
      token,
      apiKey
    ),

    "Content-Type":
      "application/json",
  };
}

// =========================================================
// PAGINATION
// =========================================================

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

// =========================================================
// API
// =========================================================

const API_BASE_URL =
  import.meta.env
    .VITE_API_BASE_URL;

const TEMPLATES_ENDPOINT =
  `${API_BASE_URL}/merchant/templates`;

// =========================================================
// MEDIA HEADER NORMALIZER
// =========================================================

/**
 * Makes absolutely sure that a media header
 * contains the example expected by 360dialog.
 *
 * This protects us from accidentally sending:
 *
 * {
 *   type: "HEADER",
 *   format: "IMAGE"
 * }
 *
 * without:
 *
 * {
 *   example: {
 *     header_handle: [...]
 *   }
 * }
 */
function normalizeTemplateComponents(
  components: TemplateComponent[]
): TemplateComponent[] {
  return components.map(
    (component) => {
      /*
       * -----------------------------------------------------
       * HEADER
       * -----------------------------------------------------
       */

      if (
        component.type ===
        "HEADER"
      ) {
        /*
         * IMAGE / VIDEO / DOCUMENT
         */
        if (
          component.format ===
            "IMAGE" ||
          component.format ===
            "VIDEO" ||
          component.format ===
            "DOCUMENT"
        ) {
          const existingHandle =
            component.example
              ?.header_handle?.[0]
              ?.trim();

          /*
           * If example already exists,
           * normalize it.
           */
          if (existingHandle) {
            return {
              ...component,

              example: {
                header_handle: [
                  existingHandle,
                ],
              },
            };
          }

          /*
           * IMPORTANT:
           *
           * We cannot invent a media handle here.
           *
           * If the builder did not provide one,
           * throw BEFORE the request reaches Meta.
           */
          throw new Error(
            `The ${component.format} header is missing a media sample.`
          );
        }
      }

      return component;
    }
  );
}

// =========================================================
// DEBUG PAYLOAD
// =========================================================

function logCreatePayload(
  payload: CreateTemplateRequest
) {
  console.log(
    "=========================================="
  );

  console.log(
    "WHATSAPP TEMPLATE CREATE PAYLOAD"
  );

  console.log(
    JSON.stringify(
      payload,
      null,
      2
    )
  );

  console.log(
    "=========================================="
  );
}

// =========================================================
// HOOK
// =========================================================

export function useTemplates() {
  const { user } =
    useAuth();

  const [
    templates,
    setTemplates,
  ] = useState<
    MessageTemplate[]
  >([]);

  const [
    pageInfo,
    setPageInfo,
  ] =
    useState<TemplatesPageInfo | null>(
      null
    );

  const [
    isLoadingTemplates,
    setIsLoadingTemplates,
  ] = useState(false);

  // =======================================================
  // GET TEMPLATES
  // =======================================================

  const loadTemplates =
    useCallback(
      async ({
        offset = 0,
        limit = 20,
      }: GetTemplatesRequest = {}) => {
        try {
          setIsLoadingTemplates(
            true
          );

          const params =
            new URLSearchParams();

          params.set(
            "limit",
            String(limit)
          );

          params.set(
            "offset",
            String(offset)
          );

          const url =
            `${TEMPLATES_ENDPOINT}?${params.toString()}`;

          console.log(
            "Loading templates:",
            url
          );

          const response =
            await fetch(url, {
              headers:
                authHeaders(
                  user?.token,
                  user?.whatsapp_api_key
                ),
            });

          if (!response.ok) {
            throw new Error(
              await response.text()
            );
          }

          const json =
            (await response.json()) as TemplatesApiResponse;

          const mapped =
            (
              json.waba_templates ??
              []
            ).map(
              mapWabaTemplate
            );

          setTemplates(
            mapped
          );

          setPageInfo({
            offset:
              json.offset,

            limit:
              json.limit,

            count:
              json.count,

            total:
              json.total,
          });

          return mapped;
        } catch (err) {
          console.error(
            "Failed to load templates:",
            err
          );

          setTemplates([]);

          setPageInfo(null);

          return [];
        } finally {
          setIsLoadingTemplates(
            false
          );
        }
      },
      [
        user?.token,
        user?.whatsapp_api_key,
      ]
    );


    const uploadTemplateMedia = useCallback(
  async (url: string) => {
    const response = await fetch(
      `${TEMPLATES_ENDPOINT}/upload-media`,
      {
        method: "POST",

        headers: jsonAuthHeaders(
          user?.token,
          user?.whatsapp_api_key
        ),

        body: JSON.stringify({
          url,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();

      throw new Error(error);
    }

    const result = await response.json();

    return result.handle as string;
  },
  [
    user?.token,
    user?.whatsapp_api_key,
  ]
);

  // =======================================================
  // CREATE TEMPLATE
  // =======================================================

  const createTemplate =
    useCallback(
      async (
        payload: CreateTemplateRequest
      ) => {
        /*
         * ===================================================
         * NORMALIZE COMPONENTS
         * ===================================================
         *
         * This is the important part.
         *
         * Before sending anything to the backend,
         * verify that IMAGE / VIDEO / DOCUMENT headers
         * actually have example.header_handle.
         */

        const normalizedComponents =
          normalizeTemplateComponents(
            payload.components
          );

        const normalizedPayload: CreateTemplateRequest =
          {
            ...payload,

            components:
              normalizedComponents,
          };

        /*
         * ===================================================
         * LOG EXACT PAYLOAD
         * ===================================================
         */

        logCreatePayload(
          normalizedPayload
        );

        /*
         * ===================================================
         * EXTRA IMAGE CHECK
         * ===================================================
         */

        const imageHeader =
          normalizedPayload.components.find(
            (
              component
            ) =>
              component.type ===
                "HEADER" &&
              component.format ===
                "IMAGE"
          ) as
            | TemplateHeaderComponent
            | undefined;

        if (imageHeader) {
          console.log(
            "IMAGE HEADER BEING SENT:"
          );

          console.log(
            JSON.stringify(
              imageHeader,
              null,
              2
            )
          );

          const handle =
            imageHeader
              .example
              ?.header_handle?.[0];

          if (!handle) {
            throw new Error(
              "IMAGE header is missing example.header_handle."
            );
          }
        }

        /*
         * ===================================================
         * SEND REQUEST
         * ===================================================
         */

        const response =
          await fetch(
            TEMPLATES_ENDPOINT,
            {
              method: "POST",

              headers:
                jsonAuthHeaders(
                  user?.token,
                  user?.whatsapp_api_key
                ),

              body: JSON.stringify(
                normalizedPayload
              ),
            }
          );

        /*
         * ===================================================
         * HANDLE ERRORS
         * ===================================================
         */

        if (!response.ok) {
          const errorText =
            await response.text();

          console.error(
            "Template creation failed:"
          );

          console.error(
            errorText
          );

          throw new Error(
            errorText
          );
        }

        /*
         * ===================================================
         * RESPONSE
         * ===================================================
         */

        const result =
          (await response.json()) as CreateTemplateResponse;

        console.log(
          "Template created successfully:",
          result
        );

        return result;
      },
      [
        user?.token,
        user?.whatsapp_api_key,
      ]
    );

  // =======================================================
  // DELETE TEMPLATE
  // =======================================================

  const deleteTemplate =
    useCallback(
      async (
        name: string
      ) => {
        const params =
          new URLSearchParams();

        params.set(
          "name",
          name
        );

        const url =
          `${TEMPLATES_ENDPOINT}?${params.toString()}`;

        console.log(
          "Deleting template:",
          url
        );

        const response =
          await fetch(url, {
            method: "DELETE",

            headers:
              authHeaders(
                user?.token,
                user?.whatsapp_api_key
              ),
          });

        if (!response.ok) {
          const errorText =
            await response.text();

          console.error(
            "Failed to delete template:",
            errorText
          );

          throw new Error(
            errorText
          );
        }

        /*
         * Remove locally.
         */
        setTemplates(
          (prev) =>
            prev.filter(
              (tpl) =>
                tpl.name !==
                name
            )
        );

        /*
         * Update pagination.
         */
        setPageInfo(
          (prev) =>
            prev
              ? {
                  ...prev,

                  count:
                    Math.max(
                      prev.count -
                        1,
                      0
                    ),

                  total:
                    Math.max(
                      prev.total -
                        1,
                      0
                    ),
                }
              : prev
        );
      },
      [
        user?.token,
        user?.whatsapp_api_key,
      ]
    );

  // =======================================================
  // CLEAR
  // =======================================================

  const clear =
    useCallback(() => {
      setTemplates([]);

      setPageInfo(null);
    }, []);

  // =======================================================
  // PAGINATION
  // =======================================================

  const hasNextPage =
    pageInfo !== null &&
    pageInfo.offset +
        pageInfo.count <
      pageInfo.total;

  const hasPrevPage =
    pageInfo !== null &&
    pageInfo.offset > 0;

  // =======================================================
  // RETURN
  // =======================================================

return {
  templates,
  pageInfo,
  hasNextPage,
  hasPrevPage,
  isLoadingTemplates,
  loadTemplates,
  createTemplate,
  uploadTemplateMedia,
  deleteTemplate,
  clear,
};
}