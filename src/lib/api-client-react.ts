import { useMutation, useQuery } from "@tanstack/react-query";
import * as mock from "./mock-data";

export type CartStatus =
  | "active"
  | "reminded"
  | "purchased"
  | "expired";

export type TeamRole = "admin" | "marketing";

export type TeamUserStatus = "active" | "invited";

export interface TeamUserInput {
  name: string;
  email: string;
  role: TeamRole;
  status?: TeamUserStatus;
}

export interface TeamUser extends TeamUserInput {
  id: number;
  status: TeamUserStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * This app is fully static: there is no backend. All data below is served
 * from an in-memory mock dataset (see ./mock-data.ts). A small artificial
 * delay is added so loading states still feel realistic. Any changes made
 * through the UI (sending a reminder, adding/editing a team member, etc.)
 * only live in memory for the current session and reset on page reload.
 */
const MOCK_DELAY_MS = 350;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

/* -------------------------------------------------------------------------- */
/*                                   CARTS                                    */
/* -------------------------------------------------------------------------- */

export function useGetCartStats() {
  return useQuery({
    queryKey: ["cart-stats"],
    queryFn: async () => delay(mock.computeCartStats()),
  });
}

export function useListCarts(params?: {
  search?: string;
  status?: CartStatus;
}) {
  return useQuery({
    queryKey: ["carts", params],
    queryFn: async () => delay(mock.filterCarts(params)),
  });
}

export function useSendCartReminder() {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => delay(mock.sendCartReminder(id)),
  });
}

/* -------------------------------------------------------------------------- */
/*                                   TEAM                                     */
/* -------------------------------------------------------------------------- */

export function useListUsers() {
  return useQuery<TeamUser[]>({
    queryKey: ["/api/users"],
    queryFn: async () => delay(mock.mockUsers),
  });
}

export function useCreateUser() {
  return useMutation({
    mutationFn: async ({ data }: { data: TeamUserInput }) => delay(mock.createUser(data)),
  });
}

export function useUpdateUser() {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<TeamUserInput> & {
        status?: TeamUserStatus;
      };
    }) => delay(mock.updateUser(id, data)),
  });
}

export async function deleteUser(id: number) {
  return delay(mock.removeUser(id));
}
