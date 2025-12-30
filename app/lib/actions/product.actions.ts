"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  costPrice: z.number().optional(),
  initialStock: z.number().min(0).default(0),
  lowStockAlert: z.number().optional(),
  stockUnit: z.string().optional(),
  trackInventory: z.boolean().default(true),
  displayName: z.string().optional(),
  posQuickCode: z.string().optional(),
  printerGroup: z.string().optional(),
  displayColor: z.string().optional(),
  taxRate: z.number().min(0).default(0),
  taxInclusive: z.boolean().default(true),
  discountable: z.boolean().default(true),
  supplierId: z.string().optional(),
  reorderQuantity: z.number().optional(),
  expiryTracking: z.boolean().default(false),
  isSeasonal: z.boolean().default(false),
  status: z.boolean().default(true),
});

export async function getProducts(params?: { categoryId?: string; search?: string }) {
  try {
    const where: any = {};
    if (params?.categoryId) where.categoryId = params.categoryId;
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { sku: { contains: params.search, mode: "insensitive" } },
      ];
    }

    return await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export async function createProduct(data: z.infer<typeof ProductSchema>) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    throw new Error("Unauthorized");
  }

  const validated = ProductSchema.parse(data);

  try {
    const cleanData = { 
      ...validated,
      supplierId: validated.supplierId || null,
      stock: validated.initialStock
    };

    const product = await prisma.product.create({
      data: cleanData as any,
    });
    revalidatePath("/inventory");
    revalidatePath("/pos");
    return { success: true, product };
  } catch (error) {
    console.error("Failed to create product:", error);
    return { success: false, error: "Failed to create product" };
  }
}

export async function updateProduct(id: string, data: Partial<z.infer<typeof ProductSchema>>) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    throw new Error("Unauthorized");
  }

  try {
    // Clean up empty strings for optional relations
    const cleanData = { ...data };
    if (cleanData.supplierId === "") cleanData.supplierId = null as any;
    if (cleanData.categoryId === "") delete (cleanData as any).categoryId; // Category is required, don't allow unsetting

    const product = await prisma.product.update({
      where: { id },
      data: cleanData as any,
    });
    revalidatePath("/inventory");
    revalidatePath("/pos");
    return { success: true, product };
  } catch (error) {
    console.error("Failed to update product:", error);
    return { success: false, error: "Failed to update product" };
  }
}

export async function deleteProduct(id: string) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.product.delete({
      where: { id },
    });
    revalidatePath("/inventory");
    revalidatePath("/pos");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}
