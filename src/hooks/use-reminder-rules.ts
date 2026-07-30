import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export interface ReminderRule {
  id: number;
  merchantId: number;
  abandonedHours: number;
  cartTotalMin: number | null;
  coupon: string | null;
  couponValue: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReminderRuleDto {
  id: number;
  installedStoreId: number;
  abandonedMinutes: number;
  minCartTotal: number | null;
  couponCode: string | null;
  couponValue: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function authHeaders(token?: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

function fromDto(dto: ReminderRuleDto): ReminderRule {
  return {
    id: dto.id,
    merchantId: dto.installedStoreId,
    abandonedHours: dto.abandonedMinutes / 60,
    cartTotalMin: dto.minCartTotal,
    coupon: dto.couponCode,
    couponValue: dto.couponValue,
    isActive: dto.active,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function toDto(
  data: Partial<Omit<ReminderRule, "id" | "merchantId">>,
  merchantId?: number
) {
  return {
    installedStoreId: merchantId,
    abandonedMinutes:
      data.abandonedHours != null
        ? Math.round(data.abandonedHours * 60)
        : undefined,
    minCartTotal: data.cartTotalMin,
    couponCode: data.coupon,
    couponValue: data.couponValue,
    active: data.isActive,
  };
}

// GET
export function useListReminderRules() {
  const { user } = useAuth();
  const installedStoreId = user?.installedStoreId;

  return useQuery({
    queryKey: ["/api/reminder-rules", installedStoreId],
    enabled: !!installedStoreId,
    queryFn: async (): Promise<ReminderRule[]> => {
      const params = new URLSearchParams({
        merchantId: String(installedStoreId),
      });

      const response = await fetch(
        `${API_BASE_URL}/merchant/reminders?${params}`,
        {
          headers: authHeaders(user?.token),
        }
      );

      if (!response.ok) throw new Error(await response.text());

      const json: ReminderRuleDto[] = await response.json();

      return json.map(fromDto);
    },
  });
}

// CREATE
export function useCreateReminderRule() {
  const { user } = useAuth();

  console.log({user})
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
    }: {
      data: Partial<Omit<ReminderRule, "id" | "merchantId">>;
    }): Promise<ReminderRule> => {

      console.log("USER", user);
  console.log("MERCHANT", user?.installedStoreId);
  console.log("DTO", data);
 const payload = toDto(data, user?.installedStoreId);

console.log("DTO PAYLOAD:");
console.log(payload);
console.log("JSON:", JSON.stringify(payload));

const response = await fetch(`${API_BASE_URL}/merchant/reminders`, {
  method: "POST",
  headers: authHeaders(user?.token),
  body: JSON.stringify(payload),
});
      if (!response.ok) throw new Error(await response.text());

      return fromDto(await response.json());
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/reminder-rules"],
      });
    },
  });
}

// UPDATE
export function useUpdateReminderRule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Omit<ReminderRule, "id" | "merchantId">>;
    }): Promise<ReminderRule> => {
      const response = await fetch(`${API_BASE_URL}/merchant/reminders`, {
        method: "PUT",
        headers: authHeaders(user?.token),
        body: JSON.stringify({
          id,
          ...toDto(data),
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      return fromDto(await response.json());
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/reminder-rules"],
      });
    },
  });
}

// DELETE
export async function deleteReminderRule(
  id: number,
  token?: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/merchant/reminders/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(token),
    }
  );

  if (!response.ok) throw new Error(await response.text());
}

export function useToggleReminderRule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      active,
    }: {
      id: number;
      active: boolean;
    }) => {
      const response = await fetch(
        `${API_BASE_URL}/merchant/reminders/${id}/toggle?active=${active}`,
        {
          method: "PUT",
          headers: authHeaders(user?.token),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/reminder-rules"],
      });
    },
  });
}