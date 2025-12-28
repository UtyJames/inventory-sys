"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createOrder(data: {
  items: {
    productId: string;
    quantity: number;
    price: number;
    subtotal: number;
    name: string;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  amountTendered?: number;
  changeAmount?: number;
  paymentType: "CASH" | "CARD" | "TRANSFER" | "OTHER";
  customerName?: string;
  notes?: string;
  status?: "PENDING" | "COMPLETED";
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  try {
    // Generate Order Number: ORD-YYYYMMDD-HHMM-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr =
      now.getHours().toString().padStart(2, "0") +
      now.getMinutes().toString().padStart(2, "0");
    const randomStr = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const orderNumber = `ORD-${dateStr}-${timeStr}-${randomStr}`;

    // Verify prisma model existence (though npx prisma generate should handle this,
    // the user might have connectivity issues during push)
    if (!prisma.order) {
      return {
        success: false,
        error:
          "Order database table not found. Please sync your schema (npx prisma db push).",
      };
    }

    const order = await prisma.$transaction(async (tx) => {
      // 0. Fetch current cost prices for all items to lock them in for this sale
      const productIds = data.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, costPrice: true },
      });

      const costPriceMap = new Map<string, number>(
        products.map((p) => [p.id, Number(p.costPrice || 0)])
      );

      // 1. Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          subtotal: data.subtotal,
          tax: data.tax,
          total: data.total,
          amountTendered: data.amountTendered,
          changeAmount: data.changeAmount,
          paymentType: data.paymentType,
          customerName: data.customerName,
          notes: data.notes,
          status: data.status || "COMPLETED",
          userId: session.user.id,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              costPrice: costPriceMap.get(item.productId) || 0,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      // 2. Update stock levels and log movements if order is completed
      if (newOrder.status === "COMPLETED") {
        for (const item of data.items) {
          // Update stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          // Log stock movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "OUT",
              quantity: -item.quantity,
              reason: "SALE",
              userId: session.user.id,
            },
          });
        }
      }

      return newOrder;
    });

    revalidatePath("/inventory");
    revalidatePath("/pos");
    revalidatePath("/"); // Dashboard
    return { success: true, order: JSON.parse(JSON.stringify(order)) };
  } catch (error: any) {
    console.error("Order Creation Error:", error);
    return { success: false, error: error.message || "Failed to create order" };
  }
}

export async function getPendingOrders() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "PENDING",
        userId: session.user.id,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return { success: true, orders: JSON.parse(JSON.stringify(orders)) };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch pending orders",
    };
  }
}

export async function deleteOrder(orderId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  try {
    await prisma.order.delete({
      where: {
        id: orderId,
      },
    });
    revalidatePath("/pos");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete order" };
  }
}

export async function getDashboardStats() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Fetch today's sales
    const todayOrders = await prisma.order.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: today },
      },
      include: { items: true },
    });

    // Fetch yesterday's sales for trend comparison
    const yesterdayOrders = await prisma.order.findMany({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
      include: { items: true },
    });

    const calculateStats = (orders: any[]) => {
      let revenue = 0;
      let profit = 0;
      orders.forEach((order) => {
        revenue += Number(order.total);
        order.items.forEach((item: any) => {
          const itemProfit =
            (Number(item.price) - Number(item.costPrice)) * item.quantity;
          profit += itemProfit;
        });
      });
      return { revenue, profit, count: orders.length };
    };

    const todayStats = calculateStats(todayOrders);
    const yesterdayStats = calculateStats(yesterdayOrders);

    // Low stock count
    const lowStockCount = await prisma.product.count({
      where: {
        stock: { lte: prisma.product.fields.lowStockAlert },
        trackInventory: true,
      },
    });

    return {
      success: true,
      stats: {
        revenue: todayStats.revenue,
        profit: todayStats.profit,
        salesCount: todayStats.count,
        lowStockCount,
        trends: {
          revenue:
            yesterdayStats.revenue > 0
              ? ((todayStats.revenue - yesterdayStats.revenue) /
                  yesterdayStats.revenue) *
                100
              : 0,
          sales:
            yesterdayStats.count > 0
              ? ((todayStats.count - yesterdayStats.count) /
                  yesterdayStats.count) *
                100
              : 0,
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSalesReports(filters?: {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  paymentType?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  try {
    const where: any = { status: "COMPLETED" };
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.paymentType) where.paymentType = filters.paymentType;

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const reports = orders.map((order) => {
      let profit = 0;
      order.items.forEach((item) => {
        profit += (Number(item.price) - Number(item.costPrice)) * item.quantity;
      });
      return {
        ...order,
        profit,
      };
    });

    return { success: true, reports: JSON.parse(JSON.stringify(reports)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProfitAnalysisReport(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  try {
    const where: any = { status: "COMPLETED" };
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
    });

    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    const productProfits: {
      [key: string]: {
        name: string;
        quantity: number;
        revenue: number;
        cost: number;
        profit: number;
      };
    } = {};

    orders.forEach((order) => {
      totalRevenue += Number(order.total);
      order.items.forEach((item) => {
        const itemRevenue = Number(item.price) * item.quantity;
        const itemCost = Number(item.costPrice) * item.quantity;
        const itemProfit = itemRevenue - itemCost;

        totalCost += itemCost;
        totalProfit += itemProfit;

        if (!productProfits[item.productId]) {
          productProfits[item.productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
          };
        }
        productProfits[item.productId].quantity += item.quantity;
        productProfits[item.productId].revenue += itemRevenue;
        productProfits[item.productId].cost += itemCost;
        productProfits[item.productId].profit += itemProfit;
      });
    });

    const profitByProduct = Object.entries(productProfits)
      .map(([id, data]) => ({
        ...data,
        profitMargin:
          data.revenue > 0
            ? ((data.profit / data.revenue) * 100).toFixed(2)
            : "0",
      }))
      .sort((a, b) => b.profit - a.profit);

    return {
      success: true,
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin:
          totalRevenue > 0
            ? ((totalProfit / totalRevenue) * 100).toFixed(2)
            : "0",
        orderCount: orders.length,
      },
      byProduct: profitByProduct,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getStaffPerformanceReport(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  try {
    const where: any = { status: "COMPLETED" };
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        user: { select: { id: true, name: true } },
      },
    });

    const staffStats: {
      [key: string]: {
        name: string;
        orderCount: number;
        revenue: number;
        profit: number;
        avgOrderValue: number;
      };
    } = {};

    orders.forEach((order) => {
      const staffId = order.userId;
      if (!staffStats[staffId]) {
        staffStats[staffId] = {
          name: order.user?.name || "Unknown",
          orderCount: 0,
          revenue: 0,
          profit: 0,
          avgOrderValue: 0,
        };
      }
      staffStats[staffId].orderCount += 1;
      staffStats[staffId].revenue += Number(order.total);

      order.items.forEach((item) => {
        const itemProfit =
          (Number(item.price) - Number(item.costPrice)) * item.quantity;
        staffStats[staffId].profit += itemProfit;
      });
    });

    const staffPerformance = Object.entries(staffStats)
      .map(([id, data]) => ({
        ...data,
        avgOrderValue:
          data.orderCount > 0
            ? (data.revenue / data.orderCount).toFixed(2)
            : "0",
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return { success: true, staffPerformance };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInventoryReport() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  try {
    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
      },
    });

    const inventory = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category.name,
      currentStock: p.stock,
      lowStockAlert: p.lowStockAlert,
      stockUnit: p.stockUnit,
      value: Number(p.costPrice || 0) * p.stock,
      status: p.stock <= (p.lowStockAlert || 0) ? "Low" : "Normal",
    }));

    const totalValue = inventory.reduce((sum, item) => sum + item.value, 0);
    const lowStockItems = inventory.filter((item) => item.status === "Low");

    return {
      success: true,
      summary: {
        totalItems: inventory.length,
        totalValue,
        lowStockCount: lowStockItems.length,
      },
      items: inventory,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
