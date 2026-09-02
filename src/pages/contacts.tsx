import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  X,
  Users,
  CheckCircle2,
  Loader2,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useContacts } from "@/hooks/use-contacts";
import { useLanguage } from "@/hooks/use-language";

export default function ImportContactsPage() {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { t } = useLanguage();

  const {
    importContacts,
    isImporting,
    importResult,
    clearImportResult,

    getContactLists,
    contactLists,
    isLoadingLists,

    getContacts,
    contacts,
    isLoadingContacts,
  } = useContacts();

  // ==========================================================
  // State
  // ==========================================================

  const [showAddContacts, setShowAddContacts] =
    useState(false);

  const [selectedListId, setSelectedListId] =
    useState<string | null>(null);

  const [selectedListName, setSelectedListName] =
    useState("");

  const [file, setFile] =
    useState<File | null>(null);

  const [listName, setListName] =
    useState("");

  const [isProcessing, setIsProcessing] =
    useState(false);

  const [listsPage, setListsPage] =
    useState(1);

  const [listsPageSize] =
    useState(10);

  const [listsTotalPages, setListsTotalPages] =
    useState(1);

  const [contactsPage, setContactsPage] =
    useState(1);

  const [contactsPageSize] =
    useState(100);

  const [contactsTotalPages, setContactsTotalPages] =
    useState(1);

  // ==========================================================
  // Load saved contact lists
  // ==========================================================

  const loadContactLists = async (
    page = 1
  ) => {
    try {
      const result =
        await getContactLists(
          page,
          listsPageSize
        );

      setListsPage(
        result.page || page
      );

      setListsTotalPages(
        Math.max(
          1,
          result.totalPages || 1
        )
      );
    } catch (error) {
      console.error(
        "Failed to load contact lists:",
        error
      );

      toast({
        variant: "destructive",
        title: "Failed to load contact lists",
        description:
          error instanceof Error
            ? error.message
            : "Unable to load saved contact lists.",
      });
    }
  };

  // ==========================================================
  // Initial load
  // ==========================================================

  useEffect(() => {
    loadContactLists(1);
  }, []);

  // ==========================================================
  // File validation
  // ==========================================================

  const isValidFile = (
    selectedFile: File
  ) => {
    const extension =
      selectedFile.name
        .substring(
          selectedFile.name.lastIndexOf(".")
        )
        .toLowerCase();

    return [
      ".xlsx",
      ".xls",
      ".csv",
    ].includes(extension);
  };

  // ==========================================================
  // Select file
  // ==========================================================

  const handleFile = (
    selectedFile: File
  ) => {
    if (!isValidFile(selectedFile)) {
      toast({
        variant: "destructive",
        title: t.contacts.invalidFile,
        description:
          t.contacts.invalidFileDescription,
      });

      return;
    }

    setFile(selectedFile);
    setListName("");
    setIsProcessing(false);
    clearImportResult();
  };

  // ==========================================================
  // File input
  // ==========================================================

  const handleFileInput = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  // ==========================================================
  // Drop
  // ==========================================================

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    if (isProcessing || isImporting) {
      return;
    }

    const selectedFile =
      event.dataTransfer.files?.[0];

    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  // ==========================================================
  // Remove file
  // ==========================================================

  const removeFile = () => {
    setFile(null);
    setListName("");
    setIsProcessing(false);
    clearImportResult();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ==========================================================
  // Open Add Contacts
  // ==========================================================

  const openAddContacts = () => {
    setShowAddContacts(true);
    setSelectedListId(null);
    setSelectedListName("");
  };

  // ==========================================================
  // Close Add Contacts
  // ==========================================================

  const closeAddContacts = () => {
    if (isProcessing || isImporting) {
      return;
    }

    removeFile();
    setShowAddContacts(false);
  };

  // ==========================================================
  // Import
  // ==========================================================

  const handleImport = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: t.contacts.selectFile,
        description:
          t.contacts.selectFileDescription,
      });

      return;
    }

    if (!listName.trim()) {
      toast({
        variant: "destructive",
        title: t.contacts.listNameRequired,
        description:
          t.contacts.listNameRequiredDescription,
      });

      return;
    }

    try {
      setIsProcessing(true);

      const result =
        await importContacts({
          file,
          listName: listName.trim(),
        });

      toast({
        title: t.contacts.importedSuccess,
        description:
          t.contacts.importedSuccessDescription
            .replace(
              "{{name}}",
              result.listName
            )
            .replace(
              "{{count}}",
              result.total.toLocaleString()
            ),
      });

      // Refresh saved lists.
      await loadContactLists(1);

      // Open the newly imported list.
      if (result.listId) {
        await openContactList(
          result.listId,
          result.listName
        );
      }

      removeFile();
      setShowAddContacts(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t.contacts.importFailed,
        description:
          error instanceof Error
            ? error.message
            : t.contacts.importFailedDescription,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================================
  // Open contact list
  // ==========================================================

  const openContactList = async (
    listId: string,
    name: string,
    page = 1
  ) => {
    try {
      setSelectedListId(listId);
      setSelectedListName(name);

      const result =
        await getContacts(
          listId,
          page,
          contactsPageSize
        );

      setContactsPage(
        result.page || page
      );

      setContactsTotalPages(
        Math.max(
          1,
          result.totalPages || 1
        )
      );
    } catch (error) {
      console.error(
        "Failed to load contacts:",
        error
      );

      toast({
        variant: "destructive",
        title: "Failed to load contacts",
        description:
          error instanceof Error
            ? error.message
            : "Unable to load contacts.",
      });
    }
  };

  // ==========================================================
  // Close contact list
  // ==========================================================

  const closeContactList = () => {
    setSelectedListId(null);
    setSelectedListName("");
  };

  // ==========================================================
  // Pagination - lists
  // ==========================================================

  const goToListsPage = async (
    page: number
  ) => {
    if (
      page < 1 ||
      page > listsTotalPages ||
      page === listsPage
    ) {
      return;
    }

    await loadContactLists(page);
  };

  // ==========================================================
  // Pagination - contacts
  // ==========================================================

  const goToContactsPage = async (
    page: number
  ) => {
    if (
      !selectedListId ||
      page < 1 ||
      page > contactsTotalPages ||
      page === contactsPage
    ) {
      return;
    }

    await openContactList(
      selectedListId,
      selectedListName,
      page
    );
  };

  // ==========================================================
  // State
  // ==========================================================

  const processing =
    isProcessing || isImporting;

  // ==========================================================
  // Contact details
  // ==========================================================

  if (selectedListId) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">

        {/* ====================================================
            Header
        ==================================================== */}

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={closeContactList}
            disabled={isLoadingContacts}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {selectedListName}
            </h1>

            <p className="text-muted-foreground mt-1">
              {isLoadingContacts
                ? "Loading contacts..."
                : `${contacts.length.toLocaleString()} contacts on this page`}
            </p>
          </div>
        </div>

        {/* ====================================================
            Contacts
        ==================================================== */}

        <div className="border border-border bg-card rounded-xl overflow-hidden">

          <div className="p-5 border-b border-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h2 className="font-semibold text-foreground">
                Contacts
              </h2>

              <p className="text-sm text-muted-foreground">
                Page {contactsPage} of{" "}
                {contactsTotalPages}
              </p>
            </div>
          </div>

          {isLoadingContacts ? (
            <div className="py-16 flex flex-col items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary mb-3" />

              <p className="text-sm text-muted-foreground">
                Loading contacts...
              </p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />

              <p className="font-medium text-muted-foreground">
                No contacts found
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {contacts.map(
                  (phone, index) => (
                    <div
                      key={`${phone}-${index}`}
                      className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <span className="font-mono text-sm text-foreground">
                        {phone}
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* =================================================
                  Contact pagination
              ================================================= */}

              <div className="p-4 border-t border-border flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    contactsPage <= 1 ||
                    isLoadingContacts
                  }
                  onClick={() =>
                    goToContactsPage(
                      contactsPage - 1
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {contactsPage} of{" "}
                  {contactsTotalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    contactsPage >=
                      contactsTotalPages ||
                    isLoadingContacts
                  }
                  onClick={() =>
                    goToContactsPage(
                      contactsPage + 1
                    )
                  }
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ==========================================================
  // Main page
  // ==========================================================

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ======================================================
          Header
      ====================================================== */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t.contacts.title}
          </h1>

          <p className="text-muted-foreground mt-1">
            {t.contacts.subtitle}
          </p>
        </div>

        <Button
          onClick={openAddContacts}
          disabled={isLoadingLists}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contacts
        </Button>
      </div>

      {/* ======================================================
          Add Contacts
      ====================================================== */}

      {showAddContacts && (
        <div className="border border-border bg-card rounded-xl p-6">

          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-semibold text-foreground">
                {t.contacts.uploadContacts}
              </h2>

              <p className="text-sm text-muted-foreground mt-1">
                {t.contacts.uploadDescription}
              </p>

              <p className="text-xs text-muted-foreground/70 mt-2">
                {t.contacts.internationalFormat}
              </p>

              <div className="mt-2 inline-flex items-center rounded-md bg-muted px-2.5 py-1">
                <span className="text-xs font-mono text-foreground">
                  {t.contacts.example}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={closeAddContacts}
              disabled={processing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {!file ? (
            <div
              onDragOver={(event) =>
                event.preventDefault()
              }
              onDrop={handleDrop}
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="
                border-2
                border-dashed
                border-border
                rounded-xl
                p-12
                text-center
                cursor-pointer
                transition-colors
                hover:border-primary/50
                hover:bg-muted/30
              "
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Upload className="h-6 w-6 text-primary" />
              </div>

              <p className="font-medium text-foreground">
                {t.contacts.dropFile}
              </p>

              <p className="text-sm text-muted-foreground mt-1">
                {t.contacts.clickToBrowse}
              </p>

              <p className="text-xs text-muted-foreground/70 mt-3">
                {t.contacts.supportedFiles}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                className="hidden"
                disabled={processing}
              />
            </div>
          ) : (
            <div className="space-y-5">

              {/* =================================================
                  Selected file
              ================================================= */}

              <div className="border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {file.name
                    .toLowerCase()
                    .endsWith(".csv") ? (
                    <FileText className="h-5 w-5 text-primary" />
                  ) : (
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </p>

                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(file.size / 1024 / 1024).toFixed(
                      2
                    )}{" "}
                    MB
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  disabled={processing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* =================================================
                  List name
              ================================================= */}

              <div className="space-y-2">
                <label
                  htmlFor="listName"
                  className="text-sm font-medium text-foreground"
                >
                  {t.contacts.contactListName}
                </label>

                <Input
                  id="listName"
                  value={listName}
                  onChange={(event) =>
                    setListName(
                      event.target.value
                    )
                  }
                  placeholder={
                    t.contacts.contactListPlaceholder
                  }
                  maxLength={100}
                  disabled={processing}
                />

                <p className="text-xs text-muted-foreground">
                  {t.contacts.contactListHint}
                </p>
              </div>

              {/* =================================================
                  Processing
              ================================================= */}

              {processing && (
                <div className="border border-border rounded-xl p-4 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />

                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t.contacts.processingTitle}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {t.contacts.processingDescription}
                    </p>
                  </div>
                </div>
              )}

              {/* =================================================
                  Result
              ================================================= */}

              {!processing &&
                importResult && (
                  <div className="border border-border rounded-xl p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {(importResult.total ?? 0).toLocaleString()}{" "}
                        contacts
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {importResult.listName}
                      </p>
                    </div>

                    <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
                  </div>
                )}

              {/* =================================================
                  Actions
              ================================================= */}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={closeAddContacts}
                  disabled={processing}
                >
                  {t.contacts.cancel}
                </Button>

                <Button
                  onClick={handleImport}
                  disabled={
                    processing ||
                    !file ||
                    !listName.trim()
                  }
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.contacts.importing}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {t.contacts.importContacts}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================
          Saved Contact Lists
      ====================================================== */}

      <div className="border border-border bg-card rounded-xl overflow-hidden">

        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h2 className="font-semibold text-foreground">
                Contact Lists
              </h2>

              <p className="text-sm text-muted-foreground">
                Select a list to view its contacts
              </p>
            </div>
          </div>
        </div>

        {isLoadingLists ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary mb-3" />

            <p className="text-sm text-muted-foreground">
              Loading contact lists...
            </p>
          </div>
        ) : contactLists.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />

            <p className="font-medium text-muted-foreground">
              No contact lists yet
            </p>

            <p className="text-sm text-muted-foreground mt-1">
              Click "Add Contacts" to upload your first list.
            </p>

            <Button
              className="mt-5"
              onClick={openAddContacts}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contacts
            </Button>
          </div>
        ) : (
          <>
            {/* =================================================
                List
            ================================================= */}

            <div className="divide-y divide-border">
              {contactLists.map(
                (contactList) => (
                  <button
                    key={contactList.listId}
                    type="button"
                    onClick={() =>
                      openContactList(
                        contactList.listId,
                        contactList.listName
                      )
                    }
                    className="
                      w-full
                      text-left
                      p-5
                      flex
                      items-center
                      gap-4
                      hover:bg-muted/30
                      transition-colors
                    "
                  >
                    <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {contactList.listName}
                      </p>

                      <p className="text-sm text-muted-foreground mt-0.5">
                        {(contactList.total ?? 0).toLocaleString()}{" "}
                        contacts
                      </p>
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                )
              )}
            </div>

            {/* =================================================
                List pagination
            ================================================= */}

            <div className="p-4 border-t border-border flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={
                  listsPage <= 1 ||
                  isLoadingLists
                }
                onClick={() =>
                  goToListsPage(
                    listsPage - 1
                  )
                }
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                Page {listsPage} of{" "}
                {listsTotalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={
                  listsPage >=
                    listsTotalPages ||
                  isLoadingLists
                }
                onClick={() =>
                  goToListsPage(
                    listsPage + 1
                  )
                }
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
