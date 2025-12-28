"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function bulkCreateProducts(products: any[]) {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
        throw new Error("Unauthorized");
    }

    try {
        // Find existing categories to map names to IDs
        const categories = await prisma.category.findMany();
        const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

        // Prepare items for insertion
        const itemsToCreate = [];
        const errors = [];

        for (const p of products) {
            const categoryName = p.Category?.toString().toLowerCase();
            const categoryId = categoryMap.get(categoryName);

            if (!categoryId) {
                errors.push(`Category "${p.Category}" not found for product "${p.Name}"`);
                continue;
            }

            if (!p.Name || !p.Price) {
                errors.push(`Product name and price are required for "${p.Name || 'Unknown'}"`);
                continue;
            }

            itemsToCreate.push({
                name: p.Name.toString(),
                sku: p.SKU?.toString() || "",
                categoryId,
                price: parseFloat(p.Price.toString()) || 0,
                costPrice: parseFloat(p.CostPrice?.toString()) || 0,
                stock: parseInt(p.Stock?.toString()) || 0,
                lowStockAlert: parseInt(p.LowStock?.toString()) || 0,
                stockUnit: p.Unit?.toString() || "pcs",
                description: p.Description?.toString() || "",
                displayName: p.DisplayName?.toString() || p.Name.toString(),
                trackInventory: true,
                status: true,
            });
        }

        if (itemsToCreate.length > 0) {
            await prisma.product.createMany({
                data: itemsToCreate,
                skipDuplicates: true,
            });
        }

        revalidatePath("/inventory");
        
        return { 
            success: true, 
            count: itemsToCreate.length,
            errors: errors.length > 0 ? errors : null 
        };
    } catch (error: any) {
        console.error("Bulk upload error:", error);
        return { success: false, error: error.message || "Failed to bulk create products" };
    }
}
