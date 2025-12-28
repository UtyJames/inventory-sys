"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCategories } from "@/app/lib/actions/category.actions";
import { getProducts } from "@/app/lib/actions/product.actions";
import { InventoryClient } from "./inventory-client";

export default async function InventoryPage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string; q?: string }>;
}) {
    const session = await auth();
    if (!session) redirect("/auth/sign-in");

    const resolvedSearchParams = await searchParams;

    // Restrict to Admin/Manager
    if (session.user.role === "CASHIER") {
        redirect("/");
    }

    const rawCategories = await getCategories();
    const rawProducts = await getProducts({
        categoryId: resolvedSearchParams.category,
        search: resolvedSearchParams.q,
    });

    // Deep serialize both products and categories to handle Decimals, Dates, and nested objects for Next.js 15
    const products = JSON.parse(JSON.stringify(rawProducts || [])).map((p: any) => ({
        ...p,
        price: Number(p.price || 0),
        costPrice: Number(p.costPrice || 0),
        taxRate: Number(p.taxRate || 0),
        stock: Number(p.stock || 0),
        lowStockAlert: Number(p.lowStockAlert || 0),
    }));

    const categories = JSON.parse(JSON.stringify(rawCategories || []));

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F8F9FA]">
            <InventoryClient
                initialProducts={products}
                categories={categories}
                user={session.user}
            />
        </div>
    );
}
