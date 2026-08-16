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
  status:
    | "active"
    | "notified"
    | "order_created"
    | "expired"
    |"purchased";
  sendCount: number;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  expiredDate: string | null;
  nextSendAt: string | null;
  lastSentAt: string | null;
  schedulerStatus:
    | "pending"
    | "stopped"
    | null;
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

  /*
   * Optional because the page can load all carts
   * without a date filter.
   */
  startDate?: string;
  endDate?: string;

  page?: number;
  size?: number;
}

export interface GetMerchantOrdersRequest {
  merchantId: number;
  startDate?: string;
  endDate?: string;
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

export interface ExportAllCartsRequest {
  merchantId: number;
  startDate?: string;
  endDate?: string;
}

interface MerchantContextType {
  carts: AbandonedCart[];

  cartsPage: PagedResponse<AbandonedCart> | null;

  isLoading: boolean;

  loadCarts: (
    request: GetMerchantCartsRequest
  ) => Promise<
    PagedResponse<AbandonedCart> | null
  >;

  /*
   * Fetches ALL carts across all pages.
   */
  exportAllCarts: (
    request: ExportAllCartsRequest
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

function authHeaders(
  token?: string
): HeadersInit {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token && {
      Authorization: `Bearer ${token}`,
    }),
  };
}

const MerchantContext =
  createContext<MerchantContextType | undefined>(
    undefined
  );

export function MerchantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL;

  const [carts, setCarts] = useState<
    AbandonedCart[]
  >([]);

  const [cartsPage, setCartsPage] =
    useState<PagedResponse<AbandonedCart> | null>(
      null
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [orders, setOrders] = useState<Order[]>(
    []
  );

  const [ordersPage, setOrdersPage] =
    useState<PagedResponse<Order> | null>(
      null
    );

  const [isLoadingOrders, setIsLoadingOrders] =
    useState(false);

  const [dashboard, setDashboard] =
    useState<MerchantDashboard | null>(null);

  const [
    isLoadingDashboard,
    setIsLoadingDashboard,
  ] = useState(false);

  /*
   * =========================================================
   * SEND REMINDER
   * =========================================================
   */

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
            headers: authHeaders(
              user?.token
            ),
            body: JSON.stringify({
              merchantId,
              cartIds,
              couponCode,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            await response.text()
          );
        }

        return true;
      } catch (error) {
        console.error(
          "Failed to send reminder:",
          error
        );

        return false;
      }
    },
    [API_BASE_URL, user?.token]
  );

  /*
   * =========================================================
   * LOAD CARTS
   * =========================================================
   */

  const loadCarts = useCallback(
    async ({
      merchantId,
      startDate,
      endDate,
      page = 1,
      size = 20,
    }: GetMerchantCartsRequest) => {
      try {
        setIsLoading(true);

        const params =
          new URLSearchParams();

        params.append(
          "merchantId",
          merchantId.toString()
        );

        /*
         * Keep dates as YYYY-MM-DD strings.
         *
         * DO NOT convert these using:
         *
         * new Date(startDate)
         *
         * because these are calendar dates,
         * not timestamps.
         */

        if (startDate) {
          params.append(
            "startDate",
            startDate
          );
        }

        if (endDate) {
          params.append(
            "endDate",
            endDate
          );
        }

        params.append(
          "page",
          page.toString()
        );

        params.append(
          "size",
          size.toString()
        );

        const response = await fetch(
          `${API_BASE_URL}/merchant/carts?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Accept:
                "application/json",

              ...(user?.token && {
                Authorization: `Bearer ${user.token}`,
              }),
            },
          }
        );

        console.log(
          "GET /merchant/carts:",
          `${API_BASE_URL}/merchant/carts?${params.toString()}`
        );

        console.log(
          "Response status:",
          response.status
        );

        if (!response.ok) {
          throw new Error(
            await response.text()
          );
        }

        const raw =
          await response.json();

        let result:
          PagedResponse<AbandonedCart>;

        /*
         * Backend currently returns a raw array.
         */
        if (Array.isArray(raw)) {
          const hasFullPage =
            raw.length === size;

          result = {
            content: raw,
            page,
            size,

            /*
             * This is only an estimate because
             * the backend doesn't return totalElements.
             */
            totalElements:
              hasFullPage
                ? page * size + 1
                : (page - 1) * size +
                  raw.length,

            totalPages:
              hasFullPage
                ? page + 1
                : page,
          };
        } else {
          result =
            raw as PagedResponse<AbandonedCart>;
        }

        setCarts(
          result.content ?? []
        );

        setCartsPage(result);

        return result;
      } catch (error) {
        console.error(
          "Failed to load carts:",
          error
        );

        setCarts([]);

        setCartsPage(null);

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [API_BASE_URL, user?.token]
  );

  /*
   * =========================================================
   * EXPORT ALL CARTS
   * =========================================================
   *
   * This does NOT use the current `carts` state.
   *
   * It requests every page from the API.
   */

  const exportAllCarts = useCallback(
    async ({
      merchantId,
      startDate,
      endDate,
    }: ExportAllCartsRequest) => {
      const allCarts: AbandonedCart[] =
        [];

      const size = 100;

      let page = 1;

      while (true) {
        const params =
          new URLSearchParams();

        params.append(
          "merchantId",
          merchantId.toString()
        );

        if (startDate) {
          params.append(
            "startDate",
            startDate
          );
        }

        if (endDate) {
          params.append(
            "endDate",
            endDate
          );
        }

        params.append(
          "page",
          page.toString()
        );

        params.append(
          "size",
          size.toString()
        );

        console.log(
          `Exporting carts page ${page}`
        );

        const response = await fetch(
          `${API_BASE_URL}/merchant/carts?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Accept:
                "application/json",

              ...(user?.token && {
                Authorization: `Bearer ${user.token}`,
              }),
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            await response.text()
          );
        }

        const raw =
          await response.json();

        /*
         * Backend currently returns an array.
         */
        const pageCarts: AbandonedCart[] =
          Array.isArray(raw)
            ? raw
            : (
                raw as PagedResponse<AbandonedCart>
              ).content ?? [];

        allCarts.push(
          ...pageCarts
        );

        /*
         * If we received less than the page size,
         * there are no more pages.
         */
        if (
          pageCarts.length < size
        ) {
          break;
        }

        page += 1;
      }

      console.log(
        `Export collected ${allCarts.length} carts`
      );

      return allCarts;
    },
    [API_BASE_URL, user?.token]
  );

  /*
   * =========================================================
   * LOAD ORDERS
   * =========================================================
   */

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

        const params =
          new URLSearchParams();

        params.append(
          "merchantId",
          merchantId.toString()
        );

        if (startDate) {
          params.append(
            "startDate",
            startDate
          );
        }

        if (endDate) {
          params.append(
            "endDate",
            endDate
          );
        }

        params.append(
          "page",
          page.toString()
        );

        params.append(
          "size",
          size.toString()
        );

        const response = await fetch(
          `${API_BASE_URL}/merchant/orders?${params.toString()}`,
          {
            headers: {
              Accept:
                "application/json",

              ...(user?.token && {
                Authorization: `Bearer ${user.token}`,
              }),
            },
          }
        );

        console.log(
          "Response status:",
          response.status
        );

        if (!response.ok) {
          throw new Error(
            await response.text()
          );
        }

        const raw =
          await response.json();

        console.log({
          raw,
        });

        let result: PagedResponse<Order>;

        if (Array.isArray(raw)) {
          const hasFullPage =
            raw.length === size;

          result = {
            content: raw,
            page,
            size,
            totalElements:
              hasFullPage
                ? page * size + 1
                : (page - 1) * size +
                  raw.length,
            totalPages:
              hasFullPage
                ? page + 1
                : page,
          };
        } else {
          result =
            raw as PagedResponse<Order>;
        }

        setOrders(
          result.content ?? []
        );

        setOrdersPage(result);

        return result;
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

  /*
   * =========================================================
   * LOAD DASHBOARD
   * =========================================================
   */

  const loadDashboard = useCallback(
    async ({
      merchantId,
      startDate,
      endDate,
    }: GetMerchantCartsRequest) => {
      try {
        setIsLoadingDashboard(true);

        const params =
          new URLSearchParams();

        params.append(
          "merchantId",
          merchantId.toString()
        );

        if (startDate) {
          params.append(
            "startDate",
            startDate
          );
        }

        if (endDate) {
          params.append(
            "endDate",
            endDate
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/merchant/dashboard?${params.toString()}`,
          {
            headers: {
              Accept:
                "application/json",

              ...(user?.token && {
                Authorization: `Bearer ${user.token}`,
              }),
            },
          }
        );

        console.log(
          "Response status:",
          response.status
        );

        if (!response.ok) {
          throw new Error(
            await response.text()
          );
        }

        const data =
          (await response.json()) as MerchantDashboard;

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
    [API_BASE_URL, user?.token]
  );

  /*
   * =========================================================
   * CLEAR
   * =========================================================
   */

  const clear = useCallback(() => {
    setCarts([]);

    setCartsPage(null);

    setOrders([]);

    setOrdersPage(null);

    setDashboard(null);
  }, []);

  /*
   * =========================================================
   * PROVIDER
   * =========================================================
   */

  return (
    <MerchantContext.Provider
      value={{
        carts,
        cartsPage,
        isLoading,

        loadCarts,

        /*
         * THIS WAS MISSING BEFORE
         */
        exportAllCarts,

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
  const context =
    useContext(MerchantContext);

  if (!context) {
    throw new Error(
      "useMerchant must be used within a MerchantProvider"
    );
  }

  return context;
}