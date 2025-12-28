"use client";

import { useState } from "react";
import { Loader2, ArrowUpCircle, Gauge } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { updateStock } from "@/app/lib/actions/inventory.actions";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/format";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "../ui/dialog";

interface StockUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    onSuccess: () => void;
}

export function StockUpdateModal({ isOpen, onClose, product, onSuccess }: StockUpdateModalProps) {
    const [loading, setLoading] = useState(false);
    const [quantity, setQuantity] = useState<number>(0);
    const [updateType, setUpdateType] = useState<"ADD" | "SET">("ADD");

    if (!product) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (quantity === 0 && updateType === "ADD") {
            toast.error("Please enter a quantity greater than 0");
            return;
        }

        setLoading(true);
        try {
            const result = await updateStock(product.id, quantity, updateType);
            if (result.success) {
                toast.success(`Stock ${updateType === "ADD" ? "added" : "updated"} successfully`);
                setQuantity(0);
                onSuccess();
                onClose();
            } else {
                toast.error(result.error || "Failed to update stock");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-0 overflow-hidden bg-white rounded-[32px] border-none shadow-2xl">
                <DialogHeader className="p-8 border-b border-gray-50 bg-gray-50/30">
                    <div>
                        <DialogTitle className="text-xl font-black text-gray-900 tracking-tight">Update Stock</DialogTitle>
                        <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-widest">{product.name}</p>
                    </div>
                </DialogHeader>

                <div className="p-8 bg-brand-50/50 flex items-center justify-between border-b border-brand-100">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-600">Current Level</p>
                        <p className="text-2xl font-black text-brand-900">{formatNumber(product.stock)} <span className="text-sm font-bold text-brand-500 uppercase">{product.stockUnit || 'units'}</span></p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                        <Gauge className="w-6 h-6 text-brand-500" />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="flex p-1 bg-gray-100 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setUpdateType("ADD")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-black transition-all",
                                updateType === "ADD" ? "bg-white text-brand-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <ArrowUpCircle className="w-4 h-4" />
                            Add Stock
                        </button>
                        <button
                            type="button"
                            onClick={() => setUpdateType("SET")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-black transition-all",
                                updateType === "SET" ? "bg-white text-brand-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <Gauge className="w-4 h-4" />
                            Set Fixed
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label htmlFor="quantity" className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {updateType === "ADD" ? "Quantity to Add" : "New Total Quantity"}
                            </label>
                            {updateType === "ADD" && quantity > 0 && (
                                <span className="text-[10px] font-black bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">
                                    Result: {product.stock + quantity}
                                </span>
                            )}
                        </div>
                        <div className="relative group">
                            <input
                                id="quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="w-full h-20 px-8 rounded-3xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-brand-500 transition-all font-black text-4xl text-gray-900 shadow-inner"
                                autoFocus
                            />
                            <div className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-gray-300 uppercase tracking-tight text-sm">
                                {product.stockUnit || 'Units'}
                            </div>
                        </div>
                    </div>

                    {/* Quick Suggestions - Optional refinement */}
                    {updateType === "ADD" && (
                        <div className="flex gap-2 pb-2">
                            {[1, 5, 10, 20].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setQuantity(prev => prev + num)}
                                    className="flex-1 py-2 rounded-xl bg-white border border-gray-100 text-xs font-black text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-all"
                                >
                                    +{num}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-4 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 h-14 rounded-2xl font-bold text-gray-400 hover:text-gray-900"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || (updateType === "ADD" && quantity === 0)}
                            className="flex-[2] h-14 rounded-2xl font-black bg-brand-500 hover:bg-brand-600 shadow-xl shadow-brand-500/20 text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Update Status"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
