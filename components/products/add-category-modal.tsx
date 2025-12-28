"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createCategory } from "@/app/lib/actions/category.actions";

const categorySchema = z.object({
    name: z.string().min(1, "Category name is required"),
    description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "../ui/dialog";

export function AddCategoryModal({ isOpen, onClose, onSuccess }: AddCategoryModalProps) {
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
    });

    const onSubmit = async (data: CategoryFormValues) => {
        setLoading(true);
        try {
            const result = await createCategory(data);
            if (result.success) {
                toast.success("Category created successfully");
                reset();
                onSuccess();
            } else {
                toast.error(result.error || "Failed to create category");
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
                        <DialogTitle className="text-xl font-black text-gray-900 tracking-tight">Add Category</DialogTitle>
                        <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-widest">Create a new group for your products</p>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="cat-name" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category Name *</label>
                        <input
                            id="cat-name"
                            {...register("name")}
                            placeholder="e.g. Beverages, Mains, Desserts"
                            className="w-full h-12 px-5 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-bold text-gray-900"
                        />
                        {errors.name && <p className="text-xs text-red-500 font-bold">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="cat-desc" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
                        <textarea
                            id="cat-desc"
                            {...register("description")}
                            placeholder="Briefly describe what goes into this category..."
                            className="w-full min-h-[100px] p-5 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-bold text-gray-900 resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-2xl font-bold text-gray-400 hover:text-gray-900"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-12 rounded-2xl font-black bg-brand-500 hover:bg-brand-600 shadow-xl shadow-brand-200"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Create Category
                                    <Plus className="ml-2 w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
