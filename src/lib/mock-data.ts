import type { CartStatus, TeamRole, TeamUser, TeamUserStatus } from "./api-client-react";

/* -------------------------------------------------------------------------- */
/*                    Static demo data (in-memory, resets on reload)          */
/* -------------------------------------------------------------------------- */

export interface Cart {
  id: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  itemsCount: number;
  cartTotal: number;
  currency: string;
  status: CartStatus;
  remindersSent: number;
  lastReminderAt?: string;
  createdAt: string;
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export let mockCarts: Cart[] = [
  {
    id: 1,
    customerName: "Sara Al-Qahtani",
    customerPhone: "+966 50 123 4567",
    itemsCount: 3,
    cartTotal: 428.5,
    currency: "SAR",
    status: "active",
    remindersSent: 0,
    createdAt: hoursAgo(1.5),
  },
  {
    id: 2,
    customerName: "Mohammed Al-Harbi",
    customerEmail: "m.harbi@example.com",
    itemsCount: 1,
    cartTotal: 159.0,
    currency: "SAR",
    status: "reminded",
    remindersSent: 1,
    lastReminderAt: hoursAgo(3),
    createdAt: hoursAgo(9),
  },
  {
    id: 3,
    customerName: "Fatimah Al-Zahrani",
    customerPhone: "+966 55 987 6543",
    itemsCount: 5,
    cartTotal: 1042.75,
    currency: "SAR",
    status: "purchased",
    remindersSent: 2,
    lastReminderAt: hoursAgo(20),
    createdAt: hoursAgo(30),
  },
  {
    id: 4,
    customerName: "Abdullah Al-Otaibi",
    customerEmail: "abdullah.o@example.com",
    itemsCount: 2,
    cartTotal: 315.0,
    currency: "SAR",
    status: "active",
    remindersSent: 0,
    createdAt: hoursAgo(0.5),
  },
  {
    id: 5,
    customerName: "Noura Al-Shammari",
    customerPhone: "+966 54 222 1198",
    itemsCount: 4,
    cartTotal: 690.25,
    currency: "SAR",
    status: "reminded",
    remindersSent: 1,
    lastReminderAt: hoursAgo(6),
    createdAt: hoursAgo(14),
  },
  {
    id: 6,
    customerName: "Khalid Al-Dosari",
    customerEmail: "khalid.d@example.com",
    itemsCount: 1,
    cartTotal: 89.99,
    currency: "SAR",
    status: "expired",
    remindersSent: 2,
    lastReminderAt: hoursAgo(90),
    createdAt: hoursAgo(120),
  },
  {
    id: 7,
    customerName: "Lama Al-Ghamdi",
    customerPhone: "+966 56 344 7789",
    itemsCount: 6,
    cartTotal: 1288.0,
    currency: "SAR",
    status: "purchased",
    remindersSent: 1,
    lastReminderAt: hoursAgo(48),
    createdAt: hoursAgo(52),
  },
  {
    id: 8,
    customerName: "Yousef Al-Malki",
    customerEmail: "yousef.malki@example.com",
    itemsCount: 2,
    cartTotal: 240.5,
    currency: "SAR",
    status: "active",
    remindersSent: 0,
    createdAt: hoursAgo(3),
  },
  {
    id: 9,
    customerName: "Reem Al-Anzi",
    customerPhone: "+966 50 771 2233",
    itemsCount: 3,
    cartTotal: 512.0,
    currency: "SAR",
    status: "expired",
    remindersSent: 1,
    lastReminderAt: hoursAgo(80),
    createdAt: hoursAgo(100),
  },
  {
    id: 10,
    customerName: "Faisal Al-Subaie",
    customerEmail: "faisal.s@example.com",
    itemsCount: 1,
    cartTotal: 75.0,
    currency: "SAR",
    status: "reminded",
    remindersSent: 1,
    lastReminderAt: hoursAgo(2),
    createdAt: hoursAgo(5),
  },
];

export let mockUsers: TeamUser[] = [
  {
    id: 1,
    name: "Sara Al-Qahtani",
    email: "sara@chatgate.sa",
    role: "admin",
    status: "active",
    createdAt: hoursAgo(2400),
  },
  {
    id: 2,
    name: "Omar Al-Fahad",
    email: "omar@chatgate.sa",
    role: "marketing",
    status: "active",
    createdAt: hoursAgo(1800),
  },
  {
    id: 3,
    name: "Hind Al-Rasheed",
    email: "hind@chatgate.sa",
    role: "marketing",
    status: "invited",
    createdAt: hoursAgo(48),
  },
];

/**
 * This project has no backend, so there is nowhere to securely store real
 * credentials. DEMO_PASSWORD is used for every mock account purely so the
 * login screen has something to check against. Do not treat this as a real
 * auth system - anyone with the source can read this file.
 */
export const DEMO_PASSWORD = "chatgate123";

let nextCartId = mockCarts.length + 1;
let nextUserId = mockUsers.length + 1;

export function computeCartStats() {
  const totalCarts = mockCarts.length;
  const purchasedCarts = mockCarts.filter((c) => c.status === "purchased").length;
  const recoveredRevenue = mockCarts
    .filter((c) => c.status === "purchased")
    .reduce((sum, c) => sum + c.cartTotal, 0);
  const remindersSent = mockCarts.reduce((sum, c) => sum + c.remindersSent, 0);
  const remindedOrBetter = mockCarts.filter((c) => c.remindersSent > 0).length;
  const conversionRate = remindedOrBetter > 0 ? (purchasedCarts / remindedOrBetter) * 100 : 0;

  return {
    totalCarts,
    recoveredRevenue,
    purchasedCarts,
    conversionRate,
    remindersSent,
  };
}

export function filterCarts(params?: { search?: string; status?: CartStatus }) {
  let result = [...mockCarts];
  if (params?.status) {
    result = result.filter((c) => c.status === params.status);
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.customerEmail?.toLowerCase().includes(q) ||
        c.customerPhone?.toLowerCase().includes(q),
    );
  }
  return result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function sendCartReminder(id: number) {
  const cart = mockCarts.find((c) => c.id === id);
  if (!cart) throw new Error("Cart not found");
  cart.remindersSent += 1;
  cart.lastReminderAt = new Date().toISOString();
  if (cart.status === "active") {
    cart.status = "reminded";
  }
  return cart;
}

export function createUser(data: { name: string; email: string; role: TeamRole; status?: TeamUserStatus }) {
  const user: TeamUser = {
    id: nextUserId++,
    name: data.name,
    email: data.email,
    role: data.role,
    status: data.status ?? "invited",
    createdAt: new Date().toISOString(),
  };
  mockUsers = [...mockUsers, user];
  return user;
}

export function updateUser(
  id: number,
  data: Partial<{ name: string; email: string; role: TeamRole; status: TeamUserStatus }>,
) {
  const user = mockUsers.find((u) => u.id === id);
  if (!user) throw new Error("User not found");
  Object.assign(user, data, { updatedAt: new Date().toISOString() });
  return user;
}

export function removeUser(id: number) {
  mockUsers = mockUsers.filter((u) => u.id !== id);
  return { success: true };
}
