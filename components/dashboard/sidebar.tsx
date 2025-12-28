"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingBag,
    UtensilsCrossed,
    Warehouse,
    Users,
    BarChart3,
    Settings,
    LogOut,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

const sidebarLinks = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "CASHIER"] },
    { name: "Orders", href: "/orders", icon: ShoppingBag, roles: ["ADMIN", "MANAGER", "CASHIER"], badge: "8" },
    { name: "Menu Mgmt", href: "/menu", icon: UtensilsCrossed, roles: ["ADMIN", "MANAGER"] },
    { name: "Inventory", href: "/inventory", icon: Warehouse, roles: ["ADMIN", "MANAGER"] },
    { name: "Staff", href: "/staff", icon: Users, roles: ["ADMIN"] },
    { name: "Reports", href: "/reports", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
];

interface SidebarProps {
    user?: {
        name?: string | null;
        role?: string;
        image?: string | null;
        email?: string | null;
    };
}

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredLinks = sidebarLinks.filter(link =>
        !user?.role || link.roles.includes(user.role as any)
    );

    return (
        <div className="w-64 border-r bg-white flex flex-col h-screen sticky top-0">
            <div className="p-6 flex items-center gap-3">
                <div className="bg-brand-500 rounded-lg p-1.5 flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-lg tracking-tight leading-none text-gray-900">Ktc stocks POS</span>
                    <span className="text-xs text-gray-500 mt-1 capitalize">{user?.role?.toLowerCase()} View</span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                {filteredLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={cn(
                                "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group",
                                isActive
                                    ? "bg-brand-50 text-brand-600 font-medium"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <link.icon className={cn(
                                    "w-5 h-5",
                                    isActive ? "text-brand-600" : "text-gray-400 group-hover:text-gray-600"
                                )} />
                                <span className="text-sm">{link.name}</span>
                            </div>
                            {link.badge && (
                                <span className="bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                                    {link.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t space-y-2">
                <Link
                    href="/settings"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"
                >
                    <Settings className="w-5 h-5" />
                    <span className="text-sm">Settings</span>
                </Link>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={cn(
                            "w-full flex items-center justify-between px-3 py-3 mt-4 bg-gray-50 rounded-2xl border border-transparent transition-all hover:bg-gray-100",
                            isMenuOpen && "border-brand-200 bg-white shadow-sm"
                        )}
                    >
                        <div className="flex items-center gap-3 overflow-hidden text-left">
                            <div className="w-10 h-10 rounded-full bg-brand-100 flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                                {user?.image ? (
                                    <img src={user.image} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-brand-600 font-bold text-sm">
                                        {user?.name?.charAt(0) || "U"}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-gray-900 truncate tracking-tight">{user?.name || "User"}</span>
                                <span className="text-[10px] text-gray-500 truncate capitalize font-medium">{user?.role?.toLowerCase()}</span>
                            </div>
                        </div>
                        <ChevronRight className={cn(
                            "w-4 h-4 text-gray-400 transition-transform duration-200",
                            isMenuOpen && "rotate-90"
                        )} />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
                            <div className="px-4 py-2 border-b border-gray-50 mb-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Session</p>
                            </div>
                            <Link
                                href="/profile"
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                            >
                                <Users className="w-4 h-4" />
                                <span>My Profile</span>
                            </Link>
                            <button
                                onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="font-bold">Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
