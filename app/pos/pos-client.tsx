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
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { formatNaira, formatNumber } from "@/lib/utils/format";
import { createOrder, getPendingOrders, deleteOrder, finalizeOrder, createAndFinalizeOrder } from "@/app/lib/actions/order.actions";
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
    trackInventory?: boolean;
    isFoodItem?: boolean;
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
    const [paymentType, setPaymentType] = useState<"CASH" | "CARD" | "TRANSFER" | "OTHER">("CASH");
    const [amountTendered, setAmountTendered] = useState<string>("");
    const [payments, setPayments] = useState<{ method: "CASH" | "CARD" | "TRANSFER" | "OTHER"; amount: number; reference?: string }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Order info
    const [tableNumber, setTableNumber] = useState("");

    // Receipt States
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [lastOrder, setLastOrder] = useState<any>(null);

    // Held Orders States
    const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [isPendingOrdersOpen, setIsPendingOrdersOpen] = useState(false);
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [selectedNote, setSelectedNote] = useState<string | null>(null);

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

    // Poll for held orders every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchPendingOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    // Offline & Sync State
    const [isOnline, setIsOnline] = useState(true);
    const [pointsQueue, setPointsQueue] = useState<any[]>([]);

    useEffect(() => {
        // Initial check
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            toast.success("Back online!");
            syncOfflineOrders();
        };
        const handleOffline = () => {
            setIsOnline(false);
            toast.warning("You are offline. Orders will be saved locally.");
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Load queue
        const savedQueue = localStorage.getItem("pos_queue");
        if (savedQueue) {
            try {
                setPointsQueue(JSON.parse(savedQueue));
            } catch (e) { console.error("Failed to parse queue", e); }
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const syncOfflineOrders = async () => {
        const queueRaw = localStorage.getItem("pos_queue");
        if (!queueRaw) return;

        let queue: any[] = [];
        try {
            queue = JSON.parse(queueRaw);
        } catch { return; }

        if (queue.length === 0) return;

        toast.loading(`Syncing ${queue.length} offline orders...`);

        let syncedCount = 0;
        let failedCount = 0;
        const newQueue: any[] = [];

        for (const orderRequest of queue) {
            try {
                // Determine if we need to call createOrder or finalizeOrder or both.
                // For simplicity, we queue the *entire payload* needed to recreate the transaction.
                // But `handleSaveOrder` logic is complex.
                // Better strategy: Queue the `cart`, `payment` details, etc. and re-run the logic? No, too brittle.
                // Best strategy: Queue the `createOrder` data.

                // If the order was just "Held" (PENDING), we just create it.
                // If it was "Completed", we create AND finalize.

                // Let's assume queue items have: { type: 'CREATE_AND_FINALIZE', data: ..., payments: ... }

                if (orderRequest.type === 'FULL_ORDER') {
                    if (orderRequest.finalStatus === 'COMPLETED') {
                        // Atomic sync
                        const result = await createAndFinalizeOrder({
                            orderData: orderRequest.data,
                            payments: orderRequest.payments
                        });
                        if (!result.success) throw new Error(result.error);
                    } else {
                        // Just Pending
                        const result = await createOrder(orderRequest.data);
                        if (!result.success) throw new Error(result.error);
                    }
                    syncedCount++;
                }
            } catch (error) {
                console.error("Sync failed for order", error);
                failedCount++;
                newQueue.push(orderRequest); // Keep in queue
            }
        }

        setPointsQueue(newQueue);
        localStorage.setItem("pos_queue", JSON.stringify(newQueue));

        if (syncedCount > 0) toast.success(`Synced ${syncedCount} orders`);
        if (failedCount > 0) toast.error(`Failed to sync ${failedCount} orders`);
    };



    const categories = ["All Items", ...initialCategories.map(c => c.name)];

    const filteredItems = useMemo(() => {
        return products.filter(item => {
            const matchesCategory = selectedCategory === "All Items" || item.category.name === selectedCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            // Show food items (trackInventory=false) or items with stock > 0
            const isAvailable = !item.trackInventory || item.stock > 0;
            return matchesCategory && matchesSearch && isAvailable;
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
                // Check stock limit only for items that track inventory
                const product = products.find(p => p.id === i.productId);
                if (product && product.trackInventory && newQty > product.stock) {
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

        // If holding order, ensure name or table is provided
        if (status === "PENDING" && !customerName && !tableNumber) {
            setIsHoldModalOpen(true);
            return;
        }

        setIsProcessing(true);

        // Prepare Order Data
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
            tableNumber: tableNumber || undefined,
            customerName: customerName || undefined,
            notes: undefined
        };

        // Prepare Payments (if completing)
        let finalPayments: any[] = [];
        if (status === "COMPLETED") {
            finalPayments = payments;
            if (finalPayments.length === 0) {
                const tendered = parseFloat(amountTendered || total.toString());
                finalPayments = [{ method: paymentType, amount: tendered }];
            }
        }

        const offlinePayload = {
            type: 'FULL_ORDER',
            data: orderData,
            payments: finalPayments,
            finalStatus: status,
            tempId: Date.now().toString(), // For keying if needed
            timestamp: new Date().toISOString()
        };

        const saveToQueue = () => {
            const newQueue = [...pointsQueue, offlinePayload];
            setPointsQueue(newQueue);
            localStorage.setItem("pos_queue", JSON.stringify(newQueue));

            // Simulate Success UI
            toast.warning("Offline: Order saved to queue");
            setCart([]);
            setAmountTendered("");
            setCustomerName("");
            setTableNumber("");
            setPayments([]);
            setIsCheckoutOpen(false);
            setIsHoldModalOpen(false);
            // Don't modify pendingOrders as we can't fetch real ID yet
        };

        // 1. Check Offline Mode explicitly
        if (!isOnline) {
            saveToQueue();
            setIsProcessing(false);
            return;
        }

        try {
            // 2. Try Online
            const result = await createOrder(orderData);

            if (!result.success) {
                throw new Error(result.error);
            }

            const order = result.order;

            // 3. If completing, finalize
            if (status === "COMPLETED") {
                const finalizeResult = await finalizeOrder(order.id, finalPayments);
                if (!finalizeResult.success) {
                    // If finalize fails but create worked... tricky. 
                    // Ideally we revert or queue the finalize part. 
                    // For simplicity, we error out and let user retry? 
                    // OR we queue properly.
                    throw new Error("Finalize failed: " + finalizeResult.error);
                }

                setLastOrder(finalizeResult.order);
                toast.success("Sale completed!");
                setIsReceiptOpen(true);

                // Auto-print receipt after a short delay
                setTimeout(() => {
                    printReceipt();
                }, 500);
            } else {
                toast.success("Order sent to kitchen!");
            }

            // Success Reset
            setCart([]);
            setAmountTendered("");
            setCustomerName("");
            setTableNumber("");
            setPayments([]);
            setIsCheckoutOpen(false);
            setIsHoldModalOpen(false);
            fetchPendingOrders();

        } catch (error: any) {
            console.error("Order Error:", error);
            // Check for network errors to fallback to queue
            const isNetworkError = error.message?.includes("Transaction") ||
                error.message?.includes("timeout") ||
                error.message?.includes("fetch");

            if (isNetworkError) {
                toast.error("Network failed. Saving offline.");
                saveToQueue();
            } else {
                toast.error(error.message || "Something went wrong");
            }
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
        if (!printContent || !lastOrder) return;

        const printWindow = window.open("", "", "width=400,height=600");
        if (!printWindow) return;

        printWindow.document.write('<!DOCTYPE html><html><head>');
        printWindow.document.write('<meta charset="utf-8">');
        printWindow.document.write(`<title>Receipt ${lastOrder.orderNumber}</title>`);
        printWindow.document.write('<style>');
        printWindow.document.write(`
            @media print {
                body { margin: 0; padding: 10px; width: 80mm; font-family: 'Courier New', Courier, monospace; font-size: 12px; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .dashed { border-top: 1px dashed #000; margin: 10px 0; }
                .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 5px; }
                .header { margin-bottom: 15px; text-align: center; }
                .footer { margin-top: 20px; text-align: center; font-weight: bold; }
                .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
                .bold { font-weight: bold; }
                .uppercase { text-transform: uppercase; }
                .italic { font-style: italic; }
            }
        `);
        printWindow.document.write('</style></head><body>');

        // We build the HTML manually to ensure it's not affected by Tailwind removal in print
        let html = `
            <div class="header">
                <h3 style="font-size: 18px; font-weight: bold; margin: 0 0 5px 0;">Eres Place</h3>
                <p style="margin: 2px 0; font-size: 11px;">111, Irhirhi Road By Ashland Hotel Junction</p>
                <p style="margin: 2px 0; font-size: 11px;">Off Airport road, Benin city</p>
                <p style="margin: 2px 0; font-size: 11px;">Tel: 09060958968</p>
            </div>
            <div class="dashed"></div>
            <div style="margin-bottom: 10px;">
                <div class="row"><span>DATE:</span><span>${new Date(lastOrder.createdAt).toLocaleString()}</span></div>
                <div class="row"><span>ORDER:</span><span class="uppercase">${lastOrder.orderNumber}</span></div>
                <div class="row"><span>CASHIER:</span><span class="uppercase">${lastOrder.user?.name || session?.user?.name || "System"}</span></div>
            </div>
            <div class="dashed"></div>
            <div style="margin-bottom: 10px;">
        `;

        lastOrder.items.forEach((item: any) => {
            html += `
                <div class="item-row italic">
                    <div style="flex: 1;">
                        <div>${item.name}</div>
                        <div style="font-size: 10px;">${item.quantity} x ${formatNumber(item.price)}</div>
                    </div>
                    <span class="bold">${formatNumber(item.subtotal)}</span>
                </div>
            `;
        });

        html += `
            </div>
            <div class="dashed"></div>
            <div style="margin-bottom: 10px;">
                <div class="row"><span>SUBTOTAL:</span><span>${formatNumber(lastOrder.subtotal)}</span></div>
                <div class="row"><span>TAX:</span><span>${formatNumber(lastOrder.tax)}</span></div>
                <div class="total-row"><span>TOTAL:</span><span>${formatNaira(lastOrder.total)}</span></div>
            </div>
            <div class="dashed"></div>
            <div style="margin-bottom: 10px; font-weight: bold; text-transform: uppercase;">
                <div class="row"><span>PAYMENT TYPE:</span><span>${lastOrder.paymentType}</span></div>
                <div class="row"><span>TENDERED:</span><span>${formatNumber(lastOrder.amountTendered)}</span></div>
                <div class="row"><span>CHANGE:</span><span>${formatNumber(lastOrder.changeAmount)}</span></div>
            </div>
            <div class="dashed"></div>
            <div class="footer">
                <p>THANK YOU FOR YOUR PATRONAGE!</p>
                <p style="font-size: 10px; opacity: 0.5;">Powered by Ktcstocks POS + Inventory</p>
            </div>
        `;

        printWindow.document.write(html);
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
                                    {isOnline ? (
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center gap-1 text-green-500">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                Online
                                            </span>
                                            {pointsQueue.length > 0 && (
                                                <button
                                                    onClick={syncOfflineOrders}
                                                    className="flex items-center gap-1 text-amber-500 hover:text-amber-600 transition-colors animate-pulse"
                                                >
                                                    • {pointsQueue.length} Pending Sync
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="flex items-center gap-1 text-red-500">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            Offline {pointsQueue.length > 0 && `(${pointsQueue.length} queued)`}
                                        </span>
                                    )}
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

                    <div className="p-8 space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-3xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Due</p>
                                <p className="text-2xl font-black text-gray-900">{formatNaira(total)}</p>
                            </div>
                            <div className={cn("p-4 rounded-3xl",
                                Math.max(0, total - payments.reduce((acc, p) => acc + p.amount, 0)) === 0
                                    ? "bg-green-50 text-green-600"
                                    : "bg-red-50 text-red-500"
                            )}>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Remaining</p>
                                <p className="text-2xl font-black">
                                    {formatNaira(Math.max(0, total - payments.reduce((acc, p) => acc + p.amount, 0)))}
                                </p>
                            </div>
                        </div>

                        {/* Payment Entry */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: "CASH", icon: Utensils, label: "Cash" },
                                    { id: "CARD", icon: CreditCard, label: "Card" },
                                    { id: "TRANSFER", icon: ArrowRightLeft, label: "Transfer" },
                                    { id: "OTHER", icon: Info, label: "Other" }
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setPaymentType(type.id as any)}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all",
                                            paymentType === type.id
                                                ? "border-brand-500 bg-brand-50 text-brand-600 shadow-inner"
                                                : "border-gray-50 hover:border-gray-200 text-gray-400"
                                        )}
                                    >
                                        <type.icon className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase">{type.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-gray-300">₦</span>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={amountTendered}
                                        onChange={(e) => setAmountTendered(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && amountTendered) {
                                                const amount = parseFloat(amountTendered);
                                                if (amount > 0) {
                                                    setPayments([...payments, { method: paymentType, amount }]);
                                                    setAmountTendered("");
                                                }
                                            }
                                        }}
                                        className="h-14 pl-10 rounded-2xl bg-gray-50 border-none font-black text-2xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all"
                                        autoFocus
                                    />
                                </div>
                                <Button
                                    onClick={() => {
                                        const amount = parseFloat(amountTendered);
                                        if (amount > 0) {
                                            setPayments([...payments, { method: paymentType, amount }]);
                                            setAmountTendered("");
                                        }
                                    }}
                                    disabled={!amountTendered || parseFloat(amountTendered) <= 0}
                                    className="h-14 w-14 rounded-2xl bg-gray-900 hover:bg-black text-white p-0 flex items-center justify-center"
                                >
                                    <Plus className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>

                        {/* Added Payments List */}
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {payments.map((payment, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white border border-gray-100 p-3 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                                            {payment.method === "CASH" && <Utensils className="w-4 h-4" />}
                                            {payment.method === "CARD" && <CreditCard className="w-4 h-4" />}
                                            {payment.method === "TRANSFER" && <ArrowRightLeft className="w-4 h-4" />}
                                            {payment.method === "OTHER" && <Info className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{formatNaira(payment.amount)}</p>
                                            <p className="text-[10px] font-black uppercase text-gray-400">{payment.method}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setPayments(payments.filter((_, i) => i !== idx))}
                                        className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {payments.length === 0 && (
                                <div className="text-center py-6 text-gray-300 text-xs font-bold uppercase tracking-widest">
                                    No payments added
                                </div>
                            )}
                        </div>

                        {/* Change Display (Only if Total Paid > Total Due) */}
                        {payments.reduce((acc, p) => acc + p.amount, 0) > total && (
                            <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Change Due</p>
                                <p className="text-xl font-black text-green-600">
                                    {formatNaira(payments.reduce((acc, p) => acc + p.amount, 0) - total)}
                                </p>
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
                            disabled={isProcessing || payments.reduce((acc, p) => acc + p.amount, 0) < total}
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
                    <DialogTitle className="sr-only">Sale Receipt</DialogTitle>
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
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Table Number (Optional)</label>
                            <Input
                                type="text"
                                placeholder="e.g. 5"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="h-16 px-6 rounded-2xl bg-gray-50 border-none font-bold text-xl text-gray-900 focus:bg-white focus:ring-4 focus:ring-brand-100 transition-all"
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer Name / Reference</label>
                            <Input
                                type="text"
                                placeholder="e.g., John Doe, Takeout..."
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
                            disabled={isProcessing || (!customerName && !tableNumber)}
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
                                        <p className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                            <span>{order.items.length} Items • {formatNaira(order.total)} • {new Date(order.createdAt).toLocaleTimeString()}</span>
                                            {order.user?.name ? (
                                                <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide">
                                                    Held by {order.user.name}
                                                </span>
                                            ) : (
                                                <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-black italic">
                                                    Visitor Order
                                                </span>
                                            )}
                                            {order.notes && (
                                                <button
                                                    onClick={() => setSelectedNote(order.notes)}
                                                    className="flex items-center gap-1 text-[10px] font-black text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg hover:bg-brand-100 transition-colors"
                                                >
                                                    📝 View Note
                                                </button>
                                            )}
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

            {/* Note View Modal */}
            <Dialog open={!!selectedNote} onOpenChange={(open) => !open && setSelectedNote(null)}>
                <DialogContent className="max-w-md p-0 overflow-hidden bg-white rounded-[40px] border-none shadow-2xl z-[100]">
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
