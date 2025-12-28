"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
    Search,
    LayoutGrid,
    Plus,
    Minus,
    Trash2,
    ArrowLeft,
    Clock,
    Users,
    ChevronDown,
    Split,
    Percent,
    ArrowRightLeft,
    Printer,
    Save,
    CreditCard,
    Utensils,
    Info,
    X,
    CheckCircle2,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { formatNaira, formatNumber } from "@/lib/utils/format";
import { createOrder, getPendingOrders, deleteOrder } from "@/app/lib/actions/order.actions";
import { toast } from "sonner";

interface Product {
    id: string;
    name: string;
    price: number;
    image?: string;
    categoryId: string;
    category: { name: string };
    description?: string;
    stock: number;
    stockUnit?: string;
    displayColor?: string;
}

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    productId: string;
}

interface POSClientProps {
    products: Product[];
    categories: { id: string; name: string }[];
    session: any;
}

export function POSClient({ products, categories: initialCategories, session: serverSession }: POSClientProps) {
    const { data: clientSession } = useSession();
    const session = serverSession || clientSession;
    const [selectedCategory, setSelectedCategory] = useState("All Items");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Checkout States
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [paymentType, setPaymentType] = useState<"CASH" | "CARD" | "TRANSFER">("CASH");
    const [amountTendered, setAmountTendered] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);

    // Receipt States
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [lastOrder, setLastOrder] = useState<any>(null);

    // Held Orders States
    const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [isPendingOrdersOpen, setIsPendingOrdersOpen] = useState(false);
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);

    // User Menu State
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    useEffect(() => {
        fetchPendingOrders();
    }, []);

    const fetchPendingOrders = async () => {
        const result = await getPendingOrders();
        if (result.success) {
            setPendingOrders(result.orders);
        }
    };

    const categories = ["All Items", ...initialCategories.map(c => c.name)];

    const filteredItems = useMemo(() => {
        return products.filter(item => {
            const matchesCategory = selectedCategory === "All Items" || item.category.name === selectedCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch && item.stock > 0;
        });
    }, [products, selectedCategory, searchQuery]);

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    // Calculated tax based on individual product tax rates (if we had them) or set to 0 as requested to remove dummy tax
    const tax = 0;
    const total = subtotal + tax;

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(i => i.productId === product.id);
            if (existing) {
                return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                id: Math.random().toString(36).substr(2, 9),
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1
            }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(i => i.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.id === id) {
                const newQty = Math.max(1, i.quantity + delta);
                // Check stock limit
                const product = products.find(p => p.id === i.productId);
                if (product && newQty > product.stock) {
                    toast.error(`Only ${product.stock} ${product.stockUnit || 'units'} available`);
                    return i;
                }
                return { ...i, quantity: newQty };
            }
            return i;
        }));
    };

    const handleSaveOrder = async (status: "PENDING" | "COMPLETED" = "COMPLETED") => {
        if (cart.length === 0) return;

        // If holding order, ensure name is provided
        if (status === "PENDING" && !customerName) {
            setIsHoldModalOpen(true);
            return;
        }

        // For completed orders, validate payment
        if (status === "COMPLETED" && paymentType === "CASH") {
            const tendered = parseFloat(amountTendered || "0");
            if (tendered < total) {
                toast.error("Amount tendered is less than total");
                return;
            }
        }

        setIsProcessing(true);
        try {
            const orderData = {
                items: cart.map(item => ({
                    productId: item.productId,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.price * item.quantity
                })),
                subtotal,
                tax,
                total,
                paymentType,
                amountTendered: parseFloat(amountTendered || total.toString()),
                changeAmount: Math.max(0, parseFloat(amountTendered || total.toString()) - total),
                status,
                customerName: customerName || undefined
            };

            const result = await createOrder(orderData);
            if (result.success) {
                toast.success(status === "COMPLETED" ? "Sale completed!" : "Order saved!");
                setLastOrder(result.order);
                setCart([]);
                setAmountTendered("");
                setCustomerName("");
                setIsCheckoutOpen(false);
                setIsHoldModalOpen(false);
                fetchPendingOrders();
                if (status === "COMPLETED") {
                    setIsReceiptOpen(true);
                }
            } else {
                toast.error(result.error || "Failed to save order");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsProcessing(false);
        }
    };

    const resumeOrder = (order: any) => {
        // Confirm if cart is not empty
        if (cart.length > 0) {
            if (!confirm("Your current cart will be replaced. Continue?")) return;
        }

        const restoredCart = order.items.map((item: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }));

        setCart(restoredCart);
        setCustomerName(order.customerName || "");
        setIsPendingOrdersOpen(false);
        toast.info(`Resumed order: ${order.customerName || order.orderNumber}`);

        // Optionally delete the pending order so it doesn't stay there
        // Or keep it and update it later. Common practice is to delete it once resumed.
        handleDeleteOrder(order.id, true);
    };

    const handleDeleteOrder = async (orderId: string, quiet = false) => {
        const result = await deleteOrder(orderId);
        if (result.success) {
            if (!quiet) toast.success("Order removed");
            fetchPendingOrders();
        } else if (!quiet) {
            toast.error("Failed to remove order");
        }
    };

    const printReceipt = () => {
        const printContent = document.getElementById("thermal-receipt");
        if (!printContent) return;

        const printWindow = window.open('', '', 'width=400,height=600');
        if (!printWindow) return;

        printWindow.document.write('<html><head><title>Receipt</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            @media print {
                body { margin: 0; padding: 10px; width: 80mm; font-family: 'Courier New', Courier, monospace; font-size: 12px; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .dashed { border-top: 1px dashed #000; margin: 10px 0; }
                .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 5px; }
                .header { margin-bottom: 15px; }
                .footer { margin-top: 20px; text-align: center; font-style: italic; }
            }
        `);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const changeDue = Math.max(0, parseFloat(amountTendered || "0") - total);

    return (
        <div className="flex h-screen bg-[#F8F9FA] overflow-hidden font-sans">
            {/* Main POS Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="bg-brand-500 p-2 rounded-xl text-white shadow-lg shadow-brand-200">
                                <Utensils className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="font-black text-xl text-gray-900 tracking-tight leading-none text-[22px]">Ktcstock Inventory</h1>
                                <div className="flex items-center gap-2 mt-1.5 font-medium text-[12px]">
                                    <span className="flex items-center gap-1 text-green-500">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Online
                                    </span>
                                    <span className="text-gray-400">• Today, {new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/inventory"
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all font-bold text-sm"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Dashboard
                            </Link>
                        </div>
                        <div className="relative ml-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products (Ctrl+K)"
                                className="h-12 w-80 pl-11 bg-[#F1F3F5] border-none rounded-2xl text-[14px] font-medium transition-all focus:ring-2 focus:ring-brand-500 focus:bg-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-3 pl-4 group"
                            >
                                <div className="text-right">
                                    <p className="text-[14px] font-black leading-none group-hover:text-brand-600 transition-colors">{session?.user?.name || "Staff Member"}</p>
                                    <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{session?.user?.role || "Cashier"}</p>
                                </div>
                                <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center ring-2 ring-white shadow-sm overflow-hidden text-brand-600 font-bold uppercase group-hover:ring-brand-100 transition-all">
                                    {session?.user?.image ? (
                                        <img src={session.user.image} className="w-full h-full object-cover" />
                                    ) : (
                                        session?.user?.name?.charAt(0) || "S"
                                    )}
                                </div>
                            </button>

                            {/* User Dropdown */}
                            {isUserMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 py-3 z-20 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-5 py-4 border-b border-gray-50 mb-2">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Signed in as</p>
                                            <p className="text-sm font-bold text-gray-900 truncate">{session?.user?.email || session?.user?.name}</p>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setIsUserMenuOpen(false);
                                                toast.info("Settings coming soon!");
                                            }}
                                            className="w-full px-5 py-3 flex items-center gap-3 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                                                <Users className="w-4 h-4" />
                                            </div>
                                            Profile Settings
                                        </button>

                                        <div className="px-2 my-2">
                                            <div className="h-px bg-gray-50" />
                                        </div>

                                        <button
                                            onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}
                                            className="w-full px-5 py-3 flex items-center gap-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                                                <X className="w-4 h-4" />
                                            </div>
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Categories */}
                <div className="px-8 pt-8 shrink-0">
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-6 py-3.5 rounded-2xl text-[14px] font-bold whitespace-nowrap transition-all",
                                    selectedCategory === cat
                                        ? "bg-gray-900 text-white shadow-xl shadow-gray-200"
                                        : "bg-white text-gray-500 hover:bg-white hover:shadow-md border border-gray-100"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto px-8 pb-8 mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredItems.map(item => (
                            <div
                                key={item.id}
                                onClick={() => addToCart(item)}
                                className="bg-white rounded-[32px] overflow-hidden border border-gray-50 group hover:shadow-2xl hover:shadow-gray-200 transition-all duration-300 cursor-pointer"
                            >
                                <div className="aspect-[4/3] overflow-hidden relative bg-gray-50">
                                    {item.image ? (
                                        <img
                                            src={item.image}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            alt={item.name}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-black text-gray-200 uppercase">
                                            {item.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-xl text-[10px] font-black text-gray-500 uppercase">
                                        {item.stock} in stock
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-extrabold text-[#111827] mb-1 group-hover:text-brand-600 transition-colors truncate">{item.name}</h3>
                                    <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest mb-4">{item.category.name}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="font-black text-lg text-[#111827]">{formatNaira(item.price)}</span>
                                        <div className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all transform group-active:scale-95">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sidebar Right */}
            <div className="w-[420px] bg-white border-l border-gray-100 flex flex-col shrink-0">
                <div className="p-8 border-b border-gray-50 shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="font-black text-xl text-gray-900 tracking-tight">Current Order</h2>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    fetchPendingOrders();
                                    setIsPendingOrdersOpen(true);
                                }}
                                className="h-8 rounded-lg border-gray-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-brand-600"
                            >
                                <Clock className="w-3 h-3" />
                                Held ({pendingOrders.length})
                            </Button>
                            <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1.5 rounded-lg tracking-wider uppercase">
                                {cart.length} Items
                            </span>
                        </div>
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4 bg-[#FDFDFD]">
                    <div className="space-y-3">
                        {cart.map(item => (
                            <div key={item.id} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm group">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-extrabold text-[15px] text-gray-900 truncate">{item.name}</p>
                                        <p className="text-xs font-black text-brand-600 mt-1">{formatNaira(item.price)}</p>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 hover:text-gray-900 shadow-sm"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 hover:text-gray-900 shadow-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <span className="font-black text-gray-900">{formatNaira(item.price * item.quantity)}</span>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-300 gap-4">
                                <Utensils className="w-12 h-12" />
                                <p className="font-black text-sm uppercase tracking-widest text-center">Cart is empty<br /><span className="text-[10px] text-gray-400 opacity-60">Add items to start</span></p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary & Actions */}
                <div className="p-8 space-y-6 shrink-0 border-t border-gray-50 bg-white">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-gray-400 font-bold text-sm">
                            <span>Subtotal</span>
                            <span>{formatNaira(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400 font-bold text-sm">
                            <span>Tax</span>
                            <span>{formatNaira(tax)}</span>
                        </div>
                        <div className="pt-4 mt-2 border-t border-dashed border-gray-100 flex justify-between items-end">
                            <span className="text-lg font-black text-gray-900 uppercase tracking-tight">Total</span>
                            <span className="text-4xl font-black text-gray-900 tracking-tighter leading-none">{formatNaira(total)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handleSaveOrder("PENDING")}
                            disabled={cart.length === 0 || isProcessing}
                            className="col-span-2 h-16 rounded-[24px] border-2 border-gray-100 font-black text-gray-600 hover:bg-gray-50 transition-all flex flex-col items-center justify-center gap-1"
                        >
                            <Save className="w-5 h-5" />
                            <span className="text-[10px] uppercase">Hold Order</span>
                        </Button>
                        <Button
                            onClick={() => setIsCheckoutOpen(true)}
                            disabled={cart.length === 0 || isProcessing}
                            className="col-span-3 h-16 rounded-[24px] bg-brand-500 hover:bg-brand-600 text-white font-black text-xl shadow-xl shadow-brand-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-3 border-none"
                        >
                            <CreditCard className="w-6 h-6" />
                            Charge
                        </Button>
                    </div>
                </div>
            </div>

            {/* Checkout Modal */}
            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden bg-white rounded-[40px] border-none shadow-2xl">
                    <DialogHeader className="p-8 border-b border-gray-50 bg-gray-50/30">
                        <DialogTitle className="text-xl font-black text-gray-900 tracking-tight uppercase">Payment Details</DialogTitle>
                    </DialogHeader>

                    <div className="p-8 space-y-8">
                        {/* Payment Selection */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Payment Method</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: "CASH", icon: Utensils, label: "Cash" },
                                    { id: "CARD", icon: CreditCard, label: "Card" },
                                    { id: "TRANSFER", icon: ArrowRightLeft, label: "Transfer" }
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setPaymentType(type.id as any)}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-3 p-4 rounded-3xl border-2 transition-all",
                                            paymentType === type.id
                                                ? "border-brand-500 bg-brand-50 text-brand-600 shadow-inner"
                                                : "border-gray-50 hover:border-gray-200 text-gray-400"
                                        )}
                                    >
                                        <type.icon className="w-6 h-6" />
                                        <span className="text-[10px] font-black uppercase">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    {paymentType === "CASH" ? "Amount Tendered" : "Total to Charge"}
                                </label>
                                <span className="font-black text-xs text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
                                    Due: {formatNaira(total)}
                                </span>
                            </div>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300">₦</span>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={amountTendered}
                                    onChange={(e) => setAmountTendered(e.target.value)}
                                    className="h-20 pl-14 pr-8 rounded-3xl bg-gray-50 border-none font-black text-4xl text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand-100 transition-all"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Change Calculator */}
                        {paymentType === "CASH" && amountTendered && (
                            <div className="bg-gray-50 p-6 rounded-3xl flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Change Due</p>
                                    <p className={cn("text-3xl font-black", changeDue > 0 ? "text-green-600" : "text-gray-300")}>
                                        {formatNaira(changeDue)}
                                    </p>
                                </div>
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", changeDue > 0 ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400")}>
                                    <ArrowLeft className="w-8 h-8 rotate-180" />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="p-8 bg-gray-50/50 border-t border-gray-100 gap-4 sm:justify-center">
                        <Button
                            variant="ghost"
                            onClick={() => setIsCheckoutOpen(false)}
                            className="h-14 px-8 rounded-2xl font-bold text-gray-400"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => handleSaveOrder("COMPLETED")}
                            disabled={isProcessing || (paymentType === "CASH" && (!amountTendered || changeDue < 0))}
                            className="h-14 px-12 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-black text-lg shadow-xl shadow-brand-500/20 transition-all min-w-[200px]"
                        >
                            {isProcessing ? "Processing..." : `Complete ${formatNaira(total)}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Receipt Modal (Thermal Style) */}
            <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
                <DialogContent className="max-w-[400px] p-0 overflow-hidden bg-white rounded-[40px] border-none">
                    <div className="p-10 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-6">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Sale Complete</h2>
                        <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-10">Order {lastOrder?.orderNumber}</p>

                        {/* Receipt Preview (Thermal) */}
                        <div
                            id="thermal-receipt"
                            className="w-full bg-[#fdfdfd] border-2 border-dashed border-gray-100 p-8 rounded-2xl font-mono text-[12px] text-gray-600 leading-relaxed"
                        >
                            <div className="text-center mb-6">
                                <h3 className="font-black text-gray-900 text-lg uppercase mb-1">Eres Place</h3>
                                <p>111, Irhirhi Road By Ashland Hotel Junction Off Airport road, Benin city</p>
                                <p>Tel: 09060958968</p>
                            </div>

                            <div className="border-t border-dashed border-gray-200 my-4" />

                            <div className="flex justify-between font-bold mb-1">
                                <span>DATE:</span>
                                <span>{new Date(lastOrder?.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold mb-1">
                                <span>ORDER:</span>
                                <span className="uppercase">{lastOrder?.orderNumber}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                                <span>CASHIER:</span>
                                <span className="uppercase">{lastOrder?.user?.name || session?.user?.name}</span>
                            </div>

                            <div className="border-t border-dashed border-gray-200 my-4" />

                            <div className="space-y-2">
                                {lastOrder?.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-start italic">
                                        <div className="flex-1">
                                            <span>{item.name}</span><br />
                                            <span className="text-[10px]">{item.quantity} x {formatNumber(item.price)}</span>
                                        </div>
                                        <span className="font-bold text-gray-900">{formatNumber(item.subtotal)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-dashed border-gray-200 my-4" />

                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span>SUBTOTAL:</span>
                                    <span>{formatNumber(lastOrder?.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>TAX:</span>
                                    <span>{formatNumber(lastOrder?.tax)}</span>
                                </div>
                                <div className="flex justify-between text-gray-900 font-black text-sm mt-2">
                                    <span>TOTAL:</span>
                                    <span>{formatNaira(lastOrder?.total)}</span>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-gray-200 my-4" />

                            <div className="space-y-1 uppercase font-bold text-[11px]">
                                <div className="flex justify-between">
                                    <span>PAYMENT TYPE:</span>
                                    <span>{lastOrder?.paymentType}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>TENDERED:</span>
                                    <span>{formatNumber(lastOrder?.amountTendered)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>CHANGE:</span>
                                    <span>{formatNumber(lastOrder?.changeAmount)}</span>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-gray-200 my-8" />

                            <div className="text-center font-black">
                                <p>THANK YOU FOR YOUR PATRONAGE!</p>
                                <p className="text-[10px] mt-2 opacity-50">Powered by Ktcstocks POS + Inventory</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full mt-10">
                            <Button
                                variant="outline"
                                onClick={() => setIsReceiptOpen(false)}
                                className="h-14 rounded-2xl font-bold border-gray-100"
                            >
                                Close
                            </Button>
                            <Button
                                onClick={printReceipt}
                                className="h-14 rounded-2xl bg-gray-900 text-white font-black flex items-center justify-center gap-2"
                            >
                                <Printer className="w-4 h-4" />
                                Print Receipt
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Hold Order Naming Modal */}
            <Dialog open={isHoldModalOpen} onOpenChange={setIsHoldModalOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden bg-white rounded-[40px] border-none shadow-2xl">
                    <DialogHeader className="p-8 border-b border-gray-50 bg-gray-50/30">
                        <DialogTitle className="text-xl font-black text-gray-900 tracking-tight uppercase">Name this Order</DialogTitle>
                    </DialogHeader>
                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer Name or Order Reference</label>
                            <Input
                                type="text"
                                placeholder="e.g., Table 4, John Doe, Takeout..."
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="h-16 px-6 rounded-2xl bg-gray-50 border-none font-bold text-xl text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand-100 transition-all"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-8 bg-gray-50/50 border-t border-gray-100 gap-4 sm:justify-center">
                        <Button
                            variant="ghost"
                            onClick={() => setIsHoldModalOpen(false)}
                            className="h-14 px-8 rounded-2xl font-bold text-gray-400"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => handleSaveOrder("PENDING")}
                            disabled={isProcessing || !customerName}
                            className="h-14 px-12 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-black text-lg shadow-xl shadow-brand-500/20 transition-all min-w-[200px]"
                        >
                            {isProcessing ? "Saving..." : "Hold Order"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Pending Orders List Modal */}
            <Dialog open={isPendingOrdersOpen} onOpenChange={setIsPendingOrdersOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white rounded-[40px] border-none shadow-2xl">
                    <DialogHeader className="p-8 border-b border-gray-50 bg-gray-50/30">
                        <DialogTitle className="text-xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-3">
                            <Clock className="w-6 h-6 text-brand-500" />
                            Held Orders
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-8 max-h-[60vh] overflow-y-auto">
                        <div className="grid gap-4">
                            {pendingOrders.map(order => (
                                <div key={order.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between group hover:border-brand-200 transition-all">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-black text-[17px] text-gray-900 truncate">
                                                {order.customerName || "Unnamed Order"}
                                            </h3>
                                            <span className="text-[10px] bg-brand-50 text-brand-600 px-2.5 py-1 rounded-lg font-black uppercase tracking-wider">
                                                {order.orderNumber}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-gray-400">
                                            {order.items.length} Items • {formatNaira(order.total)} • {new Date(order.createdAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDeleteOrder(order.id)}
                                            className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <Button
                                            onClick={() => resumeOrder(order)}
                                            className="h-12 px-6 rounded-2xl bg-gray-900 hover:bg-brand-600 text-white font-bold"
                                        >
                                            Resume
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {pendingOrders.length === 0 && (
                                <div className="h-48 flex flex-col items-center justify-center text-gray-300 gap-4">
                                    <Clock className="w-12 h-12" />
                                    <p className="font-black text-sm uppercase tracking-widest text-center">No held orders<br /><span className="text-[10px] text-gray-400 opacity-60">Wait for orders to be held</span></p>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="p-8 bg-gray-50/50 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            onClick={() => setIsPendingOrdersOpen(false)}
                            className="h-14 w-full rounded-2xl font-bold text-gray-400"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
