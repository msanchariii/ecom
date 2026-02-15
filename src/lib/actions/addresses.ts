"use server";

import { db } from "@/lib/db";
import {
  addresses,
  type SelectAddress,
  type InsertAddress,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getUserAddresses(): Promise<SelectAddress[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return [];
  }

  const userAddresses = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, session.user.id));

  return userAddresses;
}

export async function createAddress(
  data: Omit<InsertAddress, "userId">,
): Promise<{ success: boolean; error?: string; address?: SelectAddress }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, session.user.id));
    }

    const [newAddress] = await db
      .insert(addresses)
      .values({
        ...data,
        userId: session.user.id,
      })
      .returning();

    revalidatePath("/me/addresses");
    return { success: true, address: newAddress };
  } catch (error) {
    console.error("Failed to create address:", error);
    return { success: false, error: "Failed to create address" };
  }
}

export async function updateAddress(
  addressId: string,
  data: Partial<Omit<InsertAddress, "userId">>,
): Promise<{ success: boolean; error?: string; address?: SelectAddress }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify the address belongs to the user
    const existingAddress = await db
      .select()
      .from(addresses)
      .where(
        and(eq(addresses.id, addressId), eq(addresses.userId, session.user.id)),
      )
      .limit(1);

    if (!existingAddress.length) {
      return { success: false, error: "Address not found" };
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, session.user.id));
    }

    const [updatedAddress] = await db
      .update(addresses)
      .set(data)
      .where(eq(addresses.id, addressId))
      .returning();

    revalidatePath("/me/addresses");
    return { success: true, address: updatedAddress };
  } catch (error) {
    console.error("Failed to update address:", error);
    return { success: false, error: "Failed to update address" };
  }
}

export async function deleteAddress(
  addressId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify the address belongs to the user before deleting
    const result = await db
      .delete(addresses)
      .where(
        and(eq(addresses.id, addressId), eq(addresses.userId, session.user.id)),
      )
      .returning();

    if (!result.length) {
      return { success: false, error: "Address not found" };
    }

    revalidatePath("/me/addresses");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete address:", error);
    return { success: false, error: "Failed to delete address" };
  }
}
