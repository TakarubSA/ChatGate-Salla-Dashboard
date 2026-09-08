import { useEffect, useState } from "react";
import { Eye, EyeOff, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/use-language";
import { useSettings } from "@/hooks/use-settings";

export default function SettingsPage() {
  const { t } = useLanguage();
  const settingsT = t.settings;

  const {
    settings,
    setSettings,
    loading,
    saving,
    error,
    loadSettings,
    saveSettings,
  } = useSettings();

  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateField = (
    field: keyof typeof settings,
    value: string,
  ) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    const success = await saveSettings(settings);
    setSaved(success);
  };

  return (
    <div className="animate-in space-y-8 fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {settingsT.title}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {settingsT.description}
        </p>
      </div>

      <div className="max-w-2xl overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-base font-semibold">{settingsT.whatsapp}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {settingsT.whatsappDescription}
          </p>
        </div>

        <div className="space-y-5 p-6">
          <div className="space-y-2">
            <label htmlFor="whatsapp-number" className="text-sm font-medium">
              {settingsT.whatsappNumber}
            </label>
            <Input
              id="whatsapp-number"
              type="tel"
              value={settings.whatsappNumber}
              onChange={(e) =>
                updateField("whatsappNumber", e.target.value)
              }
              placeholder={settingsT.whatsappNumberPlaceholder}
              disabled={loading || saving}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone-number-id" className="text-sm font-medium">
              {settingsT.phoneNumberId}
            </label>
            <Input
              id="phone-number-id"
              value={settings.phoneNumberId}
              onChange={(e) =>
                updateField("phoneNumberId", e.target.value)
              }
              placeholder={settingsT.phoneNumberIdPlaceholder}
              disabled={loading || saving}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="api-key" className="text-sm font-medium">
              {settingsT.apiKey}
            </label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={settings.apiKey}
                onChange={(e) => updateField("apiKey", e.target.value)}
                placeholder={settingsT.apiKeyPlaceholder}
                className="pr-10"
                disabled={loading || saving}
              />
              <button
                type="button"
                onClick={() => setShowApiKey((value) => !value)}
                disabled={loading || saving}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                aria-label={
                  showApiKey
                    ? settingsT.hideApiKey
                    : settingsT.showApiKey
                }
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {saved && !error && (
            <p className="text-sm text-green-600">
              {settingsT.saved}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={loading || saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? settingsT.saving : settingsT.save}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
