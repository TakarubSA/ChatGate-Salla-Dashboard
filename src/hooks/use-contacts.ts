import { useCallback, useState } from "react";
import { useAuth } from "./use-auth";

// ============================================================
// Types
// ============================================================

export interface ImportContactsResponse {
  success: boolean;
  merchantId: number;
  listId: string;
  listName: string;
  fileName: string;
  total: number;
  objectKey: string;
  contacts: string[];
}

export interface ImportContactsRequest {
  file: File;
  listName: string;
}

export interface ContactList {
  listId: string;
  listName: string;
  fileName: string;
  total?: number;
  objectKey?: string;
  lastModified?: string;
}

export interface ContactListsResponse {
  page: number;
  size: number;
  total: number;
  totalPages: number;

  // Backend may return either "lists" or "items".
  lists?: ContactList[];
  items?: ContactList[];
}

export interface ContactsResponse {
  page: number;
  size: number;
  total: number;
  totalPages: number;
  list: ContactList;
  contacts: string[];
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

// ============================================================
// API
// ============================================================

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

const CONTACTS_ENDPOINT =
  `${API_BASE_URL}/merchant/contacts`;

// ============================================================
// Headers
// ============================================================

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

// ============================================================
// Helpers
// ============================================================

/**
 * Removes duplicate phone numbers.
 *
 * Also:
 * - trims spaces
 * - removes empty values
 */
function removeDuplicates(
  contacts: string[]
): string[] {
  return Array.from(
    new Set(
      contacts
        .map((contact) =>
          contact?.trim()
        )
        .filter(Boolean)
    )
  );
}

/**
 * Parse API response safely.
 */
async function parseResponse(
  response: Response
): Promise<unknown> {
  const text =
    await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Extract useful API error message.
 */
function getErrorMessage(
  errorData: unknown,
  fallback = "Something went wrong"
): string {
  if (!errorData) {
    return fallback;
  }

  if (typeof errorData === "string") {
    return (
      errorData.trim() ||
      fallback
    );
  }

  if (
    typeof errorData === "object" &&
    errorData !== null
  ) {
    const data =
      errorData as ApiErrorResponse;

    if (
      typeof data.message === "string" &&
      data.message.trim()
    ) {
      return data.message;
    }

    if (
      typeof data.error === "string" &&
      data.error.trim()
    ) {
      return data.error;
    }

    try {
      return JSON.stringify(
        errorData
      );
    } catch {
      return fallback;
    }
  }

  return String(errorData);
}

// ============================================================
// Hook
// ============================================================

export function useContacts() {
  const { user } = useAuth();

  // ==========================================================
  // State
  // ==========================================================

  const [
    isImporting,
    setIsImporting,
  ] = useState(false);

  const [
    isLoadingLists,
    setIsLoadingLists,
  ] = useState(false);

  const [
    isLoadingContacts,
    setIsLoadingContacts,
  ] = useState(false);

  const [
    importResult,
    setImportResult,
  ] =
    useState<ImportContactsResponse | null>(
      null
    );

  const [
    contactLists,
    setContactLists,
  ] = useState<ContactList[]>([]);

  const [
    contacts,
    setContacts,
  ] = useState<string[]>([]);

  // ==========================================================
  // Import contacts
  // ==========================================================

  const importContacts =
    useCallback(
      async ({
        file,
        listName,
      }: ImportContactsRequest) => {
        // ----------------------------------------------------
        // Validate file
        // ----------------------------------------------------

        if (!file) {
          throw new Error(
            "File is required"
          );
        }

        // ----------------------------------------------------
        // Validate list name
        // ----------------------------------------------------

        const trimmedListName =
          listName.trim();

        if (!trimmedListName) {
          throw new Error(
            "List name is required"
          );
        }

        // ----------------------------------------------------
        // Validate authentication
        // ----------------------------------------------------

        if (!user?.token) {
          throw new Error(
            "Authentication required"
          );
        }

        // ----------------------------------------------------
        // Validate merchant
        // ----------------------------------------------------

        if (!user?.merchantId) {
          throw new Error(
            "Merchant ID is required"
          );
        }

        // ----------------------------------------------------
        // Validate extension
        // ----------------------------------------------------

        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase();

        const supportedExtensions = [
          "xlsx",
          "xls",
          "csv",
        ];

        if (
          !extension ||
          !supportedExtensions.includes(
            extension
          )
        ) {
          throw new Error(
            "Unsupported file type. Please upload an Excel or CSV file."
          );
        }

        try {
          setIsImporting(true);

          // --------------------------------------------------
          // FormData
          // --------------------------------------------------

          const formData =
            new FormData();

          formData.append(
            "file",
            file,
            file.name
          );

          formData.append(
            "listName",
            trimmedListName
          );

          // --------------------------------------------------
          // Query parameters
          // --------------------------------------------------

          const params =
            new URLSearchParams();

          params.set(
            "merchantId",
            String(
              user.merchantId
            )
          );

          // --------------------------------------------------
          // Request
          // --------------------------------------------------

          const response =
            await fetch(
              `${CONTACTS_ENDPOINT}/import?${params.toString()}`,
              {
                method: "POST",

                headers:
                  authHeaders(
                    user.token,
                    user.whatsapp_api_key
                  ),

                // IMPORTANT:
                // Do not set Content-Type manually.
                //
                // Browser will generate:
                // multipart/form-data;
                // boundary=...
                body: formData,
              }
            );

          // --------------------------------------------------
          // Parse response
          // --------------------------------------------------

          const data =
            await parseResponse(
              response
            );

          // --------------------------------------------------
          // Handle API errors
          // --------------------------------------------------

          if (!response.ok) {
            throw new Error(
              getErrorMessage(
                data,
                "Failed to import contacts"
              )
            );
          }

          // --------------------------------------------------
          // Validate response
          // --------------------------------------------------

          if (
            !data ||
            typeof data !==
              "object"
          ) {
            throw new Error(
              "Empty response from server"
            );
          }

          // --------------------------------------------------
          // Server response
          // --------------------------------------------------

          const serverResult =
            data as ImportContactsResponse;

          // --------------------------------------------------
          // Remove duplicates
          // --------------------------------------------------

          const result: ImportContactsResponse =
            {
              ...serverResult,

              contacts:
                removeDuplicates(
                  Array.isArray(
                    serverResult.contacts
                  )
                    ? serverResult.contacts
                    : []
                ),
            };

          // --------------------------------------------------
          // Save result
          // --------------------------------------------------

          setImportResult(
            result
          );

          setContacts(
            result.contacts
          );

          return result;
        } catch (error) {
          console.error(
            "Import contacts error:",
            error
          );

          throw error;
        } finally {
          setIsImporting(false);
        }
      },
      [
        user?.token,
        user?.merchantId,
        user?.whatsapp_api_key,
      ]
    );

  // ==========================================================
  // Get contact count for a saved list
  // ==========================================================

  const getContactCount =
    useCallback(
      async (
        listId: string
      ): Promise<number> => {
        if (!listId?.trim()) {
          return 0;
        }

        if (!user?.token) {
          throw new Error(
            "Authentication required"
          );
        }

        if (!user?.merchantId) {
          throw new Error(
            "Merchant ID is required"
          );
        }

        const params =
          new URLSearchParams();

        params.set(
          "merchantId",
          String(user.merchantId)
        );

        params.set("page", "1");
        params.set("size", "1");

        const response =
          await fetch(
            `${CONTACTS_ENDPOINT}/lists/${encodeURIComponent(
              listId
            )}?${params.toString()}`,
            {
              method: "GET",
              headers:
                authHeaders(
                  user.token,
                  user.whatsapp_api_key
                ),
            }
          );

        const data =
          await parseResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              data,
              "Failed to get contact count"
            )
          );
        }

        if (
          !data ||
          typeof data !== "object"
        ) {
          return 0;
        }

        const result =
          data as Partial<ContactsResponse>;

        return Number.isFinite(
          result.total
        )
          ? Number(result.total)
          : 0;
      },
      [
        user?.token,
        user?.merchantId,
        user?.whatsapp_api_key,
      ]
    );

  // ==========================================================
  // Get contact lists
  // ==========================================================

  const getContactLists =
    useCallback(
      async (
        page = 1,
        size = 10
      ): Promise<ContactListsResponse> => {
        // ----------------------------------------------------
        // Authentication
        // ----------------------------------------------------

        if (!user?.token) {
          throw new Error(
            "Authentication required"
          );
        }

        // ----------------------------------------------------
        // Merchant
        // ----------------------------------------------------

        if (!user?.merchantId) {
          throw new Error(
            "Merchant ID is required"
          );
        }

        try {
          setIsLoadingLists(
            true
          );

          // --------------------------------------------------
          // Query parameters
          // --------------------------------------------------

          const params =
            new URLSearchParams();

          params.set(
            "merchantId",
            String(
              user.merchantId
            )
          );

          params.set(
            "page",
            String(
              Math.max(
                1,
                page
              )
            )
          );

          params.set(
            "size",
            String(
              Math.max(
                1,
                size
              )
            )
          );

          // --------------------------------------------------
          // Request
          // --------------------------------------------------

          const response =
            await fetch(
              `${CONTACTS_ENDPOINT}/lists?${params.toString()}`,
              {
                method: "GET",

                headers:
                  authHeaders(
                    user.token,
                    user.whatsapp_api_key
                  ),
              }
            );

          // --------------------------------------------------
          // Parse response
          // --------------------------------------------------

          const data =
            await parseResponse(
              response
            );

          // --------------------------------------------------
          // Error
          // --------------------------------------------------

          if (!response.ok) {
            throw new Error(
              getErrorMessage(
                data,
                "Failed to load contact lists"
              )
            );
          }

          // --------------------------------------------------
          // Validate
          // --------------------------------------------------

          if (
            !data ||
            typeof data !==
              "object"
          ) {
            throw new Error(
              "Empty response from server"
            );
          }

          // --------------------------------------------------
          // Server result
          // --------------------------------------------------

          const serverResult =
            data as ContactListsResponse;

          // --------------------------------------------------
          // IMPORTANT
          //
          // Support both:
          //
          // {
          //   lists: [...]
          // }
          //
          // and:
          //
          // {
          //   items: [...]
          // }
          // --------------------------------------------------

          const lists =
            Array.isArray(
              serverResult.lists
            )
              ? serverResult.lists
              : Array.isArray(
                  serverResult.items
                )
                ? serverResult.items
                : [];

          // --------------------------------------------------
          // Load the real contact count for each list.
          //
          // We request only 1 contact from the backend.
          // The backend still returns the full "total".
          // --------------------------------------------------

          const listsWithCounts =
            await Promise.all(
              lists.map(
                async (list) => {
                  try {
                    const total =
                      await getContactCount(
                        list.listId
                      );

                    return {
                      ...list,
                      total,
                    };
                  } catch (error) {
                    console.error(
                      `Failed to get contact count for list ${list.listId}:`,
                      error
                    );

                    return {
                      ...list,
                      total: 0,
                    };
                  }
                }
              )
            );

          // --------------------------------------------------
          // Normalize result
          // --------------------------------------------------

          const result: ContactListsResponse =
            {
              ...serverResult,
              lists: listsWithCounts,
            };

          // --------------------------------------------------
          // Save lists
          // --------------------------------------------------

          setContactLists(
            listsWithCounts
          );

          return result;
        } catch (error) {
          console.error(
            "Get contact lists error:",
            error
          );

          throw error;
        } finally {
          setIsLoadingLists(
            false
          );
        }
      },
      [
        user?.token,
        user?.merchantId,
        user?.whatsapp_api_key,
        getContactCount,
      ]
    );

  // ==========================================================
  // Get contacts from a saved list
  // ==========================================================

  const getContacts =
    useCallback(
      async (
        listId: string,
        page = 1,
        size = 100
      ): Promise<ContactsResponse> => {
        // ----------------------------------------------------
        // Validate list ID
        // ----------------------------------------------------

        if (!listId?.trim()) {
          throw new Error(
            "Contact list ID is required"
          );
        }

        // ----------------------------------------------------
        // Authentication
        // ----------------------------------------------------

        if (!user?.token) {
          throw new Error(
            "Authentication required"
          );
        }

        // ----------------------------------------------------
        // Merchant
        // ----------------------------------------------------

        if (!user?.merchantId) {
          throw new Error(
            "Merchant ID is required"
          );
        }

        try {
          setIsLoadingContacts(
            true
          );

          // --------------------------------------------------
          // Query parameters
          // --------------------------------------------------

          const params =
            new URLSearchParams();

          params.set(
            "merchantId",
            String(
              user.merchantId
            )
          );

          params.set(
            "page",
            String(
              Math.max(
                1,
                page
              )
            )
          );

          params.set(
            "size",
            String(
              Math.max(
                1,
                size
              )
            )
          );

          // --------------------------------------------------
          // Request
          // --------------------------------------------------

          const response =
            await fetch(
              `${CONTACTS_ENDPOINT}/lists/${encodeURIComponent(
                listId
              )}?${params.toString()}`,
              {
                method: "GET",

                headers:
                  authHeaders(
                    user.token,
                    user.whatsapp_api_key
                  ),
              }
            );

          // --------------------------------------------------
          // Parse
          // --------------------------------------------------

          const data =
            await parseResponse(
              response
            );

          // --------------------------------------------------
          // Error
          // --------------------------------------------------

          if (!response.ok) {
            throw new Error(
              getErrorMessage(
                data,
                "Failed to load contacts"
              )
            );
          }

          // --------------------------------------------------
          // Validate
          // --------------------------------------------------

          if (
            !data ||
            typeof data !==
              "object"
          ) {
            throw new Error(
              "Empty response from server"
            );
          }

          // --------------------------------------------------
          // Server result
          // --------------------------------------------------

          const serverResult =
            data as ContactsResponse;

          // --------------------------------------------------
          // Remove duplicates
          // --------------------------------------------------

          const result: ContactsResponse =
            {
              ...serverResult,

              contacts:
                removeDuplicates(
                  Array.isArray(
                    serverResult.contacts
                  )
                    ? serverResult.contacts
                    : []
                ),
            };

          // --------------------------------------------------
          // Save contacts
          // --------------------------------------------------

          setContacts(
            result.contacts
          );

          return result;
        } catch (error) {
          console.error(
            "Get contacts error:",
            error
          );

          throw error;
        } finally {
          setIsLoadingContacts(
            false
          );
        }
      },
      [
        user?.token,
        user?.merchantId,
        user?.whatsapp_api_key,
      ]
    );

  // ==========================================================
  // Clear import result
  // ==========================================================

  const clearImportResult =
    useCallback(() => {
      setImportResult(
        null
      );

      setContacts([]);
    }, []);

  // ==========================================================
  // Clear contacts
  // ==========================================================

  const clearContacts =
    useCallback(() => {
      setContacts([]);
    }, []);

  // ==========================================================
  // Return
  // ==========================================================

  return {
    // --------------------------------------------------------
    // Import
    // --------------------------------------------------------

    importContacts,
    isImporting,
    importResult,
    clearImportResult,

    // --------------------------------------------------------
    // Contact lists
    // --------------------------------------------------------

    getContactLists,
    getContactCount,
    contactLists,
    isLoadingLists,

    // --------------------------------------------------------
    // Contacts
    // --------------------------------------------------------

    getContacts,
    contacts,
    isLoadingContacts,
    clearContacts,
  };
}