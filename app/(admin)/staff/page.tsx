import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StaffList } from "@/components/staff/staff-list";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStaffPerformanceReport } from "@/app/lib/actions/order.actions";
import { getAllStaff } from "@/app/lib/actions/staff.actions";

export default async function StaffPage() {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
        redirect("/");
    }

    const staffResult = await getAllStaff();
    const staff = staffResult.success ? (staffResult.data || []) : [];

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <main className="flex-1 flex flex-col">
                <header className="px-8 py-6 flex items-center justify-between sticky top-0 bg-gray-50/80 backdrop-blur-md z-10 border-b border-gray-100">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Staff Management</h1>
                        <p className="text-gray-500 font-medium text-xs mt-1">Manage access and view performance</p>
                    </div>
                    {session.user.role === "ADMIN" && (
                        <Button className="rounded-2xl h-12 px-6 font-black bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/20">
                            <Plus className="mr-2 h-5 w-5" />
                            Add Staff
                        </Button>
                    )}
                </header>

                <div className="p-8">
                    <StaffList initialStaff={staff} currentUserRole={session.user.role} />
                </div>
            </main>
        </div>
    );
}
