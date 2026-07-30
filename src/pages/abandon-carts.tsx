import { useEffect, useMemo, useState } from 'react';
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
  FileSpreadsheet,
  ShoppingCart,
  RotateCcw,
  Clock,
  ExternalLink,
  Send,
  Calendar,
  Tag,
  X,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { exportToExcel } from '@/lib/export-excel';
import { useMerchant, AbandonedCart } from '@/hooks/use-merchant';
import { useAuth } from '@/hooks/use-auth';

const PAGE_SIZE = 20;

const fillTemplate = (template: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replace(`{{${key}}}`, String(value)),
    template
  );

export default function AbandonCartsPage() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { carts, isLoading, loadCarts, sendReminder } = useMerchant();

  const [selectedCartIds, setSelectedCartIds] = useState<string[]>([]);
  const [selectedCartId, setSelectedCartId] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-31');
  const [page, setPage] = useState(1);

  // Dialog-driven reminder sending — target cart ids + coupon are set together
  const [sendTarget, setSendTarget] = useState<string[] | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchCarts = (targetPage: number) => {
    if (!user) return;
    loadCarts({
      merchantId: user.merchantId,
      startDate,
      endDate,
      page: targetPage,
      size: PAGE_SIZE,
    });
  };

  const handleLoad = () => {
    setPage(1);
    setSelectedCartIds([]);
    fetchCarts(1);
  };

  useEffect(() => {
    if (!user) return;
    fetchCarts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  const toggleCart = (cartId: string) => {
    setSelectedCartIds((prev) =>
      prev.includes(cartId) ? prev.filter((id) => id !== cartId) : [...prev, cartId]
    );
  };

  const selectedCart: AbandonedCart | undefined = useMemo(
    () => carts?.find((c) => c.cartId === selectedCartId),
    [carts, selectedCartId]
  );

  const targetCarts = useMemo(
    () => (carts ?? []).filter((c) => sendTarget?.includes(c.cartId)),
    [carts, sendTarget]
  );

  const targetTotal = useMemo(
    () => targetCarts.reduce((sum, c) => sum + (c.total || 0), 0),
    [targetCarts]
  );

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'SAR',
    }).format(amount || 0);
  };

  const openSendDialog = (cartIds: string[]) => {
    if (cartIds.length === 0) {
      toast({ variant: 'destructive', title: t.abandonedCarts.noCartsSelectedTitle });
      return;
    }
    setCouponCode('');
    setSendTarget(cartIds);
  };

  const handleConfirmSend = async () => {
    if (!sendTarget || !user) return;
    setIsSending(true);

    const success = await sendReminder({
      merchantId: user.merchantId,
      cartIds: sendTarget,
      couponCode: couponCode.trim(),
    });

    setIsSending(false);

    if (success) {
      toast({
        title: t.abandonedCarts.remindersSentTitle,
        description: fillTemplate(t.abandonedCarts.remindersSentDescription, {
          count: sendTarget.length,
        }),
      });
      setSelectedCartIds((prev) => prev.filter((id) => !sendTarget.includes(id)));
      setSendTarget(null);
      setSelectedCartId(null);
      fetchCarts(page);
    } else {
      toast({
        variant: 'destructive',
        title: t.abandonedCarts.failedToSendTitle,
        description: t.abandonedCarts.failedToSendDescription,
      });
    }
  };

  const handleExport = () => {
    exportToExcel(
      (carts ?? []).map((cart) => ({
        CartId: cart.cartId,
        Customer: cart.customerName,
        Email: cart.customerEmail,
        Mobile: cart.customerMobile,
        Total: cart.total,
        Currency: cart.currency,
        Status: cart.status,
        SendCount: cart.sendCount,
        CreatedAt: cart.createdAt,
      })),
      `chatgate-abandoned-carts-${format(new Date(), 'yyyy-MM-dd')}`,
      'Abandoned Carts'
    );
    toast({
      title: t.abandonedCarts.exportSuccessTitle,
      description: t.abandonedCarts.exportSuccessDescription,
    });
  };

  const getStatusBadge = (status: AbandonedCart['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary">{t.abandonedCarts.statusActive}</Badge>;
      case 'notified':
        return (
          <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/15 border-transparent">
            {t.abandonedCarts.statusNotified}
          </Badge>
        );
      case 'order_created':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 border-transparent">
            {t.abandonedCarts.statusRecovered}
          </Badge>
        );
      case 'expired':
        return <Badge variant="destructive">{t.abandonedCarts.statusExpired}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const initials = (name: string) =>
    (name || '?')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');

  const allOnPageSelected = carts.length > 0 && selectedCartIds.length === carts.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t.abandonedCarts.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.abandonedCarts.subtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {t.common.export}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t.orders.startDate}
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-9 w-[180px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  {t.orders.endDate}
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-9 w-[180px]"
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleLoad}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t.abandonedCarts.loadCarts}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selection toolbar */}
      {selectedCartIds.length > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageCircle className="h-4 w-4 text-primary" />
            {selectedCartIds.length} {t.abandonedCarts.cartsSelectedSuffix}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedCartIds([])}>
              <X className="h-4 w-4 mr-1.5" />
              {t.abandonedCarts.clear}
            </Button>
            <Button size="sm" onClick={() => openSendDialog(selectedCartIds)}>
              <Send className="h-4 w-4 mr-1.5" />
              {t.abandonedCarts.sendReminder}
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-muted-foreground/40 accent-primary"
                    checked={allOnPageSelected}
                    onChange={(e) =>
                      setSelectedCartIds(e.target.checked ? carts.map((c) => c.cartId) : [])
                    }
                  />
                </th>
                <th className="px-6 py-3 font-medium">{t.abandonedCarts.cart}</th>
                <th className="px-6 py-3 font-medium">{t.abandonedCarts.customer}</th>
                <th className="px-6 py-3 font-medium">{t.abandonedCarts.amount}</th>
                <th className="px-6 py-3 font-medium">{t.abandonedCarts.status}</th>
                <th className="px-6 py-3 font-medium">{t.abandonedCarts.sendCount}</th>
                <th className="px-6 py-3 font-medium text-right">{t.abandonedCarts.date}</th>
                <th className="px-6 py-3 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                    <div className="flex items-center justify-center">
                      <RotateCcw className="h-5 w-5 animate-spin mr-2" />
                      {t.abandonedCarts.loadingCarts}
                    </div>
                  </td>
                </tr>
              ) : carts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">
                      {t.abandonedCarts.noCartsFound}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {t.abandonedCarts.tryAdjustingFilters}
                    </p>
                  </td>
                </tr>
              ) : (
                carts.map((cart) => (
                  <tr
                    key={cart.cartId}
                    className={`group transition-colors ${
                      selectedCartIds.includes(cart.cartId) ? 'bg-primary/5' : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-muted-foreground/40 accent-primary"
                        checked={selectedCartIds.includes(cart.cartId)}
                        onChange={() => toggleCart(cart.cartId)}
                      />
                    </td>

                    <td
                      className="px-6 py-3 font-mono font-medium text-primary cursor-pointer"
                      onClick={() => setSelectedCartId(cart.cartId)}
                    >
                      #{cart.cartId}
                    </td>

                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                          {initials(cart.customerName)}
                        </div>
                        <span className="font-medium text-foreground">{cart.customerName}</span>
                      </div>
                    </td>

                    <td className="px-6 py-3">
                      <div className="font-mono font-semibold">
                        {formatCurrency(cart.total, cart.currency)}
                      </div>
                    </td>

                    <td className="px-6 py-3">{getStatusBadge(cart.status)}</td>

                    <td className="px-6 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5" />
                        {cart.sendCount}
                      </div>
                    </td>

                    <td className="px-6 py-3 text-right text-muted-foreground text-xs whitespace-nowrap">
                      {format(new Date(cart.createdAt), 'MMM d, yyyy')}
                    </td>

                    <td className="px-6 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => openSendDialog([cart.cartId])}
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        {t.abandonedCarts.remind}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <span className="text-xs text-muted-foreground">
            {t.abandonedCarts.page} {page}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t.abandonedCarts.previous}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={carts.length < PAGE_SIZE || isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              {t.abandonedCarts.next}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cart details dialog */}
      <Dialog open={selectedCartId !== null} onOpenChange={(open) => !open && setSelectedCartId(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>
                {t.abandonedCarts.cartDetails} #{selectedCart?.cartId || '...'}
              </span>
              {selectedCart && getStatusBadge(selectedCart.status)}
            </DialogTitle>
          </DialogHeader>

          {selectedCart ? (
            <div className="space-y-6 mt-2">
              <div className="flex justify-between items-start p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <p className="text-sm text-muted-foreground">{t.abandonedCarts.cartValue}</p>
                  <p className="text-3xl font-mono font-bold mt-1">
                    {formatCurrency(selectedCart.total, selectedCart.currency)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t.abandonedCarts.sendCount}</p>
                  <div className="mt-1 flex justify-end items-center gap-1.5 font-medium">
                    <Send className="h-3.5 w-3.5 text-muted-foreground" />
                    {selectedCart.sendCount}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">{t.abandonedCarts.customer}</p>
                  <div className="font-medium">{selectedCart.customerName}</div>
                  {selectedCart.customerEmail && (
                    <div className="text-xs text-muted-foreground">{selectedCart.customerEmail}</div>
                  )}
                  {selectedCart.customerMobile && (
                    <div className="text-xs text-muted-foreground" dir="ltr">
                      {selectedCart.customerMobile}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">{t.abandonedCarts.abandonedOn}</p>
                  <p className="font-medium flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    {format(new Date(selectedCart.createdAt), 'PPp')}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <Button onClick={() => openSendDialog([selectedCart.cartId])} className="gap-2">
                  <Send className="h-4 w-4" />
                  {t.abandonedCarts.sendReminder}
                </Button>

                <Button variant="outline" className="gap-2" asChild>
                  <a href={selectedCart.checkoutUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    {t.abandonedCarts.viewCheckout}
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {t.abandonedCarts.failedToLoad}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send reminder + coupon dialog */}
      <Dialog open={sendTarget !== null} onOpenChange={(open) => !open && !isSending && setSendTarget(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              {t.abandonedCarts.sendWhatsappReminderTitle}
            </DialogTitle>
            <DialogDescription>
              {sendTarget && sendTarget.length > 1
                ? fillTemplate(t.abandonedCarts.sendReminderDescriptionMulti, {
                    count: sendTarget.length,
                  })
                : t.abandonedCarts.sendReminderDescriptionSingle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {targetCarts.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 max-h-40 overflow-y-auto">
                {targetCarts.map((c) => (
                  <div key={c.cartId} className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">{c.customerName}</span>
                    <span className="font-mono text-muted-foreground">
                      {formatCurrency(c.total, c.currency)}
                    </span>
                  </div>
                ))}
                {targetCarts.length > 1 && (
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border/60">
                    <span className="text-muted-foreground">{t.abandonedCarts.totalValue}</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(targetTotal, targetCarts[0]?.currency)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="coupon-code" className="text-xs font-medium text-muted-foreground">
                {t.abandonedCarts.discountCouponLabel}
              </Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="coupon-code"
                  placeholder={t.abandonedCarts.couponPlaceholder}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="pl-9"
                  disabled={isSending}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t.abandonedCarts.couponHelperText}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendTarget(null)} disabled={isSending}>
              {t.abandonedCarts.cancel}
            </Button>
            <Button onClick={handleConfirmSend} disabled={isSending}>
              {isSending ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  {t.abandonedCarts.sending}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t.abandonedCarts.send} {sendTarget && sendTarget.length > 1 ? `(${sendTarget.length})` : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
