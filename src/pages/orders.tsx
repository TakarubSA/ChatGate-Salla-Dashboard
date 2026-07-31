import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search,
  Calendar,
  Store,
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

  console.log({orders})
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-31');
  const [page, setPage] = useState(1);
  const { t } = useLanguage();
  const fetchPage = (targetPage: number) => {
    if (!user?.merchantId) return;
    loadOrders({
      merchantId: user.merchantId,
      startDate,
      endDate,
      page: targetPage,
      size: PAGE_SIZE,
    });
  };

  const handleLoad = () => {
    setPage(1);
    fetchPage(1);
  };

  console.log({user})

  useEffect(() => {
    if (!user?.merchantId) return;
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const goToPage = (targetPage: number) => {
    if (targetPage < 1 || (ordersPage && targetPage > ordersPage.totalPages)) return;
    setPage(targetPage);
    fetchPage(targetPage);
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (order: Order) =>
        order.customerName?.toLowerCase().includes(q) ||
        order.customerMobile?.toLowerCase().includes(q) ||
        order.sallaOrderId?.toLowerCase().includes(q) ||
        order.referenceId?.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const selectedOrder: Order | undefined = useMemo(
    () => orders.find((o: Order) => o.id === selectedOrderId),
    [orders, selectedOrderId]
  );

  const handleExport = () => {
    exportToExcel(
      orders.map((order: Order) => ({
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
      title: 'Export successful',
      description: 'Orders have been exported to Excel.',
    });
  };

  const formatCurrency = (amount: number | null, currency = 'SAR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount || 0);
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {<h1>{t.orders.title}</h1>}
          </h1>
          <p className="text-muted-foreground mt-1">
           <p>{t.orders.pageSubtitle}</p>

          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} title="Exports the currently loaded page only">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
             {t.orders.exportPage}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row items-end gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="space-y-1">
              <label>{t.orders.startDate}</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9 w-full sm:w-[180px]"
                />
              </div>
            </div>
            <div className="space-y-1">
            <label>{t.orders.endDate}</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9 w-full sm:w-[180px]"
                />
              </div>
            </div>
            {/* <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                {t.common}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Customer, mobile, order id..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full sm:w-[220px]"
                />
              </div>
            </div> */}
          </div>
       <Button>
  {isLoadingOrders
    ? t.orders.loading
    : t.orders.loadOrdersButton}
</Button>
        </div>

        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
                <tr>
           <th>{t.orders.order}</th>
<th>{t.orders.customer}</th>
<th>{t.orders.items}</th>
<th>{t.orders.total}</th>
<th>{t.orders.date}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingOrders ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center">
                        <RotateCcw className="h-5 w-5 animate-spin mr-2" />
                        {t.orders.loading}
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">
                        No orders found
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Try adjusting your filters or date range
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order: Order) => (
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

        {ordersPage && ordersPage.totalElements > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {t.orders.showingPage} {ordersPage.page} of {ordersPage.totalPages} ·{' '}
              {ordersPage.totalElements} {t.orders.totalOrders}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page - 1)}
                disabled={isLoadingOrders || page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={isLoadingOrders || page >= ordersPage.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

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
                  {t.orders.items}{selectedOrder.items ? ` (${selectedOrder.items.length})` : ''}
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
              Failed to load order details
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
