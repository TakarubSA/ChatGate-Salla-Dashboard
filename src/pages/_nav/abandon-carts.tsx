import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileSpreadsheet,
  ShoppingCart,
  RotateCcw,
  Clock,
  ExternalLink,
  Send,
  Tag,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { exportToExcel } from '@/lib/export-excel';
import {
  useMerchant,
  AbandonedCart,
  CartStatus,
  getCartStatus,
} from '@/hooks/use-merchant';
import { useAuth } from '@/hooks/use-auth';

const PAGE_SIZE = 20;

type AbandonedCartWithRule = AbandonedCart & {
  ruleId?: number | string | null;
  reminderTaskId?: number | string | null;
};

const fillTemplate = (
  template: string,
  vars: Record<string, string | number>
) =>
  Object.entries(vars).reduce(
    (acc, [key, value]) =>
      acc.replace(`{{${key}}}`, String(value)),
    template
  );

export default function AbandonCartsPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();

  const {
    carts,
    cartsPage,
    isLoading,
    loadCarts,
    sendReminder,
    exportAllCarts,
  } = useMerchant();

  /*
   * ---------------------------------------------------------
   * FILTER STATE
   * ---------------------------------------------------------
   */

  const [inputStartDate, setInputStartDate] =
    useState('');

  const [inputEndDate, setInputEndDate] =
    useState('');

  const [status, setStatus] =
    useState<CartStatus | ''>('');

  const [appliedStartDate, setAppliedStartDate] =
    useState<string | undefined>(undefined);

  const [appliedEndDate, setAppliedEndDate] =
    useState<string | undefined>(undefined);

  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const requestIdRef = useRef(0);
  const [search, setSearch] = useState('');


  const filteredCarts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return carts ?? [];

    return (carts ?? []).filter((cart) =>
      [
        cart.cartId,
        cart.customerName,
        cart.customerEmail,
        cart.customerMobile,
        cart.ruleId,
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    );
  }, [carts, search]);

  /*
   * ---------------------------------------------------------
   * SELECTION
   * ---------------------------------------------------------
   */

  const [selectedCartIds, setSelectedCartIds] =
    useState<string[]>([]);

  const [selectedCartId, setSelectedCartId] =
    useState<string | null>(null);

  /*
   * ---------------------------------------------------------
   * SEND REMINDER
   * ---------------------------------------------------------
   */

  const [sendTarget, setSendTarget] =
    useState<string[] | null>(null);

  const [couponCode, setCouponCode] =
    useState('');

  const [isSending, setIsSending] =
    useState(false);

  /*
   * ---------------------------------------------------------
   * EXPORT
   * ---------------------------------------------------------
   */

  const [isExporting, setIsExporting] =
    useState(false);

  /*
   * ---------------------------------------------------------
   * FETCH CARTS
   * ---------------------------------------------------------
   */

  const fetchPage = async (
    targetPage: number,
    startDate = appliedStartDate,
    endDate = appliedEndDate,
    targetStatus = status,
    targetSearch = search
  ) => {
    if (!user) return;

    const requestId = ++requestIdRef.current;

    const result = await loadCarts({
      merchantId: user.merchantId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: targetStatus || undefined,
      search: targetSearch.trim() || undefined,
      page: targetPage,
      size: PAGE_SIZE,
    });

    if (requestId !== requestIdRef.current) return;

    setHasNextPage(
      result?.hasNextPage ??
        (result?.content?.length === PAGE_SIZE)
    );
  };

  /*
   * ---------------------------------------------------------
   * INITIAL LOAD
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!user) return;

    setPage(1);
    void fetchPage(1);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Reload from the API when the search term changes.
  useEffect(() => {
    if (!user) return;

    const query = search.trim();
    const timer = window.setTimeout(() => {
      setPage(1);
      setSelectedCartIds([]);
      void fetchPage(1, appliedStartDate, appliedEndDate, status, query);
    }, 300);

    return () => window.clearTimeout(timer);

    // fetchPage intentionally omitted; it is derived from current filter state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  /*
   * ---------------------------------------------------------
   * PAGINATION
   * ---------------------------------------------------------
   */

  const goToPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage === page) return;
    if (targetPage > page && !hasNextPage) return;

    setPage(targetPage);
    void fetchPage(targetPage);
  };

  /*
   * ---------------------------------------------------------
   * APPLY FILTERS
   * ---------------------------------------------------------
   */

  const applyFilters = async (
    nextStartDate: string,
    nextEndDate: string,
    nextStatus: CartStatus | ''
  ) => {
    if (!user) return;

    if (
      nextStartDate &&
      nextEndDate &&
      nextStartDate > nextEndDate
    ) {
      toast({
        variant: 'destructive',
        title: 'Invalid date range',
        description: 'Start date cannot be after end date.',
      });
      return;
    }

    const startDate = nextStartDate || undefined;
    const endDate = nextEndDate || undefined;

    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setPage(1);
    setSelectedCartIds([]);

    await fetchPage(1, startDate, endDate, nextStatus);
  };

  const handleLoad = () => {
    void applyFilters(inputStartDate, inputEndDate, status);
  };

  /*
   * ---------------------------------------------------------
   * RESET FILTERS
   * ---------------------------------------------------------
   */

  const handleResetFilters = async () => {
    if (!user) return;

    setInputStartDate('');
    setInputEndDate('');
    setStatus('');
    setSearch('');
    setAppliedStartDate(undefined);
    setAppliedEndDate(undefined);
    setSelectedCartIds([]);
    setPage(1);

    await fetchPage(1, undefined, undefined, '');
  };

  /*
   * ---------------------------------------------------------
   * SELECTION
   * ---------------------------------------------------------
   */

  const toggleCart = (cartId: string) => {
    setSelectedCartIds((prev) =>
      prev.includes(cartId)
        ? prev.filter((id) => id !== cartId)
        : [...prev, cartId]
    );
  };

  const allOnPageSelected =
    filteredCarts.length > 0 &&
    filteredCarts.every((cart) =>
      selectedCartIds.includes(cart.cartId)
    );

  const handleSelectAll = (
    checked: boolean
  ) => {
    if (checked) {
      setSelectedCartIds((prev) => {
        const ids = filteredCarts.map(
          (cart) => cart.cartId
        );

        return Array.from(
          new Set([...prev, ...ids])
        );
      });
    } else {
      const currentPageIds = new Set(
        filteredCarts.map((cart) => cart.cartId)
      );

      setSelectedCartIds((prev) =>
        prev.filter(
          (id) => !currentPageIds.has(id)
        )
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * SELECTED CART
   * ---------------------------------------------------------
   */

  const selectedCart:
    | AbandonedCartWithRule
    | undefined = useMemo(
    () =>
      carts?.find(
        (cart) =>
          cart.cartId === selectedCartId
      ),
    [carts, selectedCartId]
  );


  /*
   * ---------------------------------------------------------
   * SEND TARGET
   * ---------------------------------------------------------
   */

  const targetCarts = useMemo(
    () =>
      (carts ?? []).filter((cart) =>
        sendTarget?.includes(cart.cartId)
      ),
    [carts, sendTarget]
  );

  const targetTotal = useMemo(
    () =>
      targetCarts.reduce(
        (sum, cart) =>
          sum + (cart.total || 0),
        0
      ),
    [targetCarts]
  );

  /*
   * ---------------------------------------------------------
   * TARGET RULE ID
   * ---------------------------------------------------------
   */

  const targetRuleId = useMemo(() => {
    if (targetCarts.length === 0) {
      return null;
    }

    const ruleId = targetCarts[0]?.ruleId;

    if (
      ruleId === null ||
      ruleId === undefined ||
      ruleId === ''
    ) {
      return null;
    }

    const parsedRuleId = Number(ruleId);

    return Number.isFinite(parsedRuleId)
      ? parsedRuleId
      : null;
  }, [targetCarts]);

  /*
   * ---------------------------------------------------------
   * CURRENCY
   * ---------------------------------------------------------
   */

  const formatCurrency = (
    amount: number,
    currency: string
  ) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'SAR',
    }).format(amount || 0);
  };

  /*
   * ---------------------------------------------------------
   * SEND DIALOG
   * ---------------------------------------------------------
   */

  const openSendDialog = (
    cartIds: string[]
  ) => {
    if (cartIds.length === 0) {
      toast({
        variant: 'destructive',
        title:
          t.abandonedCarts
            .noCartsSelectedTitle,
      });

      return;
    }

    const selectedTargets =
      (carts ?? []).filter((cart) =>
        cartIds.includes(cart.cartId)
      );

    const hasRuleId = selectedTargets.some(
      (cart) =>
        cart.ruleId !== null &&
        cart.ruleId !== undefined &&
        cart.ruleId !== ''
    );

    if (!hasRuleId) {
      toast({
        variant: 'destructive',
        title: 'Rule ID missing',
        description:
          'The selected cart does not have a rule ID.',
      });

      return;
    }

    setCouponCode('');
    setSendTarget(cartIds);
  };

  /*
   * ---------------------------------------------------------
   * SEND REMINDER
   * ---------------------------------------------------------
   */

  const handleConfirmSend = async () => {
    if (!sendTarget || !user) return;

    const selectedTargets =
      (carts ?? []).filter((cart) =>
        sendTarget.includes(cart.cartId)
      );

    const ruleIds = selectedTargets
      .map((cart) => cart.ruleId)
      .filter(
        (ruleId): ruleId is number | string =>
          ruleId !== null &&
          ruleId !== undefined &&
          ruleId !== ''
      )
      .map((ruleId) => Number(ruleId))
      .filter((ruleId) =>
        Number.isFinite(ruleId)
      );

    if (ruleIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Rule ID missing',
        description:
          'The selected cart does not have a rule ID.',
      });

      return;
    }

    const uniqueRuleIds = Array.from(
      new Set(ruleIds)
    );

    if (uniqueRuleIds.length !== 1) {
      toast({
        variant: 'destructive',
        title: 'Different rules selected',
        description:
          'Please select carts that belong to the same rule.',
      });

      return;
    }

    const ruleId = uniqueRuleIds[0];

    if (!Number.isFinite(ruleId)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Rule ID',
        description:
          'The selected cart has an invalid rule ID.',
      });

      return;
    }

    setIsSending(true);

    try {
      console.log(
        'Sending abandoned cart reminder:',
        {
          merchantId: user.merchantId,
          cartIds: sendTarget,
          couponCode: couponCode.trim(),
          ruleId,
        }
      );

      const success = await sendReminder({
        merchantId: user.merchantId,
        cartIds: sendTarget,
        couponCode: couponCode.trim(),
        ruleId,
      });

      if (success) {
        toast({
          title:
            t.abandonedCarts
              .remindersSentTitle,

          description: fillTemplate(
            t.abandonedCarts
              .remindersSentDescription,
            {
              count:
                sendTarget.length,
            }
          ),
        });

        setSelectedCartIds((prev) =>
          prev.filter(
            (id) =>
              !sendTarget.includes(id)
          )
        );

        setSendTarget(null);
        setSelectedCartId(null);

        // Optimistic state is updated by sendReminder(). Refresh from the API
        // after the backend has had a moment to persist the new reminder data.
        window.setTimeout(() => {
          void fetchPage(
            page,
            appliedStartDate,
            appliedEndDate,
            status,
            search
          );
        }, 500);
      } else {
        toast({
          variant: 'destructive',
          title:
            t.abandonedCarts
              .failedToSendTitle,

          description:
            t.abandonedCarts
              .failedToSendDescription,
        });
      }
    } catch (error) {
      console.error(
        'Failed to send reminder:',
        error
      );

      toast({
        variant: 'destructive',
        title:
          t.abandonedCarts
            .failedToSendTitle,

        description:
          error instanceof Error
            ? error.message
            : t.abandonedCarts
                .failedToSendDescription,
      });
    } finally {
      setIsSending(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * EXPORT
   * ---------------------------------------------------------
   */

  const handleExport = async () => {
    if (!user || isExporting) return;

    setIsExporting(true);

    try {
      const allCarts =
        await exportAllCarts({
          merchantId:
            user.merchantId,

          startDate:
            appliedStartDate ||
            undefined,

          endDate:
            appliedEndDate ||
            undefined,

          /*
           * Export the selected status too.
           *
           * active
           * purchased
           */
          status:
            status ||
            undefined,
        });

      if (!allCarts?.length) {
        toast({
          variant: 'destructive',
          title: 'No carts to export',
          description:
            'No abandoned carts were found for the selected filters.',
        });

        return;
      }

      exportToExcel(
        allCarts.map((cart) => ({
          CartId: cart.cartId,
          Customer: cart.customerName,
          Email: cart.customerEmail,
          Mobile: cart.customerMobile,
          Total: cart.total,
          Currency: cart.currency,
          Status: getCartStatus(cart),
          SendCount: cart.sendCount,
          RuleId: cart.ruleId ?? '',
          CreatedAt: cart.createdAt,
        })),

        `chatgate-abandoned-carts-${format(
          new Date(),
          'yyyy-MM-dd'
        )}`,

        'Abandoned Carts'
      );

      toast({
        title:
          t.abandonedCarts
            .exportSuccessTitle,

        description:
          t.abandonedCarts
            .exportSuccessDescription,
      });
    } catch (error) {
      console.error(
        'Failed to export abandoned carts:',
        error
      );

      toast({
        variant: 'destructive',
        title: 'Export failed',
        description:
          'Failed to export abandoned carts. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * STATUS BADGE
   * ---------------------------------------------------------
   */

  const formatSaudiDate = (
    date: string | Date
  ) => {
    const parsedDate =
      new Date(date);

    return format(
      new Date(
        parsedDate.getTime() -
          3 * 60 * 60 * 1000
      ),
      'MMM d, yyyy h:mm a'
    );
  };

  const getStatusBadge = (
    cart: AbandonedCart
  ) => {
    const normalizedStatus = getCartStatus(cart);

    if (normalizedStatus === 'purchased') {
      return (
        <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/15 border-transparent">
          {t.abandonedCarts.statusPurchased}
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        {t.abandonedCarts.statusActive}
      </Badge>
    );
  };

  /*
   * ---------------------------------------------------------
   * INITIALS
   * ---------------------------------------------------------
   */

  const initials = (
    name: string
  ) =>
    (name || '?')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]?.toUpperCase()
      )
      .join('');

  /*
   * ---------------------------------------------------------
   * PAGINATION
   * ---------------------------------------------------------
   */

  // hasNextPage is updated from the latest page response.


  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t.abandonedCarts.title}
          </h1>

          <p className="text-muted-foreground mt-1">
            {t.abandonedCarts.subtitle}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />

          {isExporting
            ? 'Exporting...'
            : t.common.export}
        </Button>
      </div>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <Card className="rounded-xl border-border/70 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{t.abandonedCarts.filtersTitle}</p>
              <p className="text-xs text-muted-foreground">{t.abandonedCarts.filtersDescription}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">

            {/* START DATE */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {t.orders.startDate}
              </Label>
              <Input
                type="date"
                value={inputStartDate}
                onChange={(event) => {
                  const value = event.target.value;
                  setInputStartDate(value);
                  void applyFilters(value, inputEndDate, status);
                }}
                className="w-full rounded-lg bg-background/70 text-right"
                dir="ltr"
              />
            </div>

            {/* END DATE */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {t.orders.endDate}
              </Label>
              <Input
                type="date"
                value={inputEndDate}
                onChange={(event) => {
                  const value = event.target.value;
                  setInputEndDate(value);
                  void applyFilters(inputStartDate, value, status);
                }}
                className="w-full rounded-lg bg-background/70 text-right"
                dir="ltr"
              />
            </div>

            {/* STATUS */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {t.dashboard.status}
              </Label>
              <Select
                value={status || 'all'}
                onValueChange={(value) => {
                  const nextStatus =
                    value === 'all'
                      ? ''
                      : (value as CartStatus);

                  setStatus(nextStatus);
                  void applyFilters(
                    inputStartDate,
                    inputEndDate,
                    nextStatus
                  );
                }}
              >
                <SelectTrigger className="w-full rounded-lg bg-background/70 ltr:text-left rtl:text-right">
                  <SelectValue placeholder={t.abandonedCarts.viewAll} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.abandonedCarts.viewAll}</SelectItem>
                  <SelectItem value="purchased">
                    {t.abandonedCarts.statusPurchased}
                  </SelectItem>
                  <SelectItem value="active">
                    {t.abandonedCarts.statusActive}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>


            {/* SEARCH */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {t.common.search}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t.common.search}
                  className="w-full rounded-lg bg-background/70 pl-9"
                  dir="auto"
                />
              </div>
            </div>

            {/* FILTER ACTIONS */}
            <div className="flex flex-wrap items-center justify-end gap-2 sm:col-span-2 lg:col-span-1 rtl:flex-row-reverse">
              {(inputStartDate || inputEndDate || status || search) && (
                <Button
                  variant="ghost"
                  className="px-3"
                  onClick={handleResetFilters}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-1.5" />
                  {t.common.reset ?? 'Reset'}
                </Button>
              )}
            </div>
          </div>

          {(appliedStartDate || appliedEndDate || status) && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
              <span className="text-xs font-medium text-muted-foreground">
                {t.abandonedCarts.appliedFilters}
              </span>

              {(appliedStartDate || appliedEndDate) && (
                <Badge variant="secondary" className="rounded-md font-normal">
                  {appliedStartDate ?? t.abandonedCarts.any} → {appliedEndDate ?? t.abandonedCarts.any}
                </Badge>
              )}

              {status && (
                <Badge variant="secondary" className="rounded-md font-normal">
                  {status === 'purchased'
                    ? t.abandonedCarts.statusPurchased
                    : t.abandonedCarts.statusActive}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* =====================================================
          SELECTION TOOLBAR
      ====================================================== */}

      {selectedCartIds.length > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">

          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageCircle className="h-4 w-4 text-primary" />

            {selectedCartIds.length}{' '}
            {
              t.abandonedCarts
                .cartsSelectedSuffix
            }
          </div>

          <div className="flex items-center gap-2">

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setSelectedCartIds([])
              }
            >
              <X className="h-4 w-4 mr-1.5" />

              {
                t.abandonedCarts
                  .clear
              }
            </Button>

            <Button
              size="sm"
              onClick={() =>
                openSendDialog(
                  selectedCartIds
                )
              }
            >
              <Send className="h-4 w-4 mr-1.5" />

              {
                t.abandonedCarts
                  .sendReminder
              }
            </Button>

          </div>
        </div>
      )}

      {/* =====================================================
          TABLE
      ====================================================== */}

      <div className="border border-border/70 rounded-xl bg-card overflow-hidden shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full text-sm text-left">

            <thead className="text-[11px] tracking-wide text-muted-foreground bg-muted/40 uppercase border-b border-border/70">

              <tr>

                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-muted-foreground/40 accent-primary"
                    checked={
                      allOnPageSelected
                    }
                    onChange={(event) =>
                      handleSelectAll(
                        event.target.checked
                      )
                    }
                  />
                </th>

                <th className="px-6 py-3 font-medium">
                  {
                    t.abandonedCarts
                      .cart
                  }
                </th>

                <th className="px-6 py-3 font-medium">
                  {
                    t.abandonedCarts
                      .customer
                  }
                </th>

                <th className="px-6 py-3 font-medium">
                  {
                    t.abandonedCarts
                      .amount
                  }
                </th>

                <th className="px-6 py-3 font-medium">
                  {
                    t.abandonedCarts
                      .status
                  }
                </th>

                {/* <th className="px-6 py-3 font-medium">
                  {
                    t.abandonedCarts
                      .sendCount
                  }
                </th> */}

                <th className="px-6 py-3 font-medium">
                 {t.reminderRules.ruleId} 
                </th>

                <th className="px-6 py-3 font-medium text-right">
                  {
                    t.abandonedCarts
                      .date
                  }
                </th>

                <th className="px-6 py-3 font-medium text-right" />

              </tr>

            </thead>

            <tbody className="divide-y divide-border">

              {isLoading ? (

                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-10 text-center text-muted-foreground"
                  >
                    <div className="flex items-center justify-center">
                      <RotateCcw className="h-5 w-5 animate-spin mr-2" />

                      {
                        t.abandonedCarts
                          .loadingCarts
                      }
                    </div>
                  </td>
                </tr>

              ) : filteredCarts.length === 0 ? (

                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-14 text-center"
                  >
                    <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />

                    <p className="text-muted-foreground font-medium">
                      {
                        t.abandonedCarts
                          .noCartsFound
                      }
                    </p>

                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {
                        t.abandonedCarts
                          .tryAdjustingFilters
                      }
                    </p>
                  </td>
                </tr>

              ) : (

                filteredCarts.map((cart) => (

                  <tr
                    key={
                      cart.cartId
                    }
                    className={`group transition-colors ${
                      selectedCartIds.includes(
                        cart.cartId
                      )
                        ? 'bg-primary/5'
                        : 'hover:bg-muted/20'
                    }`}
                  >

                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-muted-foreground/40 accent-primary"
                        checked={selectedCartIds.includes(
                          cart.cartId
                        )}
                        onChange={() =>
                          toggleCart(
                            cart.cartId
                          )
                        }
                      />
                    </td>

                    <td
                      className="px-6 py-3 font-mono font-medium text-primary cursor-pointer"
                      onClick={() =>
                        setSelectedCartId(
                          cart.cartId
                        )
                      }
                    >
                      #{cart.cartId}
                    </td>

                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                          {initials(
                            cart.customerName
                          )}
                        </div>

                        <span className="font-medium text-foreground">
                          {
                            cart.customerName
                          }
                        </span>

                      </div>
                    </td>

                    <td className="px-6 py-3">
                      <div className="font-mono font-semibold">
                        {formatCurrency(
                          cart.total,
                          cart.currency
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-3">
                      {getStatusBadge(cart)}
                    </td>

                    {/* <td className="px-6 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5" />

                        {
                          cart.sendCount
                        }
                      </div>
                    </td> */}

                    <td className="px-6 py-3">
                      {cart.ruleId != null &&
                      String(
                        cart.ruleId
                      ).trim() !== '' ? (
                        <Badge
                          variant="outline"
                          className="font-mono"
                        >
                          {
                            cart.ruleId
                          }
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3 text-right text-muted-foreground text-xs whitespace-nowrap">
                      {formatSaudiDate(
                        cart.createdAt
                      )}
                    </td>

                    <td className="px-6 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          openSendDialog([
                            cart.cartId,
                          ])
                        }
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" />

                        {
                          t.abandonedCarts
                            .remind
                        }
                      </Button>
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

        {/* =================================================
            PAGINATION
        ================================================== */}

        {carts && carts.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <span className="text-xs text-muted-foreground">
              {t.abandonedCarts.page} {page}
              {cartsPage?.totalPagesKnown
                ? ` / ${cartsPage.totalPages}`
                : ''}
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1 rtl:rotate-180" />
                {t.abandonedCarts.previous}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={isLoading || !hasNextPage}
              >
                {t.abandonedCarts.next}
                <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* =====================================================
          CART DETAILS DIALOG
      ====================================================== */}

      <Dialog
        open={
          selectedCartId !== null
        }
        onOpenChange={(open) =>
          !open &&
          setSelectedCartId(null)
        }
      >

        <DialogContent className="sm:max-w-[500px]">

          <DialogHeader>

            <DialogTitle className="flex items-center gap-2">

              <span>
                {
                  t.abandonedCarts
                    .cartDetails
                }{' '}
                #
                {selectedCart?.cartId ??
                  '...'}
              </span>

              {selectedCart &&
                getStatusBadge(selectedCart)}

            </DialogTitle>

          </DialogHeader>

          {selectedCart ? (

            <div className="space-y-6 mt-2">

              <div className="flex justify-between items-start p-4 bg-muted/30 rounded-lg border border-border">

                <div>

                  <p className="text-sm text-muted-foreground">
                    {
                      t.abandonedCarts
                        .cartValue
                    }
                  </p>

                  <p className="text-3xl font-mono font-bold mt-1">
                    {formatCurrency(
                      selectedCart.total,
                      selectedCart.currency
                    )}
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-sm text-muted-foreground">
                    {
                      t.abandonedCarts
                        .sendCount
                    }
                  </p>

                  <div className="mt-1 flex justify-end items-center gap-1.5 font-medium">

                    <Send className="h-3.5 w-3.5 text-muted-foreground" />

                    {
                      selectedCart.sendCount
                    }

                  </div>

                </div>

              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">

                <span className="text-muted-foreground">
                 {t.reminderRules.ruleId}
                </span>

                <span className="font-mono font-semibold">
                  {selectedCart.ruleId ??
                    '—'}
                </span>

              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">

                <div>

                  <p className="text-muted-foreground mb-1">
                    {
                      t.abandonedCarts
                        .customer
                    }
                  </p>

                  <div className="font-medium">
                    {
                      selectedCart.customerName
                    }
                  </div>

                  {selectedCart.customerEmail && (
                    <div className="text-xs text-muted-foreground">
                      {
                        selectedCart.customerEmail
                      }
                    </div>
                  )}

                  {selectedCart.customerMobile && (
                    <div
                      className="text-xs text-muted-foreground"
                      dir="ltr"
                    >
                      {
                        selectedCart.customerMobile
                      }
                    </div>
                  )}

                </div>

                <div>

                  <p className="text-muted-foreground mb-1">
                    {
                      t.abandonedCarts
                        .abandonedOn
                    }
                  </p>

                  <p className="font-medium flex items-center gap-1.5">

                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />

                    {format(
                      new Date(
                        selectedCart.createdAt
                      ),
                      'PPp'
                    )}

                  </p>

                </div>

              </div>

              <div className="pt-4 border-t flex justify-end gap-2">

                <Button
                  onClick={() =>
                    openSendDialog([
                      selectedCart.cartId,
                    ])
                  }
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />

                  {
                    t.abandonedCarts
                      .sendReminder
                  }
                </Button>

                <Button
                  variant="outline"
                  className="gap-2"
                  asChild
                >

                  <a
                    href={
                      selectedCart.checkoutUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />

                    {
                      t.abandonedCarts
                        .viewCheckout
                    }
                  </a>

                </Button>

              </div>

            </div>

          ) : (

            <div className="py-8 text-center text-muted-foreground">
              {
                t.abandonedCarts
                  .failedToLoad
              }
            </div>

          )}

        </DialogContent>

      </Dialog>

      {/* =====================================================
          SEND REMINDER DIALOG
      ====================================================== */}

      <Dialog
        open={
          sendTarget !== null
        }
        onOpenChange={(open) =>
          !open &&
          !isSending &&
          setSendTarget(null)
        }
      >

        <DialogContent className="sm:max-w-[440px]">

          <DialogHeader>

            <DialogTitle className="flex items-center gap-2">

              <Send className="h-4 w-4 text-primary" />

              {
                t.abandonedCarts
                  .sendWhatsappReminderTitle
              }

            </DialogTitle>

            <DialogDescription>

              {sendTarget &&
              sendTarget.length > 1
                ? fillTemplate(
                    t.abandonedCarts
                      .sendReminderDescriptionMulti,
                    {
                      count:
                        sendTarget.length,
                    }
                  )
                : t.abandonedCarts
                    .sendReminderDescriptionSingle}

            </DialogDescription>

          </DialogHeader>

          <div className="space-y-4">

            {targetCarts.length > 0 && (

              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 max-h-40 overflow-y-auto">

                {targetCarts.map(
                  (cart) => (

                    <div
                      key={cart.cartId}
                      className="flex items-center justify-between text-sm"
                    >

                      <div className="flex flex-col">

                        <span className="text-foreground font-medium">
                          {
                            cart.customerName
                          }
                        </span>

                        <span className="text-xs text-muted-foreground">
                         {t.reminderRules.ruleId}
                        </span>

                      </div>

                      <span className="font-mono text-muted-foreground">
                        {formatCurrency(
                          cart.total,
                          cart.currency
                        )}
                      </span>

                    </div>

                  )
                )}

                {targetCarts.length > 1 && (

                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border/60">

                    <span className="text-muted-foreground">
                      {
                        t.abandonedCarts
                          .totalValue
                      }
                    </span>

                    <span className="font-mono font-semibold">
                      {formatCurrency(
                        targetTotal,
                        targetCarts[0]
                          ?.currency
                      )}
                    </span>

                  </div>

                )}

              </div>

            )}

            {/* RULE ID */}

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">

              <span className="text-muted-foreground">
              {t.reminderRules.ruleId}
              </span>

              <span className="font-mono font-semibold">
                {targetRuleId ??
                  '—'}
              </span>

            </div>

            <div className="space-y-1.5">

              <Label
                htmlFor="coupon-code"
                className="text-xs font-medium text-muted-foreground"
              >
                {
                  t.abandonedCarts
                    .discountCouponLabel
                }
              </Label>

              <div className="relative">

                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

                <Input
                  id="coupon-code"
                  placeholder={
                    t.abandonedCarts
                      .couponPlaceholder
                  }
                  value={couponCode}
                  onChange={(event) =>
                    setCouponCode(
                      event.target.value
                    )
                  }
                  className="pl-9"
                  disabled={isSending}
                />

              </div>

              <p className="text-xs text-muted-foreground">
                {
                  t.abandonedCarts
                    .couponHelperText
                }
              </p>

            </div>

          </div>

          <DialogFooter>

            <Button
              variant="outline"
              onClick={() =>
                setSendTarget(null)
              }
              disabled={isSending}
            >
              {
                t.abandonedCarts
                  .cancel
              }
            </Button>

            <Button
              onClick={
                handleConfirmSend
              }
              disabled={
                isSending ||
                targetRuleId ===
                  null
              }
            >

              {isSending ? (

                <>
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />

                  {
                    t.abandonedCarts
                      .sending
                  }
                </>

              ) : (

                <>
                  <Send className="h-4 w-4 mr-2" />

                  {
                    t.abandonedCarts
                      .send
                  }{' '}

                  {sendTarget &&
                  sendTarget.length > 1
                    ? `(${sendTarget.length})`
                    : ''}
                </>

              )}

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>
  );
}