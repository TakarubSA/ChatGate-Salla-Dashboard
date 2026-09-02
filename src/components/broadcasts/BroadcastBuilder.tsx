import { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { useContacts } from "@/hooks/use-contacts";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Loader2,
  Send,
  Smartphone,
  Clock,
  Search,
  Users,
  Check,
  Eye,
  X,
} from "lucide-react";
import { useTemplates } from "@/hooks/use-template";

// ============================================================
// Types
// ============================================================

type TemplateButton = {
  type: string;
  text: string;
  url?: string;
  phone_number?: string;
};

export type BroadcastTemplate = {
  id: string;
  name: string;
  language: string;
  body: string;
  headerText?: string | null;
  headerImageUrl?: string | null;
  bodyParamsExample?: string[] | null;
  buttons: TemplateButton[];
};

export type BroadcastFormValues = {
  campaignName: string;
  contactListIds: string[];
  variables: string[];
  schedule: boolean;
  scheduledAt?: string;
};

export type BroadcastSubmitValues = BroadcastFormValues & {
  template: BroadcastTemplate;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  /**
   * If provided, this template is used directly.
   *
   * If null/undefined and fetchTemplate is true,
   * the user can choose a template inside the builder.
   */
  template?: BroadcastTemplate | null;

  /**
   * Allows the builder to fetch and select a template
   * when one wasn't supplied by the parent.
   */
  fetchTemplate?: boolean;

  onSubmit?: (
    values: BroadcastSubmitValues,
  ) => Promise<void>;

  onTest?: (values: {
    phone: string;
    variables: string[];
    template: BroadcastTemplate;
  }) => Promise<void>;

  isSubmitting?: boolean;
  isTesting?: boolean;
};

// ============================================================
// Component
// ============================================================

export function BroadcastBuilder({
  open,
  onOpenChange,
  template,
  fetchTemplate = false,
  onSubmit,
  onTest,
  isSubmitting = false,
  isTesting = false,
}: Props) {
  const {
    getContactLists,
    contactLists,
    isLoadingLists,
    getContacts,
    contacts,
    isLoadingContacts,
  } = useContacts();

  const {
    loadTemplates,
    templates,
    isLoadingTemplates,
  } = useTemplates();

  // ==========================================================
  // State
  // ==========================================================

  const [selectedTemplate, setSelectedTemplate] =
    useState<BroadcastTemplate | null>(
      template ?? null,
    );

  const [campaignName, setCampaignName] = useState("");

  const [selectedListIds, setSelectedListIds] =
    useState<string[]>([]);

  const [search, setSearch] = useState("");

  const [variables, setVariables] =
    useState<string[]>([]);

  const [testPhone, setTestPhone] =
    useState("");

  const [schedule, setSchedule] =
    useState(false);

  const [scheduledAt, setScheduledAt] =
    useState("");

  const [previewListId, setPreviewListId] =
    useState<string | null>(null);

  // ==========================================================
  // Load contact lists
  // ==========================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    getContactLists(1, 100).catch((error) => {
      console.error(
        "Failed to fetch contact lists:",
        error,
      );
    });
  }, [open, getContactLists]);

  // ==========================================================
  // Load templates when needed
  // ==========================================================

  useEffect(() => {
    if (!open || template || !fetchTemplate) {
      return;
    }

    loadTemplates().catch((error) => {
      console.error(
        "Failed to fetch templates:",
        error,
      );
    });
  }, [
    open,
    template,
    fetchTemplate,
    loadTemplates,
  ]);

  // ==========================================================
  // Sync supplied template
  // ==========================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    if (template) {
      setSelectedTemplate(template);
    } else if (!fetchTemplate) {
      setSelectedTemplate(null);
    }
  }, [
    template,
    fetchTemplate,
    open,
  ]);

  // ==========================================================
  // Initialize selected template
  // ==========================================================

  useEffect(() => {
    if (!open || !selectedTemplate) {
      return;
    }

    setCampaignName(selectedTemplate.name);
    setSelectedListIds([]);
    setSearch("");
    setTestPhone("");
    setSchedule(false);
    setScheduledAt("");
    setPreviewListId(null);

    const variableMatches =
      selectedTemplate.body.match(
        /\{\{(\d+)\}\}/g,
      );

    const variableCount = variableMatches
      ? new Set(variableMatches).size
      : 0;

    setVariables(
      Array.from(
        {
          length: variableCount,
        },
        () => "",
      ),
    );
  }, [
    selectedTemplate,
    open,
  ]);

  // ==========================================================
  // Template selection
  // ==========================================================

  const handleTemplateSelect = (
    value: BroadcastTemplate,
  ) => {
    setSelectedTemplate(value);
  };

  // ==========================================================
  // Filter contact lists
  // ==========================================================

  const filteredContactLists = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return contactLists;
    }

    return contactLists.filter((list) =>
      list.listName
        .toLowerCase()
        .includes(query),
    );
  }, [
    contactLists,
    search,
  ]);

  // ==========================================================
  // Selected lists
  // ==========================================================

  const selectedLists = useMemo(() => {
    return contactLists.filter((list) =>
      selectedListIds.includes(
        list.listId,
      ),
    );
  }, [
    contactLists,
    selectedListIds,
  ]);

  // ==========================================================
  // Total recipients
  // ==========================================================

  const totalRecipients = useMemo(() => {
    return selectedLists.reduce(
      (total, list) =>
        total +
        Number(list.total || 0),
      0,
    );
  }, [selectedLists]);

  // ==========================================================
  // Preview body
  // ==========================================================

  const previewBody = useMemo(() => {
    if (!selectedTemplate) {
      return "";
    }

    return selectedTemplate.body.replace(
      /\{\{(\d+)\}\}/g,
      (_, number) => {
        const index =
          Number(number) - 1;

        return (
          variables[index]?.trim() ||
          `{{${number}}}`
        );
      },
    );
  }, [
    selectedTemplate,
    variables,
  ]);

  // ==========================================================
  // Toggle list
  // ==========================================================

  const toggleList = (
    listId: string,
  ) => {
    setSelectedListIds((current) => {
      if (current.includes(listId)) {
        return current.filter(
          (id) => id !== listId,
        );
      }

      return [
        ...current,
        listId,
      ];
    });
  };

  // ==========================================================
  // Select all filtered
  // ==========================================================

  const selectAllFiltered = () => {
    const filteredIds =
      filteredContactLists.map(
        (list) => list.listId,
      );

    setSelectedListIds((current) =>
      Array.from(
        new Set([
          ...current,
          ...filteredIds,
        ]),
      ),
    );
  };

  // ==========================================================
  // Clear selection
  // ==========================================================

  const clearSelection = () => {
    setSelectedListIds([]);
  };

  // ==========================================================
  // Preview contacts
  // ==========================================================

  const handlePreviewContacts = async (
    listId: string,
  ) => {
    try {
      setPreviewListId(listId);

      await getContacts(
        listId,
        1,
        100,
      );
    } catch (error) {
      console.error(
        "Failed to load contacts:",
        error,
      );
    }
  };

  // ==========================================================
  // Variable change
  // ==========================================================

  const handleVariableChange = (
    index: number,
    value: string,
  ) => {
    setVariables((current) => {
      const next = [...current];

      next[index] = value;

      return next;
    });
  };

  // ==========================================================
  // Test
  // ==========================================================

  const handleTest = async () => {
    if (
      !selectedTemplate ||
      !testPhone.trim() ||
      isTesting
    ) {
      return;
    }

    await onTest?.({
      phone: testPhone.trim(),
      variables,
      template: selectedTemplate,
    });
  };

  // ==========================================================
  // Submit
  // ==========================================================

  const handleSubmit = async () => {
    if (
      !selectedTemplate ||
      !campaignName.trim() ||
      selectedListIds.length === 0
    ) {
      return;
    }

    if (
      schedule &&
      !scheduledAt
    ) {
      return;
    }

    const payload: BroadcastSubmitValues = {
      campaignName:
        campaignName.trim(),

      contactListIds:
        selectedListIds,

      variables,

      schedule,

      scheduledAt: schedule
        ? scheduledAt
        : undefined,

      template:
        selectedTemplate,
    };

    await onSubmit?.(payload);
  };

  // ==========================================================
  // Validation
  // ==========================================================

  const canSubmit =
    !isSubmitting &&
    !isLoadingLists &&
    Boolean(selectedTemplate) &&
    Boolean(campaignName.trim()) &&
    selectedListIds.length > 0 &&
    totalRecipients > 0 &&
    (!schedule ||
      Boolean(scheduledAt));

  // ==========================================================
  // No template selected
  // ==========================================================

  const needsTemplate =
    !selectedTemplate &&
    fetchTemplate;

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (
          !isSubmitting &&
          !isTesting
        ) {
          onOpenChange(value);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            Create Campaign
          </DialogTitle>

          <DialogDescription>
            Configure your WhatsApp campaign before sending it.
          </DialogDescription>
        </DialogHeader>

        {/* ================================================= */}
        {/* Template selection */}
        {/* ================================================= */}

        {needsTemplate && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">
                Select template
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Choose the WhatsApp template you want to use.
              </p>
            </div>

            {isLoadingTemplates ? (
              <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading templates...
                </div>
              </div>
            ) : templates.length === 0 ? (
              <div className="rounded-xl border border-border p-6 text-center">
                <p className="text-sm font-medium">
                  No templates available
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Create an approved WhatsApp template before creating a campaign.
                </p>
              </div>
            ) : (
              <div className="max-h-[280px] overflow-y-auto rounded-xl border border-border">
                {templates.map(
                  (item) => {
                    const current =
                      selectedTemplate?.id ===
                      item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          handleTemplateSelect(
                            item as BroadcastTemplate,
                          )
                        }
                        className={[
                          "flex w-full items-center justify-between gap-4 border-b border-border p-4 text-left last:border-b-0",
                          "transition-colors hover:bg-muted/40",
                          current
                            ? "bg-primary/5"
                            : "",
                        ].join(" ")}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {item.name}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.language}
                          </p>
                        </div>

                        {current && (
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                        )}
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================= */}
        {/* Builder */}
        {/* ================================================= */}

        {selectedTemplate && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* ================================================= */}
            {/* LEFT */}
            {/* ================================================= */}

            <div className="space-y-6">
              {/* Campaign name */}

              <div className="space-y-2">
                <div>
                  <label
                    htmlFor="campaign-name"
                    className="text-sm font-medium"
                  >
                    Campaign name
                  </label>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Give this campaign a name so you can identify it later.
                  </p>
                </div>

                <Input
                  id="campaign-name"
                  value={campaignName}
                  onChange={(event) =>
                    setCampaignName(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. September Promotion"
                  maxLength={255}
                  disabled={isSubmitting}
                />
              </div>

              {/* Template */}

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">
                  Template
                </p>

                <div className="mt-1 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {selectedTemplate.name}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedTemplate.language}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-background p-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {fetchTemplate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      setSelectedTemplate(
                        null,
                      )
                    }
                    disabled={isSubmitting}
                  >
                    Change template
                  </Button>
                )}
              </div>

              {/* Contact lists */}

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <label className="text-sm font-medium">
                      Contact lists
                    </label>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Choose one or more lists.
                    </p>
                  </div>

                  {selectedListIds.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={
                        clearSelection
                      }
                      disabled={
                        isSubmitting
                      }
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Search */}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search contact lists..."
                    className="pl-9"
                    disabled={
                      isLoadingLists ||
                      isSubmitting
                    }
                  />
                </div>

                {/* Loading */}

                {isLoadingLists && (
                  <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-border">
                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />

                      <span>
                        Loading contact lists...
                      </span>
                    </div>
                  </div>
                )}

                {/* Lists */}

                {!isLoadingLists && (
                  <div className="overflow-hidden rounded-xl border border-border">
                    {filteredContactLists.length >
                      0 && (
                      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
                        <span className="text-xs text-muted-foreground">
                          {
                            selectedListIds.length
                          }{" "}
                          selected
                        </span>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={
                            selectAllFiltered
                          }
                          disabled={
                            isSubmitting
                          }
                        >
                          Select all
                        </Button>
                      </div>
                    )}

                    {/* Empty */}

                    {contactLists.length ===
                      0 && (
                      <div className="flex min-h-[220px] flex-col items-center justify-center p-6 text-center">
                        <div className="mb-3 rounded-full bg-muted p-3">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>

                        <p className="text-sm font-medium">
                          No contact lists
                        </p>

                        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                          Create a contact list before creating a campaign.
                        </p>
                      </div>
                    )}

                    {/* Search empty */}

                    {contactLists.length >
                      0 &&
                      filteredContactLists.length ===
                        0 && (
                        <div className="flex min-h-[180px] items-center justify-center p-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            No contact lists found.
                          </p>
                        </div>
                      )}

                    {/* Rows */}

                    {filteredContactLists.length >
                      0 && (
                      <div className="max-h-[330px] overflow-y-auto">
                        {filteredContactLists.map(
                          (list) => {
                            const selected =
                              selectedListIds.includes(
                                list.listId,
                              );

                            return (
                              <div
                                key={
                                  list.listId
                                }
                                className={[
                                  "flex items-center gap-3 border-b border-border p-3 last:border-b-0",
                                  "transition-colors hover:bg-muted/40",
                                  selected
                                    ? "bg-primary/5"
                                    : "",
                                ].join(" ")}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleList(
                                      list.listId,
                                    )
                                  }
                                  disabled={
                                    isSubmitting
                                  }
                                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                >
                                  <div
                                    className={[
                                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                                      selected
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-input bg-background",
                                    ].join(
                                      " ",
                                    )}
                                  >
                                    {selected && (
                                      <Check className="h-3.5 w-3.5" />
                                    )}
                                  </div>

                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                      {
                                        list.listName
                                      }
                                    </p>

                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                      {Number(
                                        list.total ||
                                          0,
                                      ).toLocaleString()}{" "}
                                      contacts
                                    </p>
                                  </div>
                                </button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handlePreviewContacts(
                                      list.listId,
                                    )
                                  }
                                  disabled={
                                    isSubmitting ||
                                    isLoadingContacts
                                  }
                                  title="Preview contacts"
                                >
                                  {isLoadingContacts &&
                                  previewListId ===
                                    list.listId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            );
                          },
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Selected summary */}

                {selectedListIds.length >
                  0 && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">
                          {
                            selectedListIds.length
                          }{" "}
                          {selectedListIds.length ===
                          1
                            ? "list"
                            : "lists"}{" "}
                          selected
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Approximately{" "}
                          <span className="font-semibold text-foreground">
                            {totalRecipients.toLocaleString()}
                          </span>{" "}
                          recipients.
                        </p>
                      </div>

                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                )}
              </div>

              {/* Contact preview */}

              {previewListId && (
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Contact preview
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Showing the first 100 contacts.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setPreviewListId(
                          null,
                        )
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="max-h-[180px] overflow-y-auto rounded-lg border border-border bg-background">
                    {contacts.length ===
                    0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No contacts found.
                      </div>
                    ) : (
                      contacts.map(
                        (
                          phone,
                          index,
                        ) => (
                          <div
                            key={`${phone}-${index}`}
                            className="border-b border-border px-3 py-2 text-xs last:border-b-0"
                          >
                            {phone}
                          </div>
                        ),
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Variables */}

              {variables.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">
                      Variables
                    </label>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Enter the values for the template variables.
                    </p>
                  </div>

                  {variables.map(
                    (
                      value,
                      index,
                    ) => (
                      <div
                        key={index}
                        className="space-y-1.5"
                      >
                        <label className="text-xs text-muted-foreground">
                          Variable{" "}
                          {index + 1}
                        </label>

                        <Input
                          value={value}
                          onChange={(
                            event,
                          ) =>
                            handleVariableChange(
                              index,
                              event.target.value,
                            )
                          }
                          placeholder={`Value for {{${index + 1}}}`}
                          disabled={
                            isSubmitting
                          }
                        />
                      </div>
                    ),
                  )}
                </div>
              )}

              {/* Test */}

              <div className="space-y-3 rounded-xl border border-border p-4">
                <div>
                  <p className="text-sm font-medium">
                    Test message
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Send the template to one number before starting the campaign.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={testPhone}
                    onChange={(event) =>
                      setTestPhone(
                        event.target.value,
                      )
                    }
                    placeholder="9665XXXXXXXX"
                    disabled={
                      isSubmitting ||
                      isTesting
                    }
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTest}
                    disabled={
                      isSubmitting ||
                      isTesting ||
                      !testPhone.trim()
                    }
                  >
                    {isTesting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}

                    Test
                  </Button>
                </div>
              </div>

              {/* Delivery */}

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">
                    Delivery
                  </label>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose when to send the campaign.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={
                      !schedule
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setSchedule(
                        false,
                      )
                    }
                    disabled={
                      isSubmitting
                    }
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send now
                  </Button>

                  <Button
                    type="button"
                    variant={
                      schedule
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setSchedule(
                        true,
                      )
                    }
                    disabled={
                      isSubmitting
                    }
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                </div>

                {schedule && (
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      Scheduled date and time
                    </label>

                    <Input
                      type="datetime-local"
                      value={
                        scheduledAt
                      }
                      onChange={(
                        event,
                      ) =>
                        setScheduledAt(
                          event.target.value,
                        )
                      }
                      disabled={
                        isSubmitting
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ================================================= */}
            {/* RIGHT */}
            {/* ================================================= */}

            <div>
              <div className="mb-3 flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />

                <div>
                  <p className="text-sm font-medium">
                    Preview
                  </p>

                  <p className="text-xs text-muted-foreground">
                    WhatsApp message preview
                  </p>
                </div>
              </div>

              <div className="min-h-[420px] rounded-xl border border-border bg-muted/30 p-4">
                <div className="mx-auto mt-8 max-w-[280px]">
                  <div className="overflow-hidden rounded-xl rounded-tl-sm border border-border bg-card shadow-sm">
                    {selectedTemplate.headerImageUrl && (
                      <img
                        src={
                          selectedTemplate.headerImageUrl
                        }
                        alt=""
                        className="h-32 w-full object-cover"
                      />
                    )}

                    <div className="space-y-2 p-3">
                      {selectedTemplate.headerText && (
                        <p className="text-sm font-semibold">
                          {
                            selectedTemplate.headerText
                          }
                        </p>
                      )}

                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {previewBody}
                      </p>

                      {selectedTemplate.buttons
                        .length > 0 && (
                        <div className="space-y-1.5 pt-2">
                          {selectedTemplate.buttons.map(
                            (
                              button,
                              index,
                            ) => (
                              <div
                                key={
                                  index
                                }
                                className="border-t border-border pt-2 text-center text-sm font-medium text-primary"
                              >
                                {
                                  button.text
                                }
                              </div>
                            ),
                          )}
                        </div>
                      )}

                      <div className="text-right text-[10px] text-muted-foreground">
                        Now
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign summary */}

              <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Campaign
                    </p>

                    <p className="mt-1 truncate text-sm font-medium">
                      {campaignName.trim() ||
                        "Unnamed campaign"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />

                      <span className="text-xs text-muted-foreground">
                        Recipients
                      </span>
                    </div>

                    <span className="text-sm font-semibold">
                      {totalRecipients.toLocaleString()}
                    </span>
                  </div>

                  {selectedLists.length >
                    0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedLists.map(
                        (list) => (
                          <div
                            key={
                              list.listId
                            }
                            className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
                          >
                            <span className="max-w-[160px] truncate">
                              {
                                list.listName
                              }
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                toggleList(
                                  list.listId,
                                )
                              }
                              disabled={
                                isSubmitting
                              }
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            disabled={
              isSubmitting ||
              isTesting
            }
            onClick={() =>
              onOpenChange(false)
            }
          >
            Cancel
          </Button>

          {selectedTemplate && (
            <Button
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : schedule ? (
                <Clock className="mr-2 h-4 w-4" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}

              {schedule
                ? "Schedule Campaign"
                : "Send Campaign"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}