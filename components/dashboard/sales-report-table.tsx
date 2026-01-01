"use client";

import {
    ChevronRight,
    MoreVertical,
    Calendar,
    Filter,
    Printer
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ReceiptPrinter } from "@/components/reports/receipt-printer";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { formatNaira } from "@/lib/utils/format";

interface SalesReportTableProps {
    reports?: any[];
}

export function SalesReportTable({ reports = [] }: SalesReportTableProps) {
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 flex items-center justify-between border-b border-gray-50">
                <div>
                    <h2 className="text-xl font-black text-gray-900">Recent Sales Activity</h2>
                    <p className="text-sm text-gray-500 mt-1">Detailed overview of last few transactions</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Filter
                    </Button>
                    <Link href="/reports">
                        <Button variant="outline" size="sm" className="rounded-xl flex items-center gap-2 text-brand-600">
                            View All
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Sale ID</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Table</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Items</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Cashier</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {reports.map((sale) => (
                            <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group text-xs">
                                <td className="px-6 py-4 font-bold text-gray-900">{sale.orderNumber}</td>
                                <td className="px-6 py-4">
                                    {sale.tableNumber ? (
                                        <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">
                                            {sale.tableNumber}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 font-medium">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-900">{sale.items[0]?.name} {sale.items.length > 1 ? `+ ${sale.items.length - 1} more` : ""}</span>
                                        <span className="text-gray-400">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600 font-medium">{sale.user?.name || "Staff"}</td>
                                <td className="px-6 py-4 font-black text-brand-600">{formatNaira(sale.total)}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${sale.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                                        }`}>
                                        {sale.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px] shadow-2xl border-none">
                                            <DropdownMenuItem
                                                onClick={() => setSelectedOrder(sale)}
                                                className="rounded-xl flex items-center gap-3 px-3 py-2.5 font-bold text-gray-600 hover:text-brand-600 cursor-pointer"
                                            >
                                                <Printer className="w-4 h-4" />
                                                Reprint Receipt
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                        {reports.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                    No sales yet today
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Receipt Reprint Modal */}
            {selectedOrder && (
                <ReceiptPrinter
                    isOpen={!!selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    order={selectedOrder}
                />
            )}
        </div>
    );
}
