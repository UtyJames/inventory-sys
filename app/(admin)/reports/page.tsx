"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSalesReports, getProfitAnalysisReport, getStaffPerformanceReport, getInventoryReport } from "@/app/lib/actions/order.actions";
import { prisma } from "@/lib/prisma";
import { ReportsClient } from "./reports-client";
import "./print-styles.css";

export default async function ReportsPage({
    searchParams,
}: {
    searchParams: Promise<{
        from?: string;
        to?: string;
        userId?: string;
        paymentType?: string
    }>;
}) {
    const session = await auth();
    if (!session) redirect("/auth/sign-in");

    // Restrict to Admin/Manager
    if (session.user.role === "CASHIER") {
        redirect("/");
    }

    const resolvedParams = await searchParams;

    const filters = {
        startDate: resolvedParams.from ? new Date(resolvedParams.from) : undefined,
        endDate: resolvedParams.to ? new Date(resolvedParams.to) : undefined,
        userId: resolvedParams.userId,
        paymentType: resolvedParams.paymentType
    };

    const reportsResult = await getSalesReports(filters);
    const reports = reportsResult.success ? reportsResult.reports : [];

    // Fetch new report types
    const profitResult = await getProfitAnalysisReport(filters);
    const staffResult = await getStaffPerformanceReport(filters);
    const inventoryResult = await getInventoryReport();

    // Fetch cashiers/staff for filtering
    const staff = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            role: true
        },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="flex-1 flex flex-col h-full bg-[#F8F9FA]">
            <ReportsClient
                initialReports={reports}
                staff={staff}
                currentUser={session.user}
                profitAnalysis={profitResult.success ? profitResult : null}
                staffPerformance={staffResult.success ? staffResult : null}
                inventoryReport={inventoryResult.success ? inventoryResult : null}
            />
        </div>
    );
}
