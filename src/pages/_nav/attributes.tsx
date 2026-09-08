import { useMemo, useState } from "react";
import {
  Database,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  Webhook,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useLanguage } from "@/hooks/use-language";

type AttributeType =
  | "TEXT"
  | "NUMBER"
  | "BOOLEAN"
  | "DATE";

type AttributeSource =
  | "SHEET"
  | "WEBHOOK"
  | "SYSTEM";

interface Attribute {
  id: number;
  attributeKey: string;
  name: string;
  type: AttributeType;
  sources: AttributeSource[];
  createdAt: string;
  updatedAt: string;
}

const mockAttributes: Attribute[] = [
  {
    id: 1,
    attributeKey: "username",
    name: "Username",
    type: "TEXT",
    sources: ["SHEET"],
    createdAt: "2026-09-01",
    updatedAt: "2026-09-01",
  },
  {
    id: 2,
    attributeKey: "city",
    name: "City",
    type: "TEXT",
    sources: ["SHEET", "WEBHOOK"],
    createdAt: "2026-09-01",
    updatedAt: "2026-09-02",
  },
  {
    id: 3,
    attributeKey: "customer_name",
    name: "Customer Name",
    type: "TEXT",
    sources: ["WEBHOOK"],
    createdAt: "2026-09-02",
    updatedAt: "2026-09-02",
  },
  {
    id: 4,
    attributeKey: "order_number",
    name: "Order Number",
    type: "TEXT",
    sources: ["SHEET"],
    createdAt: "2026-09-02",
    updatedAt: "2026-09-02",
  },
  {
    id: 5,
    attributeKey: "phone_no",
    name: "Phone Number",
    type: "TEXT",
    sources: ["SYSTEM"],
    createdAt: "2026-09-03",
    updatedAt: "2026-09-03",
  },
  {
    id: 6,
    attributeKey: "order_total",
    name: "Order Total",
    type: "NUMBER",
    sources: ["WEBHOOK"],
    createdAt: "2026-09-03",
    updatedAt: "2026-09-03",
  },
];

const PAGE_SIZE = 10;

export default function AttributesPage() {
  const { t } = useLanguage();

  const [attributes, setAttributes] =
    useState<Attribute[]>(mockAttributes);

  const [search, setSearch] = useState("");

  const [sourceFilter, setSourceFilter] = useState<
    "all" | AttributeSource
  >("all");

  const [typeFilter, setTypeFilter] = useState<
    "all" | AttributeType
  >("all");

  const [page, setPage] = useState(1);

  const [openMenu, setOpenMenu] =
    useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [editingAttribute, setEditingAttribute] =
    useState<Attribute | null>(null);

  const [selectedAttribute, setSelectedAttribute] =
    useState<Attribute | null>(null);

  const [form, setForm] = useState({
    attributeKey: "",
    name: "",
    type: "TEXT" as AttributeType,
  });

  /*
   * ============================================================
   * FILTERING
   * ============================================================
   */

  const filteredAttributes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return attributes.filter((attribute) => {
      const matchesSearch =
        !query ||
        attribute.attributeKey
          .toLowerCase()
          .includes(query) ||
        attribute.name
          .toLowerCase()
          .includes(query);

      const matchesSource =
        sourceFilter === "all" ||
        attribute.sources.includes(sourceFilter);

      const matchesType =
        typeFilter === "all" ||
        attribute.type === typeFilter;

      return (
        matchesSearch &&
        matchesSource &&
        matchesType
      );
    });
  }, [
    attributes,
    search,
    sourceFilter,
    typeFilter,
  ]);

  /*
   * ============================================================
   * PAGINATION
   * ============================================================
   */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredAttributes.length / PAGE_SIZE
    )
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const paginatedAttributes =
    filteredAttributes.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    );

  const from =
    filteredAttributes.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;

  const to = Math.min(
    currentPage * PAGE_SIZE,
    filteredAttributes.length
  );

  /*
   * ============================================================
   * STATS
   * ============================================================
   */

  const totalAttributes = attributes.length;

  const sheetAttributes = attributes.filter(
    (attribute) =>
      attribute.sources.includes("SHEET")
  ).length;

  const webhookAttributes = attributes.filter(
    (attribute) =>
      attribute.sources.includes("WEBHOOK")
  ).length;

  /*
   * ============================================================
   * LABEL HELPERS
   * ============================================================
   */

  const getTypeLabel = (
    type: AttributeType
  ) => {
    switch (type) {
      case "TEXT":
        return t.attributes.text;

      case "NUMBER":
        return t.attributes.number;

      case "BOOLEAN":
        return t.attributes.boolean;

      case "DATE":
        return t.attributes.date;

      default:
        return type;
    }
  };

  const getSourceLabel = (
    source: AttributeSource
  ) => {
    switch (source) {
      case "SHEET":
        return t.attributes.sheet;

      case "WEBHOOK":
        return t.attributes.webhook;

      case "SYSTEM":
        return t.attributes.system;

      default:
        return source;
    }
  };

  const getSourceIcon = (
    source: AttributeSource
  ) => {
    switch (source) {
      case "SHEET":
        return <Database className="h-3.5 w-3.5" />;

      case "WEBHOOK":
        return <Webhook className="h-3.5 w-3.5" />;

      case "SYSTEM":
        return <Settings2 className="h-3.5 w-3.5" />;

      default:
        return null;
    }
  };

  /*
   * ============================================================
   * TYPE BADGE
   * ============================================================
   */

  const getTypeBadge = (
    type: AttributeType
  ) => {
    switch (type) {
      case "TEXT":
        return (
          <Badge
            variant="outline"
            className="
              bg-blue-50
              text-blue-700
              border-blue-200
            "
          >
            {t.attributes.text}
          </Badge>
        );

      case "NUMBER":
        return (
          <Badge
            variant="outline"
            className="
              bg-purple-50
              text-purple-700
              border-purple-200
            "
          >
            {t.attributes.number}
          </Badge>
        );

      case "BOOLEAN":
        return (
          <Badge
            variant="outline"
            className="
              bg-amber-50
              text-amber-700
              border-amber-200
            "
          >
            {t.attributes.boolean}
          </Badge>
        );

      case "DATE":
        return (
          <Badge
            variant="outline"
            className="
              bg-emerald-50
              text-emerald-700
              border-emerald-200
            "
          >
            {t.attributes.date}
          </Badge>
        );

      default:
        return null;
    }
  };

  /*
   * ============================================================
   * CREATE
   * ============================================================
   */

  const openCreateModal = () => {
    setEditingAttribute(null);

    setForm({
      attributeKey: "",
      name: "",
      type: "TEXT",
    });

    setShowModal(true);
  };

  /*
   * ============================================================
   * EDIT
   * ============================================================
   */

  const openEditModal = (
    attribute: Attribute
  ) => {
    if (
      attribute.sources.includes("SYSTEM")
    ) {
      return;
    }

    setEditingAttribute(attribute);

    setForm({
      attributeKey: attribute.attributeKey,
      name: attribute.name,
      type: attribute.type,
    });

    setOpenMenu(null);
    setShowModal(true);
  };

  /*
   * ============================================================
   * CLOSE FORM
   * ============================================================
   */

  const closeModal = () => {
    setShowModal(false);
    setEditingAttribute(null);
  };

  /*
   * ============================================================
   * SAVE
   * ============================================================
   */

  const handleSubmit = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    const attributeKey = form.attributeKey
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

    const name = form.name.trim();

    if (!attributeKey || !name) {
      return;
    }

    /*
     * EDIT
     */

    if (editingAttribute) {
      setAttributes((current) =>
        current.map((attribute) =>
          attribute.id ===
          editingAttribute.id
            ? {
                ...attribute,
                name,
                type: form.type,
                updatedAt:
                  new Date()
                    .toISOString()
                    .split("T")[0],
              }
            : attribute
        )
      );

      closeModal();
      return;
    }

    /*
     * CREATE
     */

    const exists = attributes.some(
      (attribute) =>
        attribute.attributeKey ===
        attributeKey
    );

    if (exists) {
      return;
    }

    const now = new Date()
      .toISOString()
      .split("T")[0];

    const newAttribute: Attribute = {
      id:
        Math.max(
          0,
          ...attributes.map(
            (attribute) => attribute.id
          )
        ) + 1,

      attributeKey,

      name,

      type: form.type,

      /*
       * Manually created attributes start
       * as SYSTEM until a real source
       * discovers them.
       */
      sources: ["SYSTEM"],

      createdAt: now,

      updatedAt: now,
    };

    setAttributes((current) => [
      newAttribute,
      ...current,
    ]);

    closeModal();
  };

  /*
   * ============================================================
   * DELETE
   * ============================================================
   */

  const openDeleteModal = (
    attribute: Attribute
  ) => {
    if (
      attribute.sources.includes("SYSTEM")
    ) {
      return;
    }

    setSelectedAttribute(attribute);
    setOpenMenu(null);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedAttribute(null);
  };

  const handleDelete = () => {
    if (!selectedAttribute) {
      return;
    }

    setAttributes((current) =>
      current.filter(
        (attribute) =>
          attribute.id !==
          selectedAttribute.id
      )
    );

    closeDeleteModal();
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="
        flex
        flex-col
        gap-4
        sm:flex-row
        sm:items-center
        sm:justify-between
      ">

        <div>
          <h1 className="
            text-3xl
            font-bold
            tracking-tight
            text-foreground
          ">
            {t.attributes.title}
          </h1>

          <p className="
            mt-1
            text-muted-foreground
          ">
            {t.attributes.subtitle}
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="
            bg-emerald-600
            hover:bg-emerald-700
          "
        >
          <Plus className="mr-2 h-4 w-4" />

          {t.attributes.addAttribute}
        </Button>

      </div>

      {/* ========================================================
          STATS
      ======================================================== */}

      <div className="
        grid
        grid-cols-1
        gap-4
        md:grid-cols-3
      ">

        {/* Total */}

        <div className="
          rounded-lg
          border
          border-border
          bg-card
          p-5
        ">
          <div className="
            flex
            items-center
            justify-between
          ">

            <div>
              <p className="
                text-sm
                text-muted-foreground
              ">
                {t.attributes.totalAttributes}
              </p>

              <p className="
                mt-2
                text-2xl
                font-bold
                text-foreground
              ">
                {totalAttributes}
              </p>
            </div>

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-lg
              bg-muted
            ">
              <Settings2 className="h-5 w-5" />
            </div>

          </div>
        </div>

        {/* Sheet */}

        <div className="
          rounded-lg
          border
          border-border
          bg-card
          p-5
        ">
          <div className="
            flex
            items-center
            justify-between
          ">

            <div>
              <p className="
                text-sm
                text-muted-foreground
              ">
                {t.attributes.sheetAttributes}
              </p>

              <p className="
                mt-2
                text-2xl
                font-bold
                text-foreground
              ">
                {sheetAttributes}
              </p>
            </div>

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-lg
              bg-blue-50
              text-blue-600
            ">
              <Database className="h-5 w-5" />
            </div>

          </div>
        </div>

        {/* Webhook */}

        <div className="
          rounded-lg
          border
          border-border
          bg-card
          p-5
        ">
          <div className="
            flex
            items-center
            justify-between
          ">

            <div>
              <p className="
                text-sm
                text-muted-foreground
              ">
                {t.attributes.webhookAttributes}
              </p>

              <p className="
                mt-2
                text-2xl
                font-bold
                text-foreground
              ">
                {webhookAttributes}
              </p>
            </div>

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-lg
              bg-purple-50
              text-purple-600
            ">
              <Webhook className="h-5 w-5" />
            </div>

          </div>
        </div>

      </div>

      {/* ========================================================
          TABLE
      ======================================================== */}

      <div className="
        overflow-hidden
        rounded-lg
        border
        border-border
        bg-card
      ">

        {/* FILTERS */}

        <div className="
          flex
          flex-col
          gap-3
          border-b
          border-border
          p-4
          lg:flex-row
          lg:items-center
          lg:justify-between
        ">

          {/* Search */}

          <div className="
            relative
            w-full
            lg:max-w-md
          ">

            <Search className="
              absolute
              left-3
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-muted-foreground
            " />

            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={
                t.attributes.searchPlaceholder
              }
              className="pl-9"
            />

          </div>

          {/* Filters */}

          <div className="
            flex
            gap-2
          ">

            <Select
              value={sourceFilter}
              onValueChange={(value) => {
                setSourceFilter(
                  value as
                    | "all"
                    | AttributeSource
                );

                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="all">
                  {t.attributes.allSources}
                </SelectItem>

                <SelectItem value="SHEET">
                  {t.attributes.sheet}
                </SelectItem>

                <SelectItem value="WEBHOOK">
                  {t.attributes.webhook}
                </SelectItem>

                <SelectItem value="SYSTEM">
                  {t.attributes.system}
                </SelectItem>

              </SelectContent>
            </Select>

            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(
                  value as
                    | "all"
                    | AttributeType
                );

                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="all">
                  {t.attributes.allTypes}
                </SelectItem>

                <SelectItem value="TEXT">
                  {t.attributes.text}
                </SelectItem>

                <SelectItem value="NUMBER">
                  {t.attributes.number}
                </SelectItem>

                <SelectItem value="BOOLEAN">
                  {t.attributes.boolean}
                </SelectItem>

                <SelectItem value="DATE">
                  {t.attributes.date}
                </SelectItem>

              </SelectContent>
            </Select>

          </div>

        </div>

        {/* ======================================================
            TABLE
        ====================================================== */}

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="
                border-b
                border-border
                bg-muted/30
              ">

                <th className="
                  px-5
                  py-3
                  text-left
                  text-xs
                  font-medium
                  text-muted-foreground
                ">
                  {t.attributes.attribute}
                </th>

                <th className="
                  px-5
                  py-3
                  text-left
                  text-xs
                  font-medium
                  text-muted-foreground
                ">
                  {t.attributes.name}
                </th>

                <th className="
                  px-5
                  py-3
                  text-left
                  text-xs
                  font-medium
                  text-muted-foreground
                ">
                  {t.attributes.type}
                </th>

                <th className="
                  px-5
                  py-3
                  text-left
                  text-xs
                  font-medium
                  text-muted-foreground
                ">
                  {t.attributes.source}
                </th>

                <th className="
                  px-5
                  py-3
                  text-left
                  text-xs
                  font-medium
                  text-muted-foreground
                ">
                  {t.attributes.createdAt}
                </th>

                <th className="
                  px-5
                  py-3
                  text-right
                  text-xs
                  font-medium
                  text-muted-foreground
                ">
                  {t.attributes.actions}
                </th>

              </tr>

            </thead>

            <tbody>

              {paginatedAttributes.map(
                (attribute) => {

                  const isSystem =
                    attribute.sources.includes(
                      "SYSTEM"
                    );

                  return (
                    <tr
                      key={attribute.id}
                      className="
                        border-b
                        border-border
                        transition-colors
                        hover:bg-muted/30
                      "
                    >

                      {/* ATTRIBUTE */}

                      <td className="px-5 py-4">

                        <div className="
                          flex
                          items-center
                          gap-3
                        ">

                          <div className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            bg-emerald-50
                            text-emerald-600
                          ">
                            <span className="
                              font-mono
                              text-xs
                              font-bold
                            ">
                              {"{}"}
                            </span>
                          </div>

                          <div className="min-w-0">

                            <div className="
                              flex
                              items-center
                              gap-2
                            ">

                              <span className="
                                font-mono
                                text-sm
                                font-medium
                                text-foreground
                              ">
                                {`{{${attribute.attributeKey}}}`}
                              </span>

                              {isSystem && (
                                <Badge
                                  variant="outline"
                                  className="
                                    text-[10px]
                                    px-1.5
                                    py-0
                                  "
                                >
                                  {t.attributes.system}
                                </Badge>
                              )}

                            </div>

                          </div>

                        </div>

                      </td>

                      {/* NAME */}

                      <td className="
                        px-5
                        py-4
                        text-sm
                        text-foreground
                      ">
                        {attribute.name}
                      </td>

                      {/* TYPE */}

                      <td className="px-5 py-4">
                        {getTypeBadge(
                          attribute.type
                        )}
                      </td>

                      {/* SOURCES */}

                      <td className="px-5 py-4">

                        <div className="
                          flex
                          flex-wrap
                          gap-1.5
                        ">

                          {attribute.sources.map(
                            (source) => (
                              <Badge
                                key={source}
                                variant="outline"
                                className="
                                  gap-1
                                  font-normal
                                "
                              >
                                {getSourceIcon(
                                  source
                                )}

                                {getSourceLabel(
                                  source
                                )}
                              </Badge>
                            )
                          )}

                        </div>

                      </td>

                      {/* CREATED */}

                      <td className="
                        px-5
                        py-4
                        text-sm
                        text-muted-foreground
                      ">
                        {attribute.createdAt}
                      </td>

                      {/* ACTIONS */}

                      <td className="
                        relative
                        px-5
                        py-4
                        text-right
                      ">

                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isSystem}
                          onClick={() =>
                            setOpenMenu(
                              openMenu ===
                                attribute.id
                                ? null
                                : attribute.id
                            )
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>

                        {openMenu ===
                          attribute.id && (
                          <div className="
                            absolute
                            right-5
                            top-12
                            z-30
                            w-36
                            rounded-lg
                            border
                            border-border
                            bg-popover
                            p-1
                            shadow-md
                          ">

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  attribute
                                )
                              }
                              className="
                                flex
                                w-full
                                items-center
                                gap-2
                                rounded-md
                                px-3
                                py-2
                                text-sm
                                text-foreground
                                hover:bg-muted
                              "
                            >
                              <Pencil className="h-3.5 w-3.5" />

                              {t.attributes.edit}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openDeleteModal(
                                  attribute
                                )
                              }
                              className="
                                flex
                                w-full
                                items-center
                                gap-2
                                rounded-md
                                px-3
                                py-2
                                text-sm
                                text-red-600
                                hover:bg-red-50
                              "
                            >
                              <Trash2 className="h-3.5 w-3.5" />

                              {t.attributes.delete}
                            </button>

                          </div>
                        )}

                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

          {/* EMPTY */}

          {paginatedAttributes.length ===
            0 && (
            <div className="
              flex
              flex-col
              items-center
              justify-center
              py-16
            ">

              <div className="
                mb-4
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-full
                bg-muted
              ">
                <Search className="
                  h-5
                  w-5
                  text-muted-foreground
                " />
              </div>

              <h3 className="
                font-medium
                text-foreground
              ">
                {t.attributes.noAttributesFound}
              </h3>

              <p className="
                mt-1
                text-sm
                text-muted-foreground
              ">
                {
                  t.attributes
                    .noAttributesDescription
                }
              </p>

            </div>
          )}

        </div>

        {/* ======================================================
            PAGINATION
        ====================================================== */}

        {filteredAttributes.length > 0 && (
          <div className="
            flex
            flex-col
            gap-3
            border-t
            border-border
            px-5
            py-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          ">

            <p className="
              text-sm
              text-muted-foreground
            ">
              {t.attributes.showingAttributes
                .replace(
                  "{{from}}",
                  String(from)
                )
                .replace(
                  "{{to}}",
                  String(to)
                )
                .replace(
                  "{{total}}",
                  String(
                    filteredAttributes.length
                  )
                )}
            </p>

            <div className="flex items-center gap-1">

              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() =>
                  setPage((value) =>
                    Math.max(1, value - 1)
                  )
                }
              >
                <span className="sr-only">
                  {t.attributes.previous}
                </span>

                <span className="text-lg">
                  ‹
                </span>
              </Button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={
                    currentPage === pageNumber
                      ? "default"
                      : "outline"
                  }
                  size="icon"
                  onClick={() =>
                    setPage(pageNumber)
                  }
                  className={
                    currentPage === pageNumber
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : ""
                  }
                >
                  {pageNumber}
                </Button>
              ))}

              <Button
                variant="outline"
                size="icon"
                disabled={
                  currentPage === totalPages
                }
                onClick={() =>
                  setPage((value) =>
                    Math.min(
                      totalPages,
                      value + 1
                    )
                  )
                }
              >
                <span className="sr-only">
                  {t.attributes.next}
                </span>

                <span className="text-lg">
                  ›
                </span>
              </Button>

            </div>

          </div>
        )}

      </div>

      {/* ========================================================
          CREATE / EDIT MODAL
      ======================================================== */}

      {showModal && (
        <div className="
          fixed
          inset-0
          z-50
          flex
          items-center
          justify-center
          bg-black/40
          p-4
        ">

          <div className="
            w-full
            max-w-lg
            rounded-xl
            border
            border-border
            bg-background
            shadow-xl
          ">

            {/* Modal Header */}

            <div className="
              flex
              items-center
              justify-between
              border-b
              border-border
              px-6
              py-5
            ">

              <div>

                <h2 className="
                  text-lg
                  font-semibold
                  text-foreground
                ">
                  {editingAttribute
                    ? t.attributes
                        .editAttribute
                    : t.attributes
                        .createAttribute}
                </h2>

                <p className="
                  mt-1
                  text-sm
                  text-muted-foreground
                ">
                  {t.attributes.subtitle}
                </p>

              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={closeModal}
              >
                <X className="h-4 w-4" />
              </Button>

            </div>

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {/* Attribute Key */}

              <div className="space-y-2">

                <label className="
                  text-sm
                  font-medium
                  text-foreground
                ">
                  {t.attributes.attributeKey}
                </label>

                <Input
                  value={form.attributeKey}
                  disabled={
                    !!editingAttribute
                  }
                  placeholder={
                    t.attributes
                      .attributeKeyPlaceholder
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      attributeKey:
                        event.target.value,
                    }))
                  }
                  className="font-mono"
                />

                <p className="
                  text-xs
                  text-muted-foreground
                ">
                  {t.attributes.variableExample}
                </p>

              </div>

              {/* Name */}

              <div className="space-y-2">

                <label className="
                  text-sm
                  font-medium
                  text-foreground
                ">
                  {t.attributes.attributeName}
                </label>

                <Input
                  value={form.name}
                  placeholder={
                    t.attributes
                      .attributeNamePlaceholder
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />

              </div>

              {/* Type */}

              <div className="space-y-2">

                <label className="
                  text-sm
                  font-medium
                  text-foreground
                ">
                  {t.attributes.attributeType}
                </label>

                <Select
                  value={form.type}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      type:
                        value as AttributeType,
                    }))
                  }
                >

                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="TEXT">
                      {t.attributes.text}
                    </SelectItem>

                    <SelectItem value="NUMBER">
                      {t.attributes.number}
                    </SelectItem>

                    <SelectItem value="BOOLEAN">
                      {t.attributes.boolean}
                    </SelectItem>

                    <SelectItem value="DATE">
                      {t.attributes.date}
                    </SelectItem>

                  </SelectContent>

                </Select>

              </div>

              {/* Buttons */}

              <div className="
                flex
                justify-end
                gap-2
                pt-2
              ">

                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                >
                  {t.attributes.cancel}
                </Button>

                <Button
                  type="submit"
                  className="
                    bg-emerald-600
                    hover:bg-emerald-700
                  "
                >
                  {editingAttribute
                    ? t.attributes.saveChanges
                    : t.attributes.save}
                </Button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ========================================================
          DELETE MODAL
      ======================================================== */}

      {showDeleteModal &&
        selectedAttribute && (
          <div className="
            fixed
            inset-0
            z-[60]
            flex
            items-center
            justify-center
            bg-black/40
            p-4
          ">

            <div className="
              w-full
              max-w-md
              rounded-xl
              border
              border-border
              bg-background
              p-6
              shadow-xl
            ">

              <div className="
                mb-4
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-lg
                bg-red-50
                text-red-600
              ">
                <Trash2 className="h-5 w-5" />
              </div>

              <h2 className="
                text-lg
                font-semibold
                text-foreground
              ">
                {t.attributes.deleteAttribute}
              </h2>

              <p className="
                mt-2
                text-sm
                leading-6
                text-muted-foreground
              ">
                {t.attributes.deleteDescription
                  .replace(
                    "{{name}}",
                    selectedAttribute.name
                  )}
              </p>

              <div className="
                mt-6
                flex
                justify-end
                gap-2
              ">

                <Button
                  variant="outline"
                  onClick={closeDeleteModal}
                >
                  {t.attributes.cancel}
                </Button>

                <Button
                  variant="destructive"
                  onClick={handleDelete}
                >
                  {t.attributes.confirmDelete}
                </Button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}