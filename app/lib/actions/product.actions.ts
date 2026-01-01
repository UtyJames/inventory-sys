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
  price: z.number().min(0, "Price must be a positive number"),
  costPrice: z.number().optional(),
  initialStock: z.number().min(0, "Stock cannot be negative").optional(),
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
  isFoodItem: z.boolean().default(false),
  status: z.boolean().default(true),
  showOnMenu: z.boolean().default(false),
  menuCategory: z.string().optional(),
  menuOrder: z.number().default(999),
});

// Helper function to generate unique SKU
async function generateUniqueSKU(): Promise<string> {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const sku = `PROD-${timestamp}-${random}`;
  
  // Check if SKU already exists (very unlikely but just in case)
  const existing = await prisma.product.findUnique({ where: { sku } });
  if (existing) {
    // Recursively try again if collision (extremely rare)
    return generateUniqueSKU();
  }
  
  return sku;
}

export async function getProducts(params?: { 
  categoryId?: string; 
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 12;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params?.categoryId) where.categoryId = params.categoryId;
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { sku: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { name: "asc" },
        skip,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      success: true,
      products,
      totalCount,
      page,
      pageSize,
    };
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return {
      products: [],
      totalCount: 0,
      page: 1,
      pageSize: 12,
    };
  }
}

export async function createProduct(data: z.input<typeof ProductSchema>) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return { success: false, error: "Unauthorized: Only admins and managers can create products" };
  }

  try {
    // Validate the data
    const validated = ProductSchema.parse(data);

    // Auto-generate SKU if not provided
    const sku = validated.sku && validated.sku.trim() !== "" 
      ? validated.sku 
      : await generateUniqueSKU();

    // Auto-disable stock tracking for food items
    const trackInventory = validated.isFoodItem ? false : validated.trackInventory;
    const stockValue = validated.isFoodItem ? 0 : (validated.initialStock ?? 0);
    
    const cleanData = { 
      ...validated,
      sku,
      supplierId: validated.supplierId || null,
      trackInventory,
      stock: stockValue,
      initialStock: stockValue,
    };

    const product = await prisma.product.create({
      data: cleanData as any,
    });
    
    revalidatePath("/inventory");
    revalidatePath("/pos");
    return { success: true, product };
  } catch (error: any) {
    console.error("Failed to create product:", error);
    
    // Handle Zod validation errors
    if (error.name === "ZodError") {
      const fieldErrors = error.errors.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return { success: false, error: `Validation failed: ${fieldErrors}` };
    }
    
    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "field";
      return { success: false, error: `A product with this ${field} already exists` };
    }
    
    // Generic error
    return { success: false, error: error.message || "Failed to create product. Please try again." };
  }
}

export async function updateProduct(id: string, data: Partial<z.input<typeof ProductSchema>>) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return { success: false, error: "Unauthorized: Only admins and managers can update products" };
  }

  try {
    // Reading file firsty strings for optional relations
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
  } catch (error: any) {
    console.error("Failed to update product:", error);
    
    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "field";
      return { success: false, error: `A product with this ${field} already exists` };
    }
    
    // Handle not found errors
    if (error.code === "P2025") {
      return { success: false, error: "Product not found" };
    }
    
    return { success: false, error: error.message || "Failed to update product. Please try again." };
  }
}

export async function deleteProduct(id: string) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
    return { success: false, error: "Unauthorized: Only admins and managers can delete products" };
  }

  try {
    await prisma.product.delete({
      where: { id },
    });
    
    revalidatePath("/inventory");
    revalidatePath("/pos");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    
    // Handle not found errors
    if (error.code === "P2025") {
      return { success: false, error: "Product not found" };
    }
    
    // Handle foreign key constraint errors (product is referenced elsewhere)
    if (error.code === "P2003") {
      return { success: false, error: "Cannot delete product: it has associated orders or inventory movements" };
    }
    
    return { success: false, error: error.message || "Failed to delete product. Please try again." };
  }
}
