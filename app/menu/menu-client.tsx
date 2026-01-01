"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Utensils,
    ShoppingCart,
    Plus,
    Minus,
    X,
    ChevronRight,
    Clock,
    CheckCircle2,
    Info,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/utils/format";
import { createVisitorOrder } from "@/app/lib/actions/menu.actions";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface PublicMenuClientProps {
    initialMenu: Record<string, any[]>;
}

export function PublicMenuClient({ initialMenu }: PublicMenuClientProps) {
    const [cart, setCart] = useState<any[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<string>("All");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const [lastOrderNumber, setLastOrderNumber] = useState("");

    // Form fields
    const [tableNumber, setTableNumber] = useState("");
    const [notes, setNotes] = useState("");

    const categories = useMemo(() => ["All", ...Object.keys(initialMenu)], [initialMenu]);

    const filteredMenu = useMemo(() => {
        let result: Record<string, any[]> = {};

        Object.entries(initialMenu).forEach(([cat, products]) => {
            if (activeCategory !== "All" && cat !== activeCategory) return;

            const filteredProducts = products.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filteredProducts.length > 0) {
                result[cat] = filteredProducts;
            }
        });

        return result;
    }, [initialMenu, activeCategory, searchQuery]);

    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                return prev.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                price: Number(product.price),
                quantity: 1
            }];
        });
        toast.success(`Added ${product.name} to cart`);
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const handleSubmitOrder = async () => {
        if (!tableNumber) {
            toast.error("Please enter your table number");
            return;
        }
        if (cart.length === 0) return;

        setIsSubmitting(true);
        try {
            const res = await createVisitorOrder({
                items: cart,
                tableNumber,
                notes
            });

            if (res.success) {
                setLastOrderNumber(res.order.orderNumber);
                setCart([]);
                setTableNumber("");
                setNotes("");
                setIsCartOpen(false);
                setIsSuccessOpen(true);
            } else {
                toast.error(res.error || "Failed to submit order");
            }
        } catch (error) {
            toast.error("Failed to connect to server");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen max-w-2xl mx-auto bg-white shadow-xl relative">
            {/* Mobile-First Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-100">
                        <Utensils className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 leading-none">Eres Place</h1>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Digital Menu</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsCartOpen(true)}
                    className="relative w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-gray-200 transition-transform active:scale-95"
                >
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-brand-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-in zoom-in">
                            {cartCount}
                        </span>
                    )}
                </button>
            </header>

            {/* Welcome Banner */}
            <div className="px-6 py-8 bg-brand-500 relative overflow-hidden shrink-0">
                <div className="relative z-10 text-white">
                    <h2 className="text-3xl font-black mb-2 tracking-tight">Welcome to <br /> Eres Place!</h2>
                    <p className="text-white/80 font-bold text-sm">Delicious meals at your fingertips.</p>
                </div>
                {/* Decorative circles */}
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-black/5 rounded-full blur-xl" />
            </div>

            {/* Search & Categories */}
            <div className="sticky top-[73px] z-20 bg-white/95 backdrop-blur-md px-6 py-4 space-y-4 border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search for food..."
                        className="pl-11 h-14 rounded-3xl bg-gray-50 border-none focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all font-bold text-sm"
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-6 py-3 rounded-2xl text-[13px] font-black whitespace-nowrap transition-all",
                                activeCategory === cat
                                    ? "bg-gray-900 text-white shadow-lg shadow-gray-200"
                                    : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu List */}
            <main className="flex-1 px-6 py-6 pb-32">
                {Object.entries(filteredMenu).map(([category, products]) => (
                    <div key={category} className="mb-10 last:mb-0">
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-[11px] font-black text-brand-600 uppercase tracking-[0.2em]">{category}</h3>
                            <div className="h-px bg-brand-100 flex-1" />
                        </div>

                        <div className="space-y-4">
                            {products.map(product => (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-[28px] p-4 border border-gray-50 shadow-sm flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
                                >
                                    <div className="w-24 h-24 rounded-2xl bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center">
                                        {product.image ? (
                                            <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                                        ) : (
                                            <Utensils className="w-8 h-8 text-gray-200" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                        <div>
                                            <h4 className="font-extrabold text-[#111827] text-base leading-tight truncate">{product.name}</h4>
                                            <p className="text-[11px] text-gray-400 font-bold mt-1 line-clamp-2 leading-relaxed">
                                                {product.description || "Freshly prepared for you."}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="font-black text-brand-600 text-lg">{formatNaira(Number(product.price))}</span>
                                            <button
                                                onClick={() => addToCart(product)}
                                                className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-brand-500 hover:text-white transition-all active:scale-90"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {Object.keys(filteredMenu).length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Utensils className="w-10 h-10 text-gray-200" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">No items found</h3>
                        <p className="text-sm font-bold text-gray-400">Try searching for something else!</p>
                    </div>
                )}
            </main>

            {/* Cart Button (Always Visible if items) */}
            {cartCount > 0 && !isCartOpen && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-lg z-40 animate-in slide-in-from-bottom-8 duration-500">
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="w-full h-16 bg-gray-900 rounded-[28px] shadow-2xl shadow-gray-900/40 flex items-center justify-between px-8 text-white group overflow-hidden relative active:scale-95 transition-transform"
                    >
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                                <ShoppingCart className="w-4 h-4" />
                            </div>
                            <span className="font-black text-sm uppercase tracking-widest">View Your Order</span>
                        </div>
                        <div className="relative z-10 flex items-center gap-3">
                            <span className="font-black text-xl">{formatNaira(cartTotal)}</span>
                            <ChevronRight className="w-5 h-5 text-brand-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                        {/* Background glow */}
                        <div className="absolute right-0 top-0 w-32 h-full bg-brand-500/20 blur-2xl" />
                    </button>
                </div>
            )}

            {/* Shopping Cart Drawer */}
            <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden bg-white rounded-[40px] border-none shadow-2xl h-[90vh] flex flex-col">
                    <DialogHeader className="p-8 pb-4 shrink-0 flex flex-row items-center justify-between border-b border-gray-50">
                        <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">My Order</DialogTitle>
                        <button onClick={() => setIsCartOpen(false)} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                            <X className="w-5 h-5" />
                        </button>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        {/* Cart Items */}
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.productId} className="flex items-center justify-between gap-4 p-4 rounded-3xl border border-gray-50 bg-[#fafafa]">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-[#111827] truncate">{item.name}</p>
                                        <p className="text-xs font-bold text-brand-600 mt-1">{formatNaira(item.price)} each</p>
                                    </div>
                                    <div className="flex items-center bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                                        <button
                                            onClick={() => updateQuantity(item.productId, -1)}
                                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.productId, 1)}
                                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Details Form */}
                        <div className="space-y-6 pt-6 border-t border-gray-50">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Table Number</label>
                                <Input
                                    placeholder="Enter your table number (e.g. 5)"
                                    className="h-14 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-black text-gray-900"
                                    value={tableNumber}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTableNumber(e.target.value)}
                                />
                                <p className="text-[10px] font-bold text-gray-400 ml-1">Find this on the sticker on your table.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Special Requests (Optional)</label>
                                <Textarea
                                    placeholder="Extra spicy, no onions, cold water etc."
                                    className="min-h-[100px] p-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-bold text-gray-900 resize-none"
                                    value={notes}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t border-gray-50 bg-white shrink-0 space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="font-black text-gray-400 uppercase tracking-widest text-[11px]">Total Due</span>
                            <span className="font-black text-3xl text-gray-900">{formatNaira(cartTotal)}</span>
                        </div>

                        <Button
                            disabled={cart.length === 0 || !tableNumber || isSubmitting}
                            onClick={handleSubmitOrder}
                            className="w-full h-16 rounded-[28px] bg-brand-500 hover:bg-brand-600 text-white font-black text-lg shadow-xl shadow-brand-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-3 border-none disabled:opacity-50 disabled:bg-gray-200"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Sending...</span>
                                </div>
                            ) : (
                                <>
                                    <span>Send Order to Kitchen</span>
                                    <ChevronRight className="w-6 h-6" />
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Success Modal */}
            <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden bg-white rounded-[40px] border-none shadow-2xl">
                    <div className="p-12 text-center h-full flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-green-50 rounded-[40px] flex items-center justify-center text-green-500 mb-8 animate-bounce">
                            <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight leading-none">Order Sent!</h2>
                        <p className="text-sm font-bold text-gray-400 leading-relaxed mb-8">
                            We've received your order <span className="text-gray-900">#{lastOrderNumber}</span>. Your food is being prepared and will be delivered to <span className="text-brand-600">Table {tableNumber || "?"}</span> shortly.
                        </p>
                        <Button
                            onClick={() => setIsSuccessOpen(false)}
                            className="w-full h-14 rounded-2xl bg-gray-900 text-white font-black hover:bg-black transition-all"
                        >
                            Awesome, Thanks!
                        </Button>
                        <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-orange-400 uppercase tracking-widest">
                            <Clock className="w-3 h-3" />
                            Estimated 15-20 mins
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Footer Information */}
            <footer className="px-6 py-12 bg-gray-50 border-t border-gray-100 text-center shrink-0">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-200 mx-auto mb-4 border border-gray-100">
                    <Info className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-gray-900 text-sm mb-2">Need assistance?</h4>
                <p className="text-xs font-bold text-gray-400 max-w-[200px] mx-auto leading-relaxed">
                    Simply call any of our floor attendants for help with your order.
                </p>
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic opacity-50">Powered by Ktcstocks Inventory</p>
                </div>
            </footer>
        </div>
    );
}
