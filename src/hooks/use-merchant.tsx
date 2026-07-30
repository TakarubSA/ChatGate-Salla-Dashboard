import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { useAuth } from "./use-auth";

export interface AbandonedCart {
  id: number;
  cartId: string;
  merchantId: number;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  checkoutUrl: string;
  status: "active" | "notified" | "order_created" | "expired";
  sendCount: number;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  expiredDate: string | null;
  nextSendAt: string | null;
  lastSentAt: string | null;
  schedulerStatus: "pending" | "stopped" | null;
}

function authHeaders(token?: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}
export interface OrderItem {
  id: number;
  orderId: number;
  sallaItemId: number | null;
  productId: number | null;
  sku: string | null;
  name: string;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  image: string | null;
}

export interface Order {
  id: number;
  sallaOrderId: string;
  referenceId: string;
  merchantId: number;
  customerName: string;
  customerMobile: string;
  total: number;
  installedStoreId: number | null;
  createdAt: string;

  items: OrderItem[];
}

export interface MerchantDashboard {
  totalAbandoned: number;
  totalOrders: number;
  remindersSent: number;
  successfulReminders: number;
  failedReminders: number;
  recoveredRevenue: number;
  latestOrders: Order[];
  latestAbandoned: AbandonedCart[];
}

export interface GetMerchantCartsRequest {
  merchantId: number;
  startDate: string;
  endDate: string;
}

export interface GetMerchantOrdersRequest {
  merchantId: number;
  startDate: string;
  endDate: string;
  page?: number;
  size?: number;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
export interface SendReminderRequest {
  merchantId: number;
  cartIds: string[];
  couponCode?: string;
}

interface MerchantContextType {
  carts: AbandonedCart[];
  isLoading: boolean;
  loadCarts: (
    request: GetMerchantCartsRequest
  ) => Promise<AbandonedCart[]>;
  orders: Order[];
  isLoadingOrders: boolean;
ordersPage: PagedResponse<Order> | null;
sendReminder: (
  request: SendReminderRequest
) => Promise<boolean>;

loadOrders: (
  request: GetMerchantOrdersRequest
) => Promise<PagedResponse<Order> | null>;
  dashboard: MerchantDashboard | null;
  isLoadingDashboard: boolean;
  loadDashboard: (
    request: GetMerchantCartsRequest
  ) => Promise<MerchantDashboard | null>;
  clear: () => void;
}

const MerchantContext = createContext<MerchantContextType | undefined>(
  undefined
);

export function MerchantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [isLoading, setIsLoading] = useState(false);

const [orders, setOrders] = useState<Order[]>([]);
const [ordersPage, setOrdersPage] =
  useState<PagedResponse<Order> | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const [dashboard, setDashboard] = useState<MerchantDashboard | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const sendReminder = useCallback(
  async ({
    merchantId,
    cartIds,
    couponCode = "",
  }: SendReminderRequest) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/merchant/notifications`,
        {
          method: "POST",
          headers: authHeaders(user?.token),
          body: JSON.stringify({
            merchantId,
            cartIds,
            couponCode,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  [API_BASE_URL, user?.token]
);

  const loadCarts = useCallback(
    async ({
      merchantId,
      startDate,
      endDate,
    }: GetMerchantCartsRequest) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        params.append("merchantId", merchantId.toString());
        params.append("startDate", startDate);
        params.append("endDate", endDate);
        const response = await fetch(
          `${API_BASE_URL}/merchant/carts?${params.toString()}`,
          {
            headers: {
              Accept: "application/json",
              ...(user?.token && {
                Authorization: `Bearer ${user.token}`,
              }),
            },
          }
        );
        console.log("Response status:", response.status);
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const data = (await response.json()) as AbandonedCart[];
        setCarts(data);
        return data;
      } catch (error) {
        console.error(error);
        setCarts([]);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [user?.token]
  );

const loadOrders = useCallback(
  async ({
    merchantId,
    startDate,
    endDate,
    page = 1,
    size = 20,
  }: GetMerchantOrdersRequest) => {
    try {
      setIsLoadingOrders(true);

      const params = new URLSearchParams();

      params.append("merchantId", merchantId.toString());
      // params.append("startDate", startDate);
      // params.append("endDate", endDate);
      // params.append("page", page.toString());
      // params.append("size", size.toString());


const response = await fetch(
  `${API_BASE_URL}/orders?${params.toString()}`,
  {
    headers: authHeaders(user?.token),
  }
);

if (!response.ok) {
  throw new Error(await response.text());
}

const data = (await response.json()) as Order[];

console.log(data);

setOrders(data);

return {
  content: data,
  page: 1,
  size: data.length,
  totalElements: data.length,
  totalPages: 1,
};
    } catch (error) {
      console.error(error);

      setOrders([]);
      setOrdersPage(null);

      return null;
    } finally {
      setIsLoadingOrders(false);
    }
  },
  [API_BASE_URL, user?.token]
);

  const loadDashboard = useCallback(
    async ({
      merchantId,
      startDate,
      endDate,
    }: GetMerchantCartsRequest) => {
      try {
        setIsLoadingDashboard(true);
        const params = new URLSearchParams();
        params.append("merchantId", merchantId.toString());
        params.append("startDate", startDate);
        params.append("endDate", endDate);
        const response = await fetch(
          `${API_BASE_URL}/merchant/dashboard?${params.toString()}`,
          {
            headers: {
              Accept: "application/json",
              ...(user?.token && {
                Authorization: `Bearer ${user.token}`,
              }),
            },
          }
        );
        console.log("Response status:", response.status);
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const data = (await response.json()) as MerchantDashboard;
        setDashboard(data);
        return data;
      } catch (error) {
        console.error(error);
        setDashboard(null);
        return null;
      } finally {
        setIsLoadingDashboard(false);
      }
    },
    [user?.token]
  );

const clear = useCallback(() => {
  setCarts([]);
  setOrders([]);
  setOrdersPage(null);
  setDashboard(null);
}, []);

  return (
<MerchantContext.Provider
  value={{
    carts,
    isLoading,
    loadCarts,

    orders,
    ordersPage,
    isLoadingOrders,
    loadOrders,

    dashboard,
    isLoadingDashboard,
    loadDashboard,

    sendReminder,

    clear,
  }}
>
      {children}
    </MerchantContext.Provider>
  );
}

export function useMerchant() {
  const context = useContext(MerchantContext);
  if (!context) {
    throw new Error(
      "useMerchant must be used within a MerchantProvider"
    );
  }
  return context;
}