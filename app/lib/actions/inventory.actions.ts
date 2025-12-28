"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateStock(
  productId: string,
  quantity: number,
  updateType: "ADD" | "SET"
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    let newStock: number;
    if (updateType === "ADD") {
      newStock = product.stock + quantity;
    } else {
      newStock = quantity;
    }

    if (newStock < 0) {
      return { success: false, error: "Stock cannot be negative" };
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/pos");

    return { success: true, data: updatedProduct };
  } catch (error) {
    console.error("Error updating stock:", error);
    return { success: false, error: "Failed to update stock" };
  }
}

export async function getStockAlerts() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const alerts = await prisma.product.findMany({
      where: {
        trackInventory: true,
        stock: {
          lte: prisma.product.fields.lowStockAlert,
        },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        lowStockAlert: true,
        stockUnit: true,
      },
      orderBy: { stock: "asc" },
      take: 5,
    });

    return { success: true, alerts: JSON.parse(JSON.stringify(alerts)) };
  } catch (error) {
    console.error("Error fetching stock alerts:", error);
    return { success: false, error: "Failed to fetch stock alerts" };
  }
}

export async function getPopularItems() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const popular = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: {
          status: "COMPLETED",
          createdAt: { gte: today },
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 3,
    });

    // Get product details for popular items
    const productIds = popular.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    const result = popular.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        id: product?.id,
        name: product?.name,
        orders: `${item._sum.quantity} orders today`,
        price: product?.price,
      };
    });

    return { success: true, items: JSON.parse(JSON.stringify(result)) };
  } catch (error) {
    console.error("Error fetching popular items:", error);
    return { success: false, error: "Failed to fetch popular items" };
  }
}

export async function getHourlyPerformance() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await prisma.order.findMany({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: { items: true },
    });

    // Group by hour
    const hourlyData: {
      [key: number]: { revenue: number; profit: number; count: number };
    } = {};

    for (let i = 10; i < 18; i++) {
      hourlyData[i] = { revenue: 0, profit: 0, count: 0 };
    }

    orders.forEach((order) => {
      const hour = order.createdAt.getHours();
      if (hour >= 10 && hour < 18) {
        hourlyData[hour].revenue += Number(order.total);
        hourlyData[hour].count += 1;
        order.items.forEach((item) => {
          const itemProfit =
            (Number(item.price) - Number(item.costPrice)) * item.quantity;
          hourlyData[hour].profit += itemProfit;
        });
      }
    });

    const result = Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      revenue: data.revenue,
      profit: data.profit,
      count: data.count,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching hourly performance:", error);
    return { success: false, error: "Failed to fetch hourly performance" };
  }
}
