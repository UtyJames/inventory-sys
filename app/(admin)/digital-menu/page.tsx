"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProducts } from "@/app/lib/actions/product.actions";
import { getCategories } from "@/app/lib/actions/category.actions";
import { MenuClient } from "./menu-client";

export default async function AdminMenuPage() {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
        redirect("/auth/sign-in");
    }

    const result = await getProducts();
    const products = result.success ? result.products : [];
    const categories = await getCategories();

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8f9fa]">
            <MenuClient
                initialProducts={JSON.parse(JSON.stringify(products))}
                categories={JSON.parse(JSON.stringify(categories))}
            />
        </div>
    );
}
