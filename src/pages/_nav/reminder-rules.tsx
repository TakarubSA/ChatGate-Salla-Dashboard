import React, { useState } from 'react';

import { Bell, Plus, Pencil, Trash2, Tag, Percent, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';
import {
  useListReminderRules,
  useCreateReminderRule,
  useUpdateReminderRule,
  useToggleReminderRule,
  ReminderRule,
  deleteReminderRule,
} from "@/hooks/use-reminder-rules";

interface RuleFormState {
  abandonedHours: string;
  cartTotalMin: string;
  coupon: string;
  couponValue: string;
}

const emptyForm: RuleFormState = {
  abandonedHours: '',
  cartTotalMin: '',
  coupon: '',
  couponValue: '',
};

export default function ReminderRulesPage() {
  const { data: rules, isLoading } = useListReminderRules();
  const createRule = useCreateReminderRule();
  const updateRule = useUpdateReminderRule();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReminderRule | null>(null);
  const [form, setForm] = useState<RuleFormState>(emptyForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);
const toggleRule = useToggleReminderRule();

const handleToggleActive = (rule: ReminderRule, active: boolean) => {
  toggleRule.mutate(
    {
      id: rule.id,
      active,
    },
    {
      onSuccess: () => {
        invalidate();
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: t.reminderRules.errorGeneric,
        });
      },
    }
  );
};

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/reminder-rules'] });
  };

  const openCreateDialog = () => {
    setEditingRule(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (rule: ReminderRule) => {
    setEditingRule(rule);
    setForm({
      abandonedHours: String(rule.abandonedHours),
      cartTotalMin: rule.cartTotalMin !== null ? String(rule.cartTotalMin) : '',
      coupon: rule.coupon || '',
      couponValue: rule.couponValue !== null ? String(rule.couponValue) : '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseInt(form.abandonedHours, 10);
    if (!hours || hours < 1) return;

const createPayload = {
  abandonedHours: hours,
  isActive: true,
  ...(form.cartTotalMin
    ? { cartTotalMin: parseFloat(form.cartTotalMin) }
    : {}),
  ...(form.coupon
    ? { coupon: form.coupon }
    : {}),
  ...(form.couponValue
    ? { couponValue: parseFloat(form.couponValue) }
    : {}),
};

console.log("Create Payload", createPayload);
console.log("Merchant", user?.merchantId);


    if (editingRule) {
      // On edit, explicitly send `null` for cleared optional fields so the
      // server removes them rather than leaving the previous value in place.
const updatePayload = {
  isActive: editingRule.isActive,
  abandonedHours: hours,
  cartTotalMin: form.cartTotalMin
    ? parseFloat(form.cartTotalMin)
    : null,
  coupon: form.coupon || null,
  couponValue: form.couponValue
    ? parseFloat(form.couponValue)
    : null,
};
      updateRule.mutate(
        { id: editingRule.id, data: updatePayload },
        {
          onSuccess: () => {
            toast({ title: t.reminderRules.updateSuccess });
            setIsDialogOpen(false);
            invalidate();
          },
          onError: () => {
            toast({ variant: 'destructive', title: t.reminderRules.errorGeneric });
          },
        },
      );
    } else {
      createRule.mutate(
        { data: createPayload },
        {
          onSuccess: () => {
            toast({ title: t.reminderRules.createSuccess });
            setIsDialogOpen(false);
            invalidate();
          },
          onError: () => {
            toast({ variant: 'destructive', title: t.reminderRules.errorGeneric });
          },
        },
      );
    }
  };


  const handleDelete = async (rule: ReminderRule) => {
    if (!confirm(t.reminderRules.deleteConfirm)) return;
    try {
      setDeletingId(rule.id);
      await deleteReminderRule(rule.id, user?.token);
      toast({ title: t.reminderRules.deleteSuccess });
      invalidate();
    } catch {
      toast({ variant: 'destructive', title: t.reminderRules.errorGeneric });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.reminderRules.title}</h1>
          <p className="text-muted-foreground mt-1">{t.reminderRules.subtitle}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          {t.reminderRules.createNew}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">...</div>
      ) : !rules || rules.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl py-16 text-center">
          <Bell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">{t.reminderRules.noRules}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">{t.reminderRules.noRulesDescription}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="border border-border bg-card rounded-xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {t.reminderRules.reminderAfter} {rule.abandonedHours} {t.reminderRules.hours}
                  </h3>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5 font-mono">
                    {t.reminderRules.ruleId}: #{rule.id}
                  </p>
                </div>
                <Switch
                  checked={rule.isActive}
                  onCheckedChange={(checked) => handleToggleActive(rule, checked)}
                />
              </div>

              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Wallet className="h-3.5 w-3.5" />
                  <span>
                    {t.reminderRules.cartTotalLabel}:{' '}
                    {rule.cartTotalMin !== null ? rule.cartTotalMin.toFixed(2) : t.reminderRules.noCartTotal}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5" />
                  <span>
                    {t.reminderRules.couponLabel}: {rule.coupon || t.reminderRules.noCoupon}
                  </span>
                </div>
                {rule.couponValue !== null && (
                  <div className="flex items-center gap-2">
                    <Percent className="h-3.5 w-3.5" />
                    <span>
                      {t.reminderRules.couponValueLabel}: {rule.couponValue.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 mt-auto">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => openEditDialog(rule)}
                  aria-label={t.reminderRules.edit}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => handleDelete(rule)}
                  disabled={deletingId === rule.id}
                  aria-label={t.reminderRules.delete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? t.reminderRules.editReminder : t.reminderRules.createReminder}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="abandonedHours">{t.reminderRules.abandonedTimeField} *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="abandonedHours"
                  type="number"
                  min={1}
                  required
                  value={form.abandonedHours}
                  onChange={(e) => setForm({ ...form, abandonedHours: e.target.value })}
                  placeholder={t.reminderRules.abandonedTimePlaceholder}
                />
                <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md whitespace-nowrap">
                  {t.reminderRules.hours}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cartTotalMin">{t.reminderRules.cartTotalField}</Label>
              <Input
                id="cartTotalMin"
                type="number"
                step="0.01"
                min={0}
                value={form.cartTotalMin}
                onChange={(e) => setForm({ ...form, cartTotalMin: e.target.value })}
                placeholder={t.reminderRules.cartTotalPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon">{t.reminderRules.couponField}</Label>
              <Input
                id="coupon"
                value={form.coupon}
                onChange={(e) => setForm({ ...form, coupon: e.target.value })}
                placeholder={t.reminderRules.couponPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="couponValue">{t.reminderRules.couponValueField}</Label>
              <Input
                id="couponValue"
                type="number"
                step="0.01"
                min={0}
                value={form.couponValue}
                onChange={(e) => setForm({ ...form, couponValue: e.target.value })}
                placeholder={t.reminderRules.couponValuePlaceholder}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t.reminderRules.cancel}
              </Button>
              <Button type="submit" disabled={createRule.isPending || updateRule.isPending}>
                {editingRule ? t.reminderRules.saveChanges : t.reminderRules.publish}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}