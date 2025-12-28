import { prisma } from "@/lib/prisma";
import { POSClient } from "./pos-client";
import { auth } from "@/lib/auth";

export default async function POSPage() {
    const session = await auth();
    const rawProducts = await prisma.product.findMany({
        where: {
            status: true,
        },
        include: {
            category: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    });

    const categories = await prisma.category.findMany({
        select: {
            id: true,
            name: true,
        },
        orderBy: {
            name: "asc",
        },
    });

    // Serialize data for client component
    const products = JSON.parse(JSON.stringify(rawProducts || []));
    const serializedCategories = JSON.parse(JSON.stringify(categories || []));

    return <POSClient products={products} categories={serializedCategories} session={session} />;
}

