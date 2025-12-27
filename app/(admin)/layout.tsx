"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingCart,
    UtensilsCrossed,
    Package,
    Users,
    BarChart3,
    Settings,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/inventory", icon: LayoutDashboard },
    { name: "Orders", href: "/pos", icon: ShoppingCart },
    { name: "Menu Mgmt", href: "/inventory/menu", icon: UtensilsCrossed },
    { name: "Inventory", href: "/inventory/stock", icon: Package },
    { name: "Staff", href: "/users", icon: Users },
    { name: "Reports", href: "/sales", icon: BarChart3 },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="hidden w-64 flex-col bg-white border-r border-gray-200 md:flex">
                <div className="flex h-16 items-center px-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="bg-brand-500 rounded-lg p-1">
                            <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                        </div>
                        <div>
                            <span className="font-bold text-lg tracking-tight text-gray-900 leading-none block">Bistro POS</span>
                            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider block">Manager View</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-1 px-3 py-6 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/inventory" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-brand-50 text-brand-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive ? "text-brand-600" : "text-gray-400")} />
                                {item.name}
                                {item.name === "Orders" && (
                                    <span className="ml-auto flex h-2 w-2 rounded-full bg-brand-500"></span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                <div className="p-3 border-t border-gray-100">
                    <Link
                        href="/inventory/settings"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        <Settings className="h-5 w-5 text-gray-400" />
                        Settings
                    </Link>
                    <div className="mt-4 flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="h-9 w-9 rounded-full bg-gray-200 flex-shrink-0">
                            <img src="https://avatar.vercel.sh/alex" className="h-full w-full rounded-full" alt="User" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">Alex Morgan</p>
                            <p className="text-xs text-gray-500 truncate">Store Manager</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header (Mobile mostly, or global actions) */}
                <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-gray-200 md:hidden">
                    <span className="font-bold text-xl">BistroPOS</span>
                    {/* Mobile menu trigger would go here */}
                </header>

                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
