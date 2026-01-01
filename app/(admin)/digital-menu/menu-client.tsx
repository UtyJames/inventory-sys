"use client";

import { useState, useMemo } from "react";
import {
    Search,
    QrCode,
    MoreVertical,
    ExternalLink,
    Eye,
    EyeOff,
    Settings2,
    Utensils,
    Download,
    Printer,
    ChevronRight,
    LayoutGrid,
    List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toggleMenuVisibility, updateMenuDetails } from "@/app/lib/actions/menu.actions";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { MenuQRCode } from "@/components/admin/menu-qr-code";

interface MenuClientProps {
    initialProducts: any[];
    categories: any[];
}

export function MenuClient({ initialProducts, categories }: MenuClientProps) {
    const [products, setProducts] = useState(initialProducts);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "All" || p.categoryId === selectedCategory;
            return matchesSearch && matchesCategory;
        }).sort((a, b) => (a.menuOrder || 999) - (b.menuOrder || 999));
    }, [products, searchQuery, selectedCategory]);

    const stats = useMemo(() => {
        const onMenu = products.filter(p => p.showOnMenu).length;
        return {
            total: products.length,
            onMenu,
            offMenu: products.length - onMenu
        };
    }, [products]);

    const handleToggleVisibility = async (productId: string, currentShow: boolean) => {
        const res = await toggleMenuVisibility(productId, !currentShow);
        if (res.success) {
            setProducts(prev => prev.map(p =>
                p.id === productId ? { ...p, showOnMenu: !currentShow } : p
            ));
            toast.success(currentShow ? "Removed from menu" : "Added to menu");
        } else {
            toast.error(res.error || "Failed to update visibility");
        }
    };

    const handleUpdateDetails = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const menuCategory = formData.get("menuCategory") as string;
        const menuOrder = parseInt(formData.get("menuOrder") as string) || 999;

        const res = await updateMenuDetails(editingProduct.id, { menuCategory, menuOrder });
        if (res.success) {
            setProducts(prev => prev.map(p =>
                p.id === editingProduct.id ? { ...p, menuCategory, menuOrder } : p
            ));
            toast.success("Menu details updated");
            setIsEditModalOpen(false);
        } else {
            toast.error(res.error || "Failed to update details");
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-8 py-6 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-500 p-3 rounded-[20px] text-white shadow-lg shadow-brand-100">
                            <Utensils className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Digital Menu Management</h1>
                            <p className="text-sm font-bold text-gray-400 mt-0.5 uppercase tracking-widest">Public Ordering System</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="rounded-2xl border-gray-200 font-bold h-12 px-6 hover:bg-gray-50 flex items-center gap-2"
                            onClick={() => window.open("/menu", "_blank")}
                        >
                            <ExternalLink className="w-4 h-4" />
                            Preview Menu
                        </Button>
                        <Button
                            className="rounded-2xl bg-gray-900 text-white font-black h-12 px-8 shadow-xl shadow-gray-200 hover:bg-black transition-all transform active:scale-95 flex items-center gap-2"
                            onClick={() => setIsQRModalOpen(true)}
                        >
                            <QrCode className="w-5 h-5" />
                            Get QR Code
                        </Button>
                    </div>
                </div>

                {/* Stats & Filters */}
                <div className="mt-8 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Products</p>
                                <p className="text-xl font-black text-gray-900 leading-none">{stats.total}</p>
                            </div>
                            <div className="h-8 w-px bg-gray-100" />
                            <div className="text-center">
                                <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-1">On Menu</p>
                                <p className="text-xl font-black text-brand-600 leading-none">{stats.onMenu}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search products..."
                                className="pl-11 h-12 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-bold text-sm"
                                value={searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            className="h-12 px-6 rounded-2xl bg-gray-50 border-transparent font-bold text-sm focus:bg-white focus:border-brand-500 transition-all outline-none min-w-[180px]"
                            value={selectedCategory}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
                        >
                            <option value="All">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <div className="flex items-center bg-gray-100 p-1.5 rounded-2xl shrink-0">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={cn(
                                    "p-2 rounded-xl transition-all",
                                    viewMode === "grid" ? "bg-white shadow-sm text-brand-600" : "text-gray-400"
                                )}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={cn(
                                    "p-2 rounded-xl transition-all",
                                    viewMode === "list" ? "bg-white shadow-sm text-brand-600" : "text-gray-400"
                                )}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                className={cn(
                                    "group bg-white rounded-[32px] border transition-all duration-300 overflow-hidden relative",
                                    product.showOnMenu ? "border-brand-100 shadow-xl shadow-brand-50/50" : "border-gray-100 hover:shadow-xl hover:shadow-gray-100/50"
                                )}
                            >
                                <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center relative overflow-hidden">
                                    {product.image ? (
                                        <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                                    ) : (
                                        <Utensils className="w-12 h-12 text-gray-200" />
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm",
                                            product.showOnMenu ? "bg-brand-500 text-white" : "bg-gray-400 text-white"
                                        )}>
                                            {product.showOnMenu ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                            {product.showOnMenu ? "Visible" : "Hidden"}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingProduct(product);
                                            setIsEditModalOpen(true);
                                        }}
                                        className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-xl text-gray-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                    >
                                        <Settings2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="mb-4">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                            {product.menuCategory || product.category?.name || "No Menu Category"}
                                        </p>
                                        <h3 className="font-extrabold text-gray-900 group-hover:text-brand-600 transition-colors truncate">{product.name}</h3>
                                    </div>
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                        <span className="font-black text-brand-600">₦{Number(product.price).toLocaleString()}</span>
                                        <Button
                                            variant={product.showOnMenu ? "outline" : "default"}
                                            size="sm"
                                            onClick={() => handleToggleVisibility(product.id, product.showOnMenu)}
                                            className={cn(
                                                "rounded-xl h-9 px-4 font-bold text-xs transition-all",
                                                product.showOnMenu ? "border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200" : "bg-brand-500 text-white hover:bg-brand-600"
                                            )}
                                        >
                                            {product.showOnMenu ? "Remove" : "Add to Menu"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pricing</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(product => (
                                    <tr key={product.id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                                                    {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <Utensils className="w-6 h-6 text-gray-200" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors truncate">{product.name}</p>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{product.sku}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                {product.menuCategory || product.category?.name || "Default"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 font-black text-gray-900">₦{Number(product.price).toLocaleString()}</td>
                                        <td className="px-8 py-4 font-medium text-gray-400">{product.menuOrder || 999}</td>
                                        <td className="px-8 py-4">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                product.showOnMenu ? "bg-brand-50 text-brand-600" : "bg-gray-100 text-gray-400"
                                            )}>
                                                {product.showOnMenu ? "Active On Menu" : "Off Menu"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleVisibility(product.id, product.showOnMenu)}
                                                    className={cn(
                                                        "p-2 rounded-xl transition-all",
                                                        product.showOnMenu ? "text-red-400 hover:bg-red-50 hover:text-red-500" : "text-brand-400 hover:bg-brand-50 hover:text-brand-500"
                                                    )}
                                                >
                                                    {product.showOnMenu ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingProduct(product);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all"
                                                >
                                                    <Settings2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* QR Code Modal */}
            <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden bg-white rounded-[40px] border-none shadow-2xl">
                    <DialogHeader className="p-8 pb-0">
                        <DialogTitle className="text-xl font-black text-gray-900 tracking-tight text-center">Your Digital Menu</DialogTitle>
                    </DialogHeader>
                    <div className="p-8">
                        <MenuQRCode />
                        <div className="mt-8 flex items-center gap-3 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                            <Utensils className="w-5 h-5 text-yellow-600 shrink-0" />
                            <p className="text-xs font-bold text-yellow-700 leading-relaxed">
                                Place this QR code on tables. Customers can scan to view prices and place orders directly to your kitchen.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Menu Details Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden bg-white rounded-[40px] border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-gray-50/50">
                        <DialogTitle className="text-xl font-black text-gray-900 tracking-tight">Menu Configuration</DialogTitle>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">{editingProduct?.name}</p>
                    </DialogHeader>
                    <form onSubmit={handleUpdateDetails}>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Display Category</label>
                                <Input
                                    name="menuCategory"
                                    defaultValue={editingProduct?.menuCategory || editingProduct?.category?.name || ""}
                                    placeholder="e.g., Appetizers, Main Meals, Drinks"
                                    className="h-14 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-black text-gray-900"
                                />
                                <p className="text-[10px] font-bold text-gray-400 ml-1 italic">This is how it will be grouped on the visitor menu.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sort Order</label>
                                <Input
                                    name="menuOrder"
                                    type="number"
                                    defaultValue={editingProduct?.menuOrder || 999}
                                    placeholder="Lower numbers show first"
                                    className="h-14 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-black text-gray-900"
                                />
                                <p className="text-[10px] font-bold text-gray-400 ml-1 italic">Lower numbers (e.g., 1, 2, 3) appear at the top.</p>
                            </div>
                        </div>
                        <DialogFooter className="p-8 pt-0">
                            <div className="flex gap-3 w-full">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 rounded-2xl h-14 font-black border-gray-100"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 rounded-2xl h-14 bg-brand-500 hover:bg-brand-600 text-white font-black shadow-xl shadow-brand-500/20"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
