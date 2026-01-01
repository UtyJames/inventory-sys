"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";

/**
 * Fetch all products configured to be shown on the digital menu
 */
export async function getMenuProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        showOnMenu: true,
        status: true,
      },
      include: {
        category: true,
      },
      orderBy: [
        { menuCategory: "asc" },
        { menuOrder: "asc" },
        { name: "asc" },
      ],
    });

    // Group by category for easier display
    const grouped = products.reduce((acc: any, product) => {
      const category = product.menuCategory || product.category?.name || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(JSON.parse(JSON.stringify(product)));
      return acc;
    }, {});

    return { success: true, menu: grouped };
  } catch (error: any) {
    console.error("Failed to fetch menu products:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Toggle menu visibility for a product (Admin/Manager only)
 */
export async function toggleMenuVisibility(productId: string, show: boolean) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.product.update({
      where: { id: productId },
      data: { showOnMenu: show },
    });
    revalidatePath("/inventory");
    revalidatePath("/digital-menu");
    revalidatePath("/menu");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update menu details for a product (Admin/Manager only)
 */
export async function updateMenuDetails(productId: string, data: { menuCategory?: string, menuOrder?: number }) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.product.update({
      where: { id: productId },
      data: {
        menuCategory: data.menuCategory,
        menuOrder: data.menuOrder,
      },
    });
    revalidatePath("/inventory");
    revalidatePath("/digital-menu");
    revalidatePath("/menu");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Public action for visitors to place orders
 */
export async function createVisitorOrder(data: {
  items: {
    productId: string;
    quantity: number;
    price: number;
    name: string;
  }[];
  tableNumber: string;
  notes?: string;
}) {
  try {
    // 1. Calculate totals
    const subtotal = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const total = subtotal; // No tax for visitor orders for now?

    // 2. Generate Order Number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = now.getHours().toString().padStart(2, "0") + now.getMinutes().toString().padStart(2, "0");
    const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    const orderNumber = `VIS-${dateStr}-${timeStr}-${randomStr}`;

    const order = await prisma.$transaction(async (tx) => {
      // Fetch cost prices for accurate profit reports later
      const productIds = data.items.map(i => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, costPrice: true }
      });
      const costPriceMap = new Map(products.map(p => [p.id, Number(p.costPrice || 0)]));

      return await tx.order.create({
        data: {
          orderNumber,
          customerName: "Visitor",
          tableNumber: data.tableNumber,
          notes: data.notes,
          subtotal,
          tax: 0,
          total,
          status: "PENDING",
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              costPrice: costPriceMap.get(item.productId) || 0,
              subtotal: item.price * item.quantity,
            })),
          },
        },
        include: {
          items: true,
        },
      });
    }, { timeout: 10000 });

    // 3. Real-time update to dashboard
    if (pusherServer) {
      await pusherServer.trigger("orders", "order:created", order);
    }

    revalidatePath("/inventory");
    revalidatePath("/");
    
    return { success: true, order: JSON.parse(JSON.stringify(order)) };
  } catch (error: any) {
    console.error("Visitor Order Error:", error);
    return { success: false, error: error.message || "Failed to submit order" };
  }
}
