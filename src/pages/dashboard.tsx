import { useEffect, useMemo, useState } from 'react';
import { useMerchant, Order, AbandonedCart } from '@/hooks/use-merchant';
import { useAuth } from '@/hooks/use-auth';
import { StatCard } from '@/components/stat-card';
import { ShoppingCart, RefreshCw, Send, AlertCircle, Search, Clock, FileSpreadsheet, DollarSign, PackageCheck, MilestoneIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { exportToExcel } from '@/lib/export-excel';

type StatusFilter = string | 'all';

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

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-31');

  useEffect(() => {
    if (!user?.merchantId) return;
    loadOrders({ merchantId: user.merchantId, startDate, endDate });
    loadDashboard({ merchantId: user.merchantId, startDate, endDate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRefresh = () => {
    if (!user?.merchantId) return;
    loadOrders({ merchantId: user.merchantId, startDate, endDate });
    loadDashboard({ merchantId: user.merchantId, startDate, endDate });
  };

  const statuses = useMemo(() => {
    const set = new Set(orders.map((o) => o.status));
    return Array.from(set);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (status !== 'all') {
      list = list.filter((o) => o.status === status);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.customerName?.toLowerCase().includes(q) ||
          o.customerEmail?.toLowerCase().includes(q) ||
          o.customerMobile?.toLowerCase().includes(q) ||
          o.cartId?.toLowerCase().includes(q) ||
          o.orderId?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, search, status]);

  const stats = useMemo(() => {
    if (dashboard) {
      return {
        totalAbandon: dashboard.totalAbandoned,
        totalRevenue: dashboard.recoveredRevenue,
        sentCount: dashboard.successfulReminders,
        totalOrders: dashboard.totalOrders,
        totalSends: dashboard.remindersSent,
      };
    }
    const list = orders;
    const totalRevenue = list.reduce((sum, o) => sum + (o.price || 0), 0);
    const sentCount = list.filter((o) => o.status === 'sent').length;
    const failedCount = list.filter((o) => o.status === 'failed').length;
    const totalSends = list.reduce((sum, o) => sum + (o.sendCount || 0), 0);
    return { totalOrders: list.length, totalRevenue, sentCount, failedCount, totalSends };
  }, [dashboard, orders]);

  const getStatusBadge = (statusValue: string) => {
    switch (statusValue) {
      case 'pending':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{t.dashboard[statusValue]}</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{t.dashboard[statusValue]}</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{t.dashboard[statusValue]}</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{t.dashboard[statusValue]}</Badge>;
      case 'active':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{t.dashboard[statusValue]}</Badge>;
      case 'notified':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{t.dashboard[statusValue]}</Badge>;
      case 'order_created':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{t.dashboard[statusValue]}</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{t.dashboard[statusValue]}</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">{t.dashboard["active"]}</Badge>;
    }
  };

  const handleExport = () => {
    exportToExcel(
      orders.map((order) => ({
        Id: order.id,
        OrderId: order.id,
        Customer: order.customerName,
        Phone: order.customerMobile || '',
        Items: order.items.length,
Price: order.items.reduce((total, item) => total + item?.totalPrice!, 0),
        Status: "purchased",
        CreatedAt: order.createdAt,
      })),
      `chatgate-orders-${format(new Date(), 'yyyy-MM-dd')}`,
      'Orders',
    );
    toast({ title: t.dashboard.exportSuccessTitle, description: t.dashboard.exportSuccessDescription });
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.dashboard.title}</h1>
          <p className="text-muted-foreground mt-1">{t.dashboard.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {t.common.export}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingOrders || isLoadingDashboard}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingOrders || isLoadingDashboard ? 'animate-spin' : ''}`} />
            {t.common.refresh}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t.dashboard.totalAbandoned}
          value={isLoadingDashboard ? '...' : stats.totalAbandon}
          icon={<ShoppingCart className="h-4 w-4" />}
          // description={t.dashboard.cartsInLast30Days}
        />
        <StatCard
          title={t.dashboard.recoveredRevenue}
          value={isLoadingDashboard ? '...' : formatCurrency(stats.totalRevenue)}
          icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
          // description={`${stats.sentCount} sent`}
        />
        <StatCard
          title={t.dashboard.totalOrders}
          value={isLoadingDashboard ? '...' : stats.totalOrders}
          icon={<MilestoneIcon className="h-4 w-4 text-red-500" />}
          // description="Orders with delivery errors"
        />
        {/* <StatCard
          title={t.dashboard.remindersSent}
          value={isLoadingDashboard ? '...' : stats.totalSends}
          icon={<Send className="h-4 w-4" />}
          // description={t.dashboard.viaChannel}
        /> */}
      </div>
           <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            {/* <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.dashboard.searchCustomer}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div> */}
            {/* <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t.dashboard.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.common.allStatuses}</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[150px]"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[150px]"
              />
              <Button
                size="sm"
                onClick={handleRefresh}
                disabled={isLoadingOrders || isLoadingDashboard}
              >
                {t.common.load}
              </Button>
            </div>
          </div>
        </div>
        </div>

      {/* Recent Activity: Latest Orders + Latest Abandoned Carts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-emerald-500" />
              <h3 className="font-semibold text-sm text-foreground">{t.dashboard.latest_orders}</h3>
            </div>
            {isLoadingDashboard && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
          {console.log({dashboard})}
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {isLoadingDashboard ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                {t.dashboard.loading}
              </div>
            ) : !dashboard?.latestOrders || dashboard.latestOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              
              </div>
            ) : (
              dashboard.latestOrders.map((order: Order) => (
                <div key={order.id} className="px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">
                        {order.customerName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {order.customerMobile || order.customerEmail || t.dashboard.noContactInfo}
                      </div>
                      {order.errorResponse && (
                        <div className="text-[10px] text-red-600 mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1 inline shrink-0" />
                          <span className="truncate">{order.errorResponse}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">

                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{t.dashboard.purchased}</Badge>
                      <div className="text-xs font-mono font-semibold mt-1">
                        {formatCurrency(order.items.reduce((total, item) => total + item?.totalPrice!, 0),)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center text-[10px] text-muted-foreground mt-2">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
              <h3 className="font-semibold text-sm text-foreground">{t.dashboard.latest_abandon}</h3>
            </div>
            {isLoadingDashboard && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {isLoadingDashboard ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
               {t.dashboard.loading}
              </div>
            ) : !dashboard?.latestAbandoned || dashboard.latestAbandoned.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                No recent abandoned carts
              </div>
            ) : (
              dashboard.latestAbandoned.map((cart: AbandonedCart, idx) => (
                <div key={`${cart.cartId}-${idx}`} className="px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">
                        {cart.customerName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {cart.customerMobile || cart.customerEmail || t.dashboard.noContactInfo}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {getStatusBadge(cart?.status??"")}
                      <div className="text-xs font-mono font-semibold mt-1">
                        {formatCurrency(cart.total, cart.currency)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(new Date(cart.createdAt), 'MMM d, h:mm a')}
                    </div>
                    {cart.sendCount > 0 && (
                      <div className="text-[10px] text-muted-foreground flex items-center">
                        <Send className="h-3 w-3 mr-1" />
                        {cart.sendCount} {t.dashboard.sent}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

 
    </div>
  );
}