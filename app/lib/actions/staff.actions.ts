"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

export async function getAllStaff() {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const staff = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        // Don't expose password
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: staff };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteStaff(userId: string) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }
  
    try {
      await prisma.user.delete({ where: { id: userId } });
      revalidatePath("/staff");
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
}

export async function updateStaffPin(userId: string, newPin: string) { // Assuming password update
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const hashedPassword = await hash(newPin, 12);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        revalidatePath("/staff");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
