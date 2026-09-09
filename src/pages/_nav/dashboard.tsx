import { useEffect, useMemo, useState } from 'react';
import {
  useMerchant,
  Order,
  AbandonedCart,
} from '@/hooks/use-merchant';
import { useAuth } from '@/hooks/use-auth';
import { StatCard } from '@/components/stat-card';

import {
  ShoppingCart,
  RefreshCw,
  Send,
  AlertCircle,
  Clock,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Activity,
  CalendarDays,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { format, subDays } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { exportToExcel } from '@/lib/export-excel';

type DateRange = '7' | '14' | '30';

export default function DashboardPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();

  const {
    orders,
    isLoadingOrders,
    loadOrders,
    dashboard,
    isLoadingDashboard,
    loadDashboard,
  } = useMerchant();

  /*
   * ============================================================
   * DATE RANGE
   * ============================================================
   */

  const [dateRange, setDateRange] =
    useState<DateRange>('7');

  /*
   * Calculate dates for the selected range.
   *
   * Example:
   * 7 days  -> today - 7 days
   * 14 days -> today - 14 days
   * 30 days -> today - 30 days
   */

  const getDateRange = () => {
    const endDate = new Date();
    const startDate = subDays(
      endDate,
      Number(dateRange)
    );

    return {
      startDate: format(
        startDate,
        "yyyy-MM-dd'T'00:00:00"
      ),
      endDate: format(
        endDate,
        "yyyy-MM-dd'T'23:59:59"
      ),
    };
  };

  /*
   * ============================================================
   * LOAD DASHBOARD
   * ============================================================
   */

  useEffect(() => {
    if (!user?.merchantId) return;

    const { startDate, endDate } =
      getDateRange();

    loadOrders({
      merchantId: user.merchantId,
      startDate,
      endDate,
    });

    loadDashboard({
      merchantId: user.merchantId,
      startDate,
      endDate,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user?.merchantId,
    dateRange,
  ]);

  /*
   * ============================================================
   * CHANGE DATE RANGE
   * ============================================================
   */

  const handleDateRangeChange = (
    value: string
  ) => {
    setDateRange(value as DateRange);
  };

  /*
   * ============================================================
   * REFRESH
   * ============================================================
   */

  const handleRefresh = () => {
    if (!user?.merchantId) return;

    const { startDate, endDate } =
      getDateRange();

    loadOrders({
      merchantId: user.merchantId,
      startDate,
      endDate,
    });

    loadDashboard({
      merchantId: user.merchantId,
      startDate,
      endDate,
    });
  };

  /*
   * ============================================================
   * DASHBOARD STATS
   * ============================================================
   *
   * Only displaying:
   *
   * - Total Abandoned
   * - Total Orders
   * - Successful Reminders
   * - Failed Reminders
   *
   * We intentionally do NOT display:
   *
   * - remindersSent
   * - recoveredRevenue
   */

  const stats = useMemo(() => {
    return {
      totalAbandoned:
        dashboard?.totalAbandoned ?? 0,

      totalOrders:
        dashboard?.totalOrders ?? 0,

      successfulReminders:
        dashboard?.successfulReminders ?? 0,

      failedReminders:
        dashboard?.failedReminders ?? 0,
    };
  }, [dashboard]);

  /*
   * ============================================================
   * CURRENCY FORMATTER
   * ============================================================
   */

  const formatCurrency = (
    amount: number | null | undefined,
    currency = 'SAR'
  ) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  /*
   * ============================================================
   * CART STATUS
   * ============================================================
   *
   * Dashboard only displays:
   *
   * Active
   * Purchased
   */

  const getCartStatusBadge = (
    cart: AbandonedCart
  ) => {
    const rawStatus = String(
      cart?.status ?? ''
    )
      .trim()
      .toLowerCase();

    const isPurchased =
      rawStatus === 'purchased' ||
      rawStatus === 'recovered' ||
      rawStatus === 'order_created' ||
      cart?.recovered === true;

    if (isPurchased) {
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200"
        >
          {t.dashboard.purchased}
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200"
      >
        {t.dashboard.active}
      </Badge>
    );
  };

  /*
   * ============================================================
   * EXPORT ORDERS
   * ============================================================
   */

  const handleExport = () => {
    exportToExcel(
      orders.map((order) => ({
        Id: order.id,

        OrderId: order.id,

        Customer: order.customerName,

        Phone:
          order.customerMobile || '',

        Items:
          order.items.length,

        Price:
          order.items.reduce(
            (total, item) =>
              total +
              (item?.totalPrice || 0),
            0
          ),

        Status: 'purchased',

        CreatedAt:
          order.createdAt,
      })),
      `chatgate-orders-${format(
        new Date(),
        'yyyy-MM-dd'
      )}`,
      'Orders'
    );

    toast({
      title:
        t.dashboard.exportSuccessTitle,

      description:
        t.dashboard.exportSuccessDescription,
    });
  };

  /*
   * ============================================================
   * DATE RANGE LABEL
   * ============================================================
   */

  const dateRangeLabel =
    dateRange === '7'
      ? t.dashboard.last7Days
      : dateRange === '14'
      ? t.dashboard.last14Days
      : t.dashboard.last30Days;

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>

          <div className="flex items-center gap-2">

            {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <Activity className="h-4 w-4 text-emerald-600" />
            </div> */}

               <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t.dashboard.title}
          </h1>


          </div>

        </div>

        {/* Actions */}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">

          {/* Date Range */}

          <div className="flex items-center gap-2">

            <CalendarDays className="h-4 w-4 text-muted-foreground" />

            <Select
              value={dateRange}
              onValueChange={
                handleDateRangeChange
              }
            >

              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="7">
                  {t.dashboard.last7Days}
                </SelectItem>

                <SelectItem value="14">
                  {t.dashboard.last14Days}
                </SelectItem>

                <SelectItem value="30">
                  {t.dashboard.last30Days}
                </SelectItem>

              </SelectContent>

            </Select>

          </div>

          {/* Refresh */}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={
              isLoadingOrders ||
              isLoadingDashboard
            }
          >

            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                isLoadingOrders ||
                isLoadingDashboard
                  ? 'animate-spin'
                  : ''
              }`}
            />

            {t.common.refresh}

          </Button>

        </div>

      </div>

      {/* ======================================================
          SELECTED RANGE
      ====================================================== */}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">

        <CalendarDays className="h-4 w-4" />

        <span>
          {dateRangeLabel}
        </span>

      </div>

      {/* ======================================================
          OVERVIEW
      ====================================================== */}

      <div>

        <div className="flex items-center justify-between mb-4">

          <div>

            <h2 className="text-base font-semibold text-foreground">
              {t.dashboard.overview}
            </h2>

            <p className="text-xs text-muted-foreground mt-0.5">
              {t.dashboard.overviewDescription}
            </p>

          </div>

        </div>

        {/* ==================================================
            DASHBOARD CARDS
        ================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Total Abandoned */}

          <div className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">

            <StatCard
              title={
                t.dashboard.totalAbandoned
              }

              value={
                isLoadingDashboard
                  ? '...'
                  : stats.totalAbandoned
              }

              icon={
                <ShoppingCart className="h-4 w-4 text-blue-500" />
              }
            />

          </div>

          {/* Total Orders */}

          <div className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">

            <StatCard
              title={
                t.dashboard.totalOrders
              }

              value={
                isLoadingDashboard
                  ? '...'
                  : stats.totalOrders
              }

              icon={
                <PackageCheck className="h-4 w-4 text-emerald-500" />
              }
            />

          </div>
    

        </div>

      </div>

      {/* ======================================================
          RECENT ACTIVITY
      ====================================================== */}

      <div className="space-y-6">

        {/* ====================================================
            LATEST ORDERS
        ==================================================== */}

        <div>

          <div className="flex items-center gap-2 mb-3">

            <div className="h-2 w-2 rounded-full bg-emerald-500" />

            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {dateRangeLabel}
            </span>

          </div>

          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">

            {/* Header */}

            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                  <PackageCheck className="h-4 w-4 text-emerald-600" />
                </div>

                <div>

                  <h3 className="font-semibold text-sm text-foreground">
                    {t.dashboard.latest_orders}
                  </h3>

                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.dashboard.recentOrdersDescription}
                  </p>

                </div>

              </div>

              {isLoadingDashboard && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}

            </div>

            {/* Orders */}

            <div className="divide-y divide-border max-h-96 overflow-y-auto">

              {isLoadingDashboard ? (

                <div className="px-5 py-12 text-center text-sm text-muted-foreground">

                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-3" />

                  {t.dashboard.loading}

                </div>

              ) : !dashboard?.latestOrders ||
                dashboard.latestOrders.length === 0 ? (

                <div className="px-5 py-12 text-center">

                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">

                    <PackageCheck className="h-5 w-5 text-muted-foreground" />

                  </div>

                  <p className="text-sm font-medium text-foreground mt-3">
                    {t.dashboard.noRecentOrders}
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    {t.dashboard.noOrdersInPeriod}
                  </p>

                </div>

              ) : (

                dashboard.latestOrders.map(
                  (order: Order) => {

                    const orderTotal =
                      order.items.reduce(
                        (total, item) =>
                          total +
                          (item?.totalPrice || 0),
                        0
                      );

                    return (
                      <div
                        key={order.id}
                        className="px-5 py-4 hover:bg-muted/30 transition-colors"
                      >

                        <div className="flex items-start justify-between gap-3">

                          {/* Customer */}

                          <div className="min-w-0">

                            <div className="font-medium text-sm text-foreground truncate">
                              {order.customerName}
                            </div>

                            <div className="text-xs text-muted-foreground mt-1">
                              {order.customerMobile ||
                                order.customerEmail ||
                                t.dashboard.noContactInfo}
                            </div>

                            {order.errorResponse && (
                              <div className="text-[10px] text-red-600 mt-2 flex items-center">

                                <AlertCircle className="h-3 w-3 mr-1 shrink-0" />

                                <span className="truncate">
                                  {order.errorResponse}
                                </span>

                              </div>
                            )}

                          </div>

                          {/* Order info */}

                          <div className="text-right shrink-0">

                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200"
                            >
                              {t.dashboard.purchased}
                            </Badge>

                            <div className="text-sm font-semibold mt-1">
                              {formatCurrency(
                                orderTotal
                              )}
                            </div>

                          </div>

                        </div>

                        {/* Date */}

                        <div className="flex items-center text-[10px] text-muted-foreground mt-3">

                          <Clock className="h-3 w-3 mr-1" />

                          {format(
                            new Date(
                              order.createdAt
                            ),
                            'MMM d, h:mm a'
                          )}

                        </div>

                      </div>
                    );
                  }
                )

              )}

            </div>

          </div>

        </div>

        {/* ====================================================
            LATEST ABANDONED CARTS
        ==================================================== */}

        <div>

          <div className="flex items-center gap-2 mb-3">

            <div className="h-2 w-2 rounded-full bg-blue-500" />

            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {dateRangeLabel}
            </span>

          </div>

          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">

            {/* Header */}

            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">

                  <ShoppingCart className="h-4 w-4 text-blue-600" />

                </div>

                <div>

                  <h3 className="font-semibold text-sm text-foreground">
                    {t.dashboard.latest_abandon}
                  </h3>

                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.dashboard.recentAbandonedDescription}
                  </p>

                </div>

              </div>

              {isLoadingDashboard && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}

            </div>

            {/* Carts */}

            <div className="divide-y divide-border max-h-96 overflow-y-auto">

              {isLoadingDashboard ? (

                <div className="px-5 py-12 text-center text-sm text-muted-foreground">

                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-3" />

                  {t.dashboard.loading}

                </div>

              ) : !dashboard?.latestAbandoned ||
                dashboard.latestAbandoned.length === 0 ? (

                <div className="px-5 py-12 text-center">

                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">

                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />

                  </div>

                  <p className="text-sm font-medium text-foreground mt-3">
                    {t.dashboard.noRecentAbandonedCarts}
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    {t.dashboard.noAbandonedInPeriod}
                  </p>

                </div>

              ) : (

                dashboard.latestAbandoned.map(
                  (
                    cart: AbandonedCart,
                    idx
                  ) => (

                    <div
                      key={`${cart.cartId}-${idx}`}
                      className="px-5 py-4 hover:bg-muted/30 transition-colors"
                    >

                      <div className="flex items-start justify-between gap-3">

                        {/* Customer */}

                        <div className="min-w-0">

                          <div className="font-medium text-sm text-foreground truncate">
                            {cart.customerName}
                          </div>

                          <div className="text-xs text-muted-foreground mt-1">
                            {cart.customerMobile ||
                              cart.customerEmail ||
                              t.dashboard.noContactInfo}
                          </div>

                        </div>

                        {/* Cart info */}

                        <div className="text-right shrink-0">

                          {getCartStatusBadge(cart)}

                          <div className="text-sm font-semibold mt-1">
                            {formatCurrency(
                              cart.total,
                              cart.currency
                            )}
                          </div>

                        </div>

                      </div>

                      {/* Bottom */}

                      <div className="flex items-center justify-between mt-3">

                        <div className="flex items-center text-[10px] text-muted-foreground">

                          <Clock className="h-3 w-3 mr-1" />

                          {format(
                            new Date(
                              cart.createdAt
                            ),
                            'MMM d, h:mm a'
                          )}

                        </div>

                        {cart.sendCount > 0 && (

                          <div className="text-[10px] text-muted-foreground flex items-center">

                            <Send className="h-3 w-3 mr-1" />

                            {cart.sendCount}{' '}
                            {t.dashboard.sent}

                          </div>

                        )}

                      </div>

                    </div>

                  )
                )

              )}

            </div>

          </div>

        </div>

      </div>


    </div>
  );
}