import { useCallback, useState } from "react";
import { useAuth } from "./use-auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Settings {
  whatsappNumber: string;
  phoneNumberId: string;
  apiKey: string;
}

function authHeaders(token?: string) {
  return {
    Authorization: `Bearer ${token ?? ""}`,
    "Content-Type": "application/json",
  };
}

export function useSettings() {
  const { user } = useAuth();

  const [settings, setSettings] = useState<Settings>({
    whatsappNumber: "",
    phoneNumberId: "",
    apiKey: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!user?.token || !user?.installedStoreId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/merchant/settings?installedStoreId=${user.installedStoreId}`,
        {
          headers: authHeaders(user.token),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load settings");
      }

      setSettings({
        whatsappNumber: data.whatsappNumber ?? "",
        phoneNumberId: data.phoneNumberId ?? "",
        apiKey: data.apiKey ?? "",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load settings",
      );
    } finally {
      setLoading(false);
    }
  }, [user?.token, user?.installedStoreId]);

  const saveSettings = useCallback(
    async (data: Settings) => {
      if (!user?.token || !user?.installedStoreId) return false;

      setSaving(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/merchant/settings`, {
          method: "PUT",
          headers: authHeaders(user.token),
          body: JSON.stringify({
            installedStoreId: user.installedStoreId,
            ...data,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message || "Failed to connect to 360dialog",
          );
        }

        setSettings((current) => ({
          ...current,
          ...data,
          phoneNumberId: result.phoneNumberId ?? data.phoneNumberId,
        }));

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save settings",
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [user?.token, user?.installedStoreId],
  );

  return {
    settings,
    setSettings,
    loading,
    saving,
    error,
    loadSettings,
    saveSettings,
  };
}
