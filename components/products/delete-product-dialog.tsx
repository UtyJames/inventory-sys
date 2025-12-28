"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteProduct } from "@/app/lib/actions/product.actions";
import { toast } from "sonner";

interface DeleteProductDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product: any;
}

export function DeleteProductDialog({ isOpen, onClose, onSuccess, product }: DeleteProductDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!product) return;
        setLoading(true);
        try {
            const result = await deleteProduct(product.id);
            if (result.success) {
                toast.success("Product deleted successfully");
                onSuccess();
                onClose();
            } else {
                toast.error(result.error || "Failed to delete product");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="rounded-[32px] p-8 border-none shadow-2xl">
                <AlertDialogHeader>
                    <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
                        <Trash2 className="w-8 h-8 text-red-500" />
                    </div>
                    <AlertDialogTitle className="text-2xl font-black text-gray-900">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-500 font-medium text-base">
                        This action cannot be undone. This will permanently delete <b>{product?.name}</b> and remove it from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-8 gap-4">
                    <AlertDialogCancel className="h-14 px-8 rounded-2xl font-bold border-gray-100 hover:bg-gray-50 text-gray-500">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={loading}
                        className="h-14 px-8 rounded-2xl font-black bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-200 border-none"
                    >
                        {loading ? "Deleting..." : "Yes, Delete Product"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
