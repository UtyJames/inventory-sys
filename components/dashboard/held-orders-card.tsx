"use client";

import { useEffect, useState } from "react";
import { getPendingOrders } from "@/app/lib/actions/order.actions";
import { Clock, User } from "lucide-react";
import { formatNaira } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export function HeldOrdersCard() {
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedNote, setSelectedNote] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchOrders = async () => {
            const res = await getPendingOrders();
            if (res.success) {
                setOrders(res.orders);
            }
        };
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    if (orders.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mt-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    Held Orders
                </h3>
                <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
                    {orders.length} Pending
                </span>
            </div>

            <div className="space-y-3">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-orange-50 transition-colors group cursor-pointer"
                        onClick={() => router.push("/pos")}
                    >
                        <div>
                            <p className="font-bold text-gray-900 text-sm">{order.customerName || "Unnamed"}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-medium text-gray-400">{formatNaira(order.total)}</span>
                                {order.tableNumber && (
                                    <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-md">
                                        Table {order.tableNumber}
                                    </span>
                                )}
                                {order.user?.name ? (
                                    <span className="flex items-center gap-1 text-[10px] text-gray-400 bg-white px-1.5 py-0.5 rounded-md shadow-sm">
                                        <User className="w-3 h-3" />
                                        {order.user.name}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[10px] text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md font-black italic">
                                        VISITOR ORDER
                                    </span>
                                )}
                                {order.notes && (
                                    <span
                                        className="text-[10px] font-bold text-gray-400 truncate max-w-[100px] block hover:text-brand-600 transition-colors cursor-help"
                                        title="Click to view full note"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedNote(order.notes);
                                        }}
                                    >
                                        📝 {order.notes}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                ))}
            </div>

            <Button
                variant="ghost"
                className="w-full mt-4 text-xs font-bold text-gray-400 hover:text-brand-600"
                onClick={() => router.push("/pos")}
            >
                View in POS
            </Button>

            {/* Note View Modal */}
            <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
                <DialogContent className="max-w-md p-0 overflow-hidden bg-white rounded-[40px] border-none shadow-2xl">
                    <DialogHeader className="p-8 border-b border-gray-50 bg-gray-50/30">
                        <DialogTitle className="text-xl font-black text-gray-900 tracking-tight uppercase">Order Notes</DialogTitle>
                        <DialogDescription className="sr-only">Viewing customer notes for this order.</DialogDescription>
                    </DialogHeader>
                    <div className="p-8">
                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 italic text-gray-600 font-medium">
                            "{selectedNote}"
                        </div>
                    </div>
                    <div className="p-6 border-t border-gray-50 flex justify-center">
                        <Button
                            onClick={() => setSelectedNote(null)}
                            className="bg-gray-900 text-white font-black h-12 px-8 rounded-2xl"
                        >
                            Got it
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
