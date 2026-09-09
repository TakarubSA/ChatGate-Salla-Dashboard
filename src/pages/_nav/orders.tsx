import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileSpreadsheet,
  ShoppingCart,
  RotateCcw,
  Clock,
  Hash,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel } from '@/lib/export-excel';
import { useMerchant, Order } from '@/hooks/use-merchant';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';

const PAGE_SIZE = 20;

export default function OrdersPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { orders, ordersPage, loadOrders, isLoadingOrders } = useMerchant();
  const { t } = useLanguage();


  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const requestIdRef = useRef(0);

  const fetchPage = async (targetPage: number) => {
    if (!user?.merchantId) return;

    const requestId = ++requestIdRef.current;

    const result = await loadOrders({
      merchantId: user.merchantId,
      startDate,
      endDate,
      page: targetPage,
      size: PAGE_SIZE,
    });

    if (requestId !== requestIdRef.current) return;

    if (!result) {
      setHasNextPage(false);
      return;
    }

    // Match abandoned-carts pagination:
    // raw-array APIs expose only whether another page exists.
    setHasNextPage(
      result.hasNextPage ??
        (result.content?.length === PAGE_SIZE)
    );
  };

  useEffect(() => {
    if (!user?.merchantId) return;
    setPage(1);
    void fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, startDate, endDate]);

  const goToPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage === page) return;
    if (targetPage > page && !hasNextPage) return;

    setPage(targetPage);
    void fetchPage(targetPage);
  };

  const selectedOrder: Order | undefined = useMemo(
    () => (orders ?? []).find((o: Order) => o.id === selectedOrderId),
    [orders, selectedOrderId]
  );

  const handleExport = () => {
    exportToExcel(
      (orders ?? []).map((order: Order) => ({
        Id: order.id,
        SallaOrderId: order.sallaOrderId,
        ReferenceId: order.referenceId,
        Customer: order.customerName,
        Mobile: order.customerMobile,
        Total: order.total,
        ItemsCount: order.items?.length ?? '',
        StoreId: order.installedStoreId,
        CreatedAt: order.createdAt,
      })),
      `chatgate-orders-${format(new Date(), 'yyyy-MM-dd')}`,
      'Orders'
    );
    toast({
      title: t.orders.exportSuccessTitle,
      description: t.orders.exportSuccessDescription,
    });
  };

  const formatCurrency = (amount: number | null, currency = 'SAR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t.orders.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.orders.pageSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            title={t.orders.exportPageHint}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {t.orders.exportPage}
          </Button>
        </div>
      </div>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <Card className="rounded-xl border-border/70 shadow-sm">
        <CardContent className="p-4 sm:p-5">

          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t.orders.filtersTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.orders.filtersDescription}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">

            {/* START DATE */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                {t.orders.startDate}
              </Label>

              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
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
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-lg bg-background/70 text-right"
                dir="ltr"
              />
            </div>

            <div className="hidden lg:block" />

            {/* FILTER ACTIONS */}
            <div className="flex flex-wrap items-center justify-end gap-2 sm:col-span-2 lg:col-span-1 rtl:flex-row-reverse">

              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  className="px-3"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  disabled={isLoadingOrders}
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  {t.common.reset}
                </Button>
              )}

              {isLoadingOrders && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  {t.orders.loading}
                </div>
              )}
            </div>
          </div>

          {(startDate || endDate) && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
              <span className="text-xs font-medium text-muted-foreground">
                {t.orders.appliedFilters}
              </span>

              <span className="rounded-md bg-muted px-2.5 py-1 text-xs text-foreground">
                {startDate || t.orders.any} → {endDate || t.orders.any}
              </span>
            </div>
          )}

        </CardContent>
      </Card>

        <div className="border border-border/70 rounded-xl bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] tracking-wide text-muted-foreground bg-muted/40 uppercase border-b border-border/70">
                <tr>
                  <th className="px-6 py-3 font-medium">{t.orders.order}</th>
                  <th className="px-6 py-3 font-medium">{t.orders.customer}</th>
                  <th className="px-6 py-3 font-medium">{t.orders.items}</th>
                  <th className="px-6 py-3 font-medium">{t.orders.total}</th>
                  <th className="px-6 py-3 font-medium text-right">{t.orders.date}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingOrders ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                      <div className="flex items-center justify-center">
                        <RotateCcw className="h-5 w-5 animate-spin mr-2" />
                        {t.orders.loading}
                      </div>
                    </td>
                  </tr>
                ) : !orders || orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center">
                      <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">
                        {t.orders.noOrdersFound}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {t.orders.noOrdersDescription}
                      </p>
                    </td>
                  </tr>
                ) : (
                  (orders ?? []).map((order: Order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <td className="px-6 py-4 font-mono font-medium text-primary group-hover:underline">
                        <div>#{order.sallaOrderId}</div>
                        {order.referenceId && (
                          <div className="text-xs text-muted-foreground font-normal">
                            {t.orders.reference}: {order.referenceId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">
                          {order.customerName}
                        </div>
                        {order.customerMobile && (
                          <div className="text-xs text-muted-foreground" dir="ltr">
                            {order.customerMobile}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5" />
                          {order.items?.length ?? 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono font-semibold">
                          {formatCurrency(order.total)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground text-xs whitespace-nowrap">
                        {format(new Date(order.createdAt), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {orders && orders.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <span className="text-xs text-muted-foreground">
              {t.orders.showingPage} {page}
              {ordersPage?.totalPagesKnown
                ? ` / ${ordersPage.totalPages}`
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
                {t.orders.previous}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={isLoadingOrders || !hasNextPage}
              >
                {t.orders.next}
                <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        )}

      <Dialog open={selectedOrderId !== null} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{t.orders.orderNumber} #{selectedOrder?.sallaOrderId || '...'}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedOrder ? (
            <div className="space-y-6 mt-4">
              <div className="flex justify-between items-start p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <p className="text-sm text-muted-foreground">{t.orders.total}</p>
                  <p className="text-3xl font-mono font-bold mt-1">
                    {formatCurrency(selectedOrder.total)}
                  </p>
                  {selectedOrder.referenceId && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {t.orders.reference}: {selectedOrder.referenceId}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">{t.orders.customer}</p>
                  <div className="font-medium">{selectedOrder.customerName}</div>
                  {selectedOrder.customerMobile && (
                    <div className="text-xs text-muted-foreground" dir="ltr">
                      {selectedOrder.customerMobile}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">{t.orders.createdOn}</p>
                  <p className="font-medium flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {format(new Date(selectedOrder.createdAt), 'PPp')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground mb-2 text-sm">
                  {t.orders.items}
                  {selectedOrder.items ? ` (${selectedOrder.items.length})` : ''}
                </p>
                <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3">
                        <div className="h-12 w-12 rounded-md border border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.sku ? `SKU: ${item.sku} · ` : ''}
                            {t.orders.qty} * {item.totalPrice}
                          </p>
                        </div>
                        <div className="font-mono font-semibold text-sm shrink-0">
                          {formatCurrency(item.totalPrice)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {t.orders.noLineItems}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {t.orders.failedToLoad}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
