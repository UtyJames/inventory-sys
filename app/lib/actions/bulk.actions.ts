"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function bulkCreateProducts(products: any[]) {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
        return { success: false, error: "Unauthorized: Only admins and managers can create products" };
    }

    try {
        // Find existing categories to map names to IDs
        const categories = await prisma.category.findMany();
        const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

        // Prepare items for insertion
        const itemsToCreate = [];
        const errors = [];

        for (let i = 0; i < products.length; i++) {
            const p = products[i];
            const rowNum = i + 2; // +2 because Excel is 1-indexed and row 1 is headers
            
            const categoryName = p.Category?.toString().toLowerCase();
            const categoryId = categoryMap.get(categoryName);

            if (!categoryId) {
                errors.push(`Row ${rowNum}: Category "${p.Category}" not found`);
                continue;
            }

            if (!p.Name || !p.Price) {
                errors.push(`Row ${rowNum}: Product name and price are required`);
                continue;
            }

            // Parse numeric values, treating empty/undefined as truly optional
            const price = parseFloat(p.Price?.toString());
            if (isNaN(price) || price < 0) {
                errors.push(`Row ${rowNum}: Invalid price for "${p.Name}"`);
                continue;
            }

            const costPrice = p.CostPrice ? parseFloat(p.CostPrice.toString()) : undefined;
            const stock = p.Stock ? parseInt(p.Stock.toString()) : 0;
            const lowStockAlert = p.LowStock ? parseInt(p.LowStock.toString()) : undefined;

            // Check if product is a food item (TRUE/FALSE in Excel)
            const isFoodItem = p.IsFoodItem 
                ? p.IsFoodItem.toString().toLowerCase() === 'true' 
                : false;

            // Generate SKU if not provided
            const timestamp = Date.now().toString(36).toUpperCase();
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            const sku = p.SKU?.toString().trim() || `PROD-${timestamp}-${random}`;

            itemsToCreate.push({
                name: p.Name.toString(),
                sku,
                categoryId,
                price,
                costPrice,
                stock: isFoodItem ? 0 : stock,  // Food items don't track stock
                initialStock: isFoodItem ? 0 : stock,
                lowStockAlert: isFoodItem ? undefined : lowStockAlert,
                stockUnit: p.Unit?.toString() || "pcs",
                description: p.Description?.toString() || undefined,
                displayName: p.DisplayName?.toString() || p.Name.toString(),
                trackInventory: !isFoodItem,  // Auto-disable for food items
                isFoodItem,
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
            errors: errors.length > 0 ? errors : null,
            message: errors.length > 0 
                ? `Created ${itemsToCreate.length} products with ${errors.length} errors` 
                : `Successfully created ${itemsToCreate.length} products`
        };
    } catch (error: any) {
        console.error("Bulk upload error:", error);
        
        // Handle Prisma errors
        if (error.code === "P2002") {
            return { success: false, error: "Duplicate SKU detected. Please ensure all SKUs are unique." };
        }
        
        return { success: false, error: error.message || "Failed to bulk create products. Please check your data and try again." };
    }
}
