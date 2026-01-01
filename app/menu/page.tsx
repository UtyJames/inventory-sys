"use server";

import { getMenuProducts } from "@/app/lib/actions/menu.actions";
import { PublicMenuClient } from "./menu-client";

export default async function PublicMenuPage() {
    // PUBLIC PAGE - NO AUTH
    const result = await getMenuProducts();

    return (
        <div className="min-h-screen bg-[#F8F9FA]">
            <PublicMenuClient initialMenu={result.menu || {}} />
        </div>
    );
}
