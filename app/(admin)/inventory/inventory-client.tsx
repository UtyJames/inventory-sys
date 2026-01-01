"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "../../../components/ui/dialog";

import { useState, useEffect } from "react";
import {
    Search,
    Plus,
    Grid,
    List,
    Filter,
    MoreVertical,
    ChevronRight,
    UtensilsCrossed,
    Package,
    ArrowUpRight,
    LayoutGrid,
    Search as SearchIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AddProductForm } from "@/components/products/add-product-form";
import { AddCategoryModal } from "@/components/products/add-category-modal";
import { StockUpdateModal } from "@/components/products/stock-update-modal";
import { useRouter, useSearchParams } from "next/navigation";
import { StockDataCenter } from "@/components/inventory/stock-data-center";
import { formatNaira, formatNumber } from "@/lib/utils/format";
import { EditProductModal } from "@/components/products/edit-product-modal";
import { ViewProductModal } from "@/components/products/view-product-modal";
import { DeleteProductDialog } from "@/components/products/delete-product-dialog";
import { BulkUploadModal } from "@/components/products/bulk-upload-modal";
import { FileSpreadsheet } from "lucide-react";

interface InventoryClientProps {
    initialProducts: any[];
    categories: any[];
    user: any;
    totalProducts: number;
    currentPage: number;
    pageSize: number;
}

export function InventoryClient({
    initialProducts,
    categories,
    user,
    totalProducts,
    currentPage,
    pageSize
}: InventoryClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [stockUpdateProduct, setStockUpdateProduct] = useState<any>(null);
    const [editProduct, setEditProduct] = useState<any>(null);
    const [viewProduct, setViewProduct] = useState<any>(null);
    const [deleteProductItem, setDeleteProductItem] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [activeMenuProduct, setActiveMenuProduct] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [activeView, setActiveView] = useState<"inventory" | "stock-center">("inventory");

    const activeCategory = searchParams.get("category") || null;

    const setCategory = (id: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (id) params.set("category", id);
        else params.delete("category");
        params.set("page", "1"); // Reset to page 1 on category change
        router.push(`/inventory?${params.toString()}`);
    };

    const setPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page.toString());
        router.push(`/inventory?${params.toString()}`);
    };

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (term) params.set("search", term);
        else params.delete("search");
        params.set("page", "1"); // Reset to page 1 on search change
        router.push(`/inventory?${params.toString()}`);
    };

    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== (searchParams.get("search") || "")) {
                handleSearch(searchTerm);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    return (
        <div className="flex h-full">
            {/* Sidebar for Categories */}
            <aside className="w-64 bg-white border-r border-gray-100 flex flex-col pt-6 shrink-0">
                <div className="px-6 mb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Menu Categories</p>
                    <div className="space-y-1">
                        <button
                            onClick={() => {
                                setCategory(null);
                                setActiveView("inventory");
                            }}
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group",
                                activeCategory === null && activeView === "inventory"
                                    ? "bg-brand-50 text-brand-600 shadow-sm"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <LayoutGrid className={cn("w-4 h-4", activeCategory === null && activeView === "inventory" ? "text-brand-600" : "text-gray-400 group-hover:text-gray-600")} />
                                <span className="text-sm font-bold">All Items</span>
                            </div>
                            <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full ring-2 ring-white", activeCategory === null ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-400")}>
                                {initialProducts.length}
                            </span>
                        </button>

                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setCategory(cat.id)}
                                className={cn(
                                    "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group",
                                    activeCategory === cat.id
                                        ? "bg-brand-50 text-brand-600 shadow-sm"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <UtensilsCrossed className={cn("w-4 h-4", activeCategory === cat.id ? "text-brand-600" : "text-gray-400 group-hover:text-gray-600")} />
                                    <span className="text-sm font-bold">{cat.name}</span>
                                </div>
                                <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full ring-2 ring-white", activeCategory === cat.id ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-400")}>
                                    {cat._count.products}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-6 pt-4 border-t border-gray-50 mt-auto pb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Management</p>
                    <div className="space-y-1">
                        <button
                            onClick={() => setActiveView("stock-center")}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm",
                                activeView === "stock-center" ? "bg-brand-50 text-brand-600 shadow-sm" : "text-gray-500 hover:bg-gray-50"
                            )}
                        >
                            <Package className={cn("w-4 h-4", activeView === "stock-center" ? "text-brand-600" : "text-gray-400")} />
                            Stock Levels
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-500 hover:bg-gray-50 transition-all font-bold text-sm">
                            <Filter className="w-4 h-4 text-gray-400" />
                            Tax Groups
                        </button>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="w-full mt-6 h-12 rounded-2xl border-dashed border-2 border-gray-200 text-gray-400 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50 font-bold"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Top Toolbar */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-8">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                {activeCategory ? categories.find(c => c.id === activeCategory)?.name : "All Inventory"}
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-brand-600 font-bold uppercase tracking-wider">Product Management</span>
                                <span className="text-gray-300">/</span>
                                <span className="text-xs text-gray-500 font-medium">Ktcstocks</span>
                            </div>
                        </div>

                        <div className="relative">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search menu items, SKUs..."
                                className="h-12 w-96 pl-11 bg-gray-50 border-none rounded-2xl text-[14px] font-medium transition-all focus:ring-2 focus:ring-brand-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center p-1 bg-gray-100 rounded-xl mr-4">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={cn("p-2 rounded-lg transition-all", viewMode === "grid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600")}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={cn("p-2 rounded-lg transition-all", viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600")}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                        <Button
                            variant="outline"
                            className="border-gray-200 text-gray-400 hover:text-brand-600 hover:border-brand-200 h-12 px-6 rounded-2xl font-bold"
                            onClick={() => setIsBulkModalOpen(true)}
                        >
                            <FileSpreadsheet className="w-5 h-5 mr-2" />
                            Import
                        </Button>
                        <Button
                            className="bg-brand-500 hover:bg-brand-600 text-white font-black h-12 px-6 rounded-2xl shadow-lg shadow-brand-500/20"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add New Item
                        </Button>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    {activeView === "stock-center" ? (
                        <StockDataCenter
                            products={initialProducts}
                            onUpdateStock={(p) => setStockUpdateProduct(p)}
                        />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {initialProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => setViewProduct(product)}
                                        className="bg-white rounded-[32px] p-6 border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group animate-in zoom-in-95 duration-300 cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div
                                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg"
                                                style={{ backgroundColor: product.displayColor || "#3b82f6" }}
                                            >
                                                {product.name.charAt(0)}
                                            </div>
                                            <div className={cn(
                                                "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                                product.stock > (product.lowStockAlert || 0) ? "bg-green-50 text-green-600" :
                                                    product.stock > 0 ? "bg-orange-50 text-orange-600" : "bg-red-50 text-red-600"
                                            )}>
                                                {product.stock > (product.lowStockAlert || 0) ? "In Stock" :
                                                    product.stock > 0 ? "Low Stock" : "Sold Out"}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-extrabold text-[#111827] text-lg leading-tight group-hover:text-brand-600 transition-colors truncate pr-4">{product.name}</h3>
                                                <span className="font-black text-brand-600">{formatNaira(product.price)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest">{product.category.name}</p>
                                                <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                                    {formatNumber(product.stock)} {product.stockUnit || 'units'}
                                                </span>
                                            </div>

                                            <div className="mt-6 flex items-center justify-between pt-6 border-t border-gray-50">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Availability</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className={cn("w-1.5 h-1.5 rounded-full", product.status ? "bg-green-500" : "bg-gray-300")} />
                                                        <span className="text-xs font-black text-gray-900">{product.status ? "Active" : "Inactive"}</span>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuProduct(activeMenuProduct === product.id ? null : product.id);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 rounded-xl"
                                                    >
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>

                                                    {activeMenuProduct === product.id && (
                                                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setStockUpdateProduct(product);
                                                                    setActiveMenuProduct(null);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                                                            >
                                                                <Package className="w-4 h-4" />
                                                                Update Stock
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setViewProduct(product);
                                                                    setActiveMenuProduct(null);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                                                            >
                                                                <Search className="w-4 h-4" />
                                                                View Details
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditProduct(product);
                                                                    setActiveMenuProduct(null);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-brand-600 hover:bg-brand-50 transition-colors"
                                                            >
                                                                <ArrowUpRight className="w-4 h-4" />
                                                                Edit Item
                                                            </button>
                                                            <div className="h-px bg-gray-50 my-1 mx-4" />
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteProductItem(product);
                                                                    setActiveMenuProduct(null);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                                                            >
                                                                <Plus className="w-4 h-4 rotate-45" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Pagination Controls */}
                            {totalProducts > pageSize && (
                                <div className="mt-12 flex items-center justify-between bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Showing</span>
                                        <p className="text-sm font-black text-gray-900">
                                            {Math.min((currentPage - 1) * pageSize + 1, totalProducts)} - {Math.min(currentPage * pageSize, totalProducts)}
                                            <span className="text-gray-400 font-bold mx-1">of</span>
                                            {totalProducts} Items
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setPage(currentPage - 1)}
                                            disabled={currentPage <= 1}
                                            className="h-12 w-12 rounded-2xl border-gray-100 text-gray-400 hover:text-brand-600 hover:border-brand-200 disabled:opacity-30"
                                        >
                                            <ChevronRight className="w-5 h-5 rotate-180" />
                                        </Button>

                                        <div className="flex items-center gap-1 mx-2">
                                            {Array.from({ length: Math.ceil(totalProducts / pageSize) }).map((_, i) => {
                                                const pageNumber = i + 1;
                                                const totalPages = Math.ceil(totalProducts / pageSize);
                                                // Show 5 pages max around current page
                                                if (
                                                    pageNumber === 1 ||
                                                    pageNumber === totalPages ||
                                                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <button
                                                            key={pageNumber}
                                                            onClick={() => setPage(pageNumber)}
                                                            className={cn(
                                                                "w-10 h-10 rounded-xl font-black text-sm transition-all",
                                                                currentPage === pageNumber
                                                                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20 scale-110"
                                                                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                                                            )}
                                                        >
                                                            {pageNumber}
                                                        </button>
                                                    );
                                                }
                                                if (
                                                    (pageNumber === 2 && currentPage > 3) ||
                                                    (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                                                ) {
                                                    return <span key={pageNumber} className="text-gray-300 font-bold px-1">...</span>;
                                                }
                                                return null;
                                            })}
                                        </div>

                                        <Button
                                            variant="outline"
                                            onClick={() => setPage(currentPage + 1)}
                                            disabled={currentPage >= Math.ceil(totalProducts / pageSize)}
                                            className="h-12 w-12 rounded-2xl border-gray-100 text-gray-400 hover:text-brand-600 hover:border-brand-200 disabled:opacity-30"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Add Product Modal Overlay */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-5xl p-0 overflow-hidden bg-white rounded-[40px] border-none shadow-2xl h-full max-h-[90vh]">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Add New Product</DialogTitle>
                        <DialogDescription>
                            Fill in the details to add a new product to your inventory.
                        </DialogDescription>
                    </DialogHeader>
                    <AddProductForm
                        categories={categories}
                        onSuccess={() => {
                            setIsAddModalOpen(false);
                            router.refresh();
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Add Category Modal Overlay */}
            <AddCategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSuccess={() => {
                    setIsCategoryModalOpen(false);
                    router.refresh();
                }}
            />

            {/* Stock Update Modal Overlay */}
            <StockUpdateModal
                isOpen={!!stockUpdateProduct}
                onClose={() => setStockUpdateProduct(null)}
                product={stockUpdateProduct}
                onSuccess={() => {
                    router.refresh();
                }}
            />

            {/* Edit Product Modal Overlay */}
            <EditProductModal
                isOpen={!!editProduct}
                onClose={() => setEditProduct(null)}
                onSuccess={() => {
                    router.refresh();
                }}
                product={editProduct}
                categories={categories}
            />

            {/* View Product Modal Overlay */}
            <ViewProductModal
                isOpen={!!viewProduct}
                onClose={() => setViewProduct(null)}
                onUpdateStock={(p) => setStockUpdateProduct(p)}
                product={viewProduct}
            />

            {/* Delete Product Dialog Overlay */}
            <DeleteProductDialog
                isOpen={!!deleteProductItem}
                onClose={() => setDeleteProductItem(null)}
                onSuccess={() => {
                    router.refresh();
                }}
                product={deleteProductItem}
            />

            {/* Bulk Upload Modal Overlay */}
            <BulkUploadModal
                isOpen={isBulkModalOpen}
                onClose={() => {
                    setIsBulkModalOpen(false);
                    router.refresh();
                }}
            />
        </div>
    );
}
