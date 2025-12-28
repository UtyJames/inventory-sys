"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  Package,
  Layers,
  Settings,
  FileText,
  DollarSign,
  Box,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createProduct } from "@/app/lib/actions/product.actions";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  costPrice: z.number().optional(),
  initialStock: z.number().min(0).default(0),
  lowStockAlert: z.number().optional(),
  stockUnit: z.string().default("pcs"),
  trackInventory: z.boolean().default(true),
  displayName: z.string().optional(),
  posQuickCode: z.string().optional(),
  printerGroup: z.string().optional(),
  displayColor: z.string().default("#3b82f6"),
  taxRate: z.number().min(0).default(0),
  taxInclusive: z.boolean().default(true),
  discountable: z.boolean().default(true),
  supplierId: z.string().optional(),
  reorderQuantity: z.number().optional(),
  expiryTracking: z.boolean().default(false),
  isSeasonal: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productSchema>;

const steps = [
  { id: "basic", title: "Basic Info", icon: FileText },
  { id: "pricing", title: "Pricing & Stock", icon: DollarSign },
  { id: "pos", title: "POS Settings", icon: Settings },
  { id: "advanced", title: "Advanced", icon: Layers },
];

export function AddProductForm({ categories, onSuccess }: { categories: any[], onSuccess?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      trackInventory: true,
      taxInclusive: true,
      discountable: true,
      displayColor: "#3b82f6",
      stockUnit: "pcs",
      taxRate: 0,
    }
  });

  const onSubmit = async (data: ProductFormValues) => {
    setLoading(true);
    try {
      const result = await createProduct(data);
      if (result.success) {
        toast.success("Product created successfully");
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create product");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const watchValues = watch();

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full max-h-[800px]">
      {/* Header */}
      <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Add New Product</h2>
          <p className="text-sm text-gray-500 mt-1">Configure your product details and inventory settings</p>
        </div>
        <div className="flex items-center gap-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300",
                idx === currentStep ? "bg-brand-500 text-white shadow-lg shadow-brand-200" :
                  idx < currentStep ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
              )}>
                {idx < currentStep ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
              </div>
              {idx < steps.length - 1 && (
                <div className={cn("w-6 h-0.5 mx-1 rounded-full", idx < currentStep ? "bg-green-200" : "bg-gray-100")} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-10 space-y-10">
          {/* Step 1: Basic Information */}
          {currentStep === 0 && (
            <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="col-span-2 space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Product Name *</label>
                <input
                  {...register("name")}
                  placeholder="e.g. Classic Cheeseburger"
                  className="w-full h-14 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-bold text-gray-900"
                />
                {errors.name && <p className="text-xs text-red-500 font-bold">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">SKU / Barcode</label>
                <input
                  {...register("sku")}
                  placeholder="AUTO-GENERATED"
                  className="w-full h-14 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-bold text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Category *</label>
                <select
                  {...register("categoryId")}
                  className="w-full h-14 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-bold text-gray-900 appearance-none"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="col-span-2 space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Description</label>
                <textarea
                  {...register("description")}
                  placeholder="Brief description of the product..."
                  className="w-full min-h-[120px] p-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-bold text-gray-900 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Pricing & Stock */}
          {currentStep === 1 && (
            <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Selling Price *</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400">₦</span>
                  <input
                    type="number" step="0.01"
                    {...register("price", { valueAsNumber: true })}
                    className="w-full h-14 pl-10 pr-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-black text-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Cost Price</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400">₦</span>
                  <input
                    type="number" step="0.01"
                    {...register("costPrice", { valueAsNumber: true })}
                    className="w-full h-14 pl-10 pr-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-black text-gray-900"
                  />
                </div>
              </div>

              <div className="col-span-2 p-8 bg-brand-50/50 rounded-[32px] border border-brand-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-brand-900">Track Inventory</h4>
                  <p className="text-xs text-brand-600 mt-1 font-medium">Keep track of stock levels for this product</p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue("trackInventory", !watchValues.trackInventory)}
                  className={cn(
                    "w-14 h-8 rounded-full transition-all relative p-1 px-1.5 flex items-center",
                    watchValues.trackInventory ? "bg-brand-500" : "bg-gray-200"
                  )}
                >
                  <div className={cn("w-6 h-6 bg-white rounded-full shadow-sm transition-all transform", watchValues.trackInventory ? "translate-x-6" : "translate-x-0")} />
                </button>
              </div>

              {watchValues.trackInventory && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Initial Stock</label>
                    <input
                      type="number"
                      {...register("initialStock", { valueAsNumber: true })}
                      className="w-full h-14 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-black text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Low Stock Alert</label>
                    <input
                      type="number"
                      {...register("lowStockAlert", { valueAsNumber: true })}
                      className="w-full h-14 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-black text-gray-900"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: POS Settings */}
          {currentStep === 2 && (
            <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Display Name (Short)</label>
                <input
                  {...register("displayName")}
                  placeholder="Optional"
                  className="w-full h-14 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-bold text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Quick Code</label>
                <input
                  {...register("posQuickCode")}
                  placeholder="e.g. 101"
                  className="w-full h-14 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-bold text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">POS Button Color</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    {...register("displayColor")}
                    className="w-16 h-14 p-1 rounded-2xl bg-gray-50 border-transparent cursor-pointer"
                  />
                  <div className="flex-1 px-6 h-14 rounded-2xl bg-gray-50 flex items-center font-bold text-gray-600">
                    {watchValues.displayColor?.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Tax Rate</label>
                <select
                  {...register("taxRate", { valueAsNumber: true })}
                  className="w-full h-14 px-6 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 transition-all font-bold text-gray-900 appearance-none"
                >
                  <option value="0">Zero (0%)</option>
                  <option value="5">Retail (5%)</option>
                  <option value="10">Standard (10%)</option>
                  <option value="18">Custom (18%)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <h4 className="font-bold text-gray-900">Tax Inclusive</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-widest">Price includes tax</p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue("taxInclusive", !watchValues.taxInclusive)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative p-1 flex items-center",
                    watchValues.taxInclusive ? "bg-green-500" : "bg-gray-200"
                  )}
                >
                  <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-all transform", watchValues.taxInclusive ? "translate-x-6" : "translate-x-0")} />
                </button>
              </div>

              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <h4 className="font-bold text-gray-900">Discountable</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-widest">Apply promotions</p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue("discountable", !watchValues.discountable)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative p-1 flex items-center",
                    watchValues.discountable ? "bg-green-500" : "bg-gray-200"
                  )}
                >
                  <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-all transform", watchValues.discountable ? "translate-x-6" : "translate-x-0")} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Advanced */}
          {currentStep === 3 && (
            <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="col-span-2 p-8 bg-gray-900 rounded-[32px] text-white flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-black">Ready to launch?</h4>
                  <p className="text-gray-400 mt-1 font-medium">Confirm your settings and add this product to your menu.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profit Margin</p>
                    <p className="text-2xl font-black text-green-400">
                      {watchValues.price && watchValues.costPrice ?
                        `${Math.round(((watchValues.price - watchValues.costPrice) / watchValues.price) * 100)}%` :
                        "--"}
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                    <RocketIcon className="w-8 h-8 text-brand-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Final Preview</h4>
                <div className="bg-white rounded-[32px] p-8 border-2 border-dashed border-gray-100">
                  <div className="flex items-center gap-6">
                    <div
                      className="w-24 h-24 rounded-[28px] flex items-center justify-center text-4xl font-black text-white shadow-xl"
                      style={{ backgroundColor: watchValues.displayColor }}
                    >
                      {watchValues.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900">{watchValues.name || "Product Name"}</h3>
                      <p className="text-brand-600 font-black text-xl mt-1">₦{watchValues.price?.toLocaleString() || "0.00"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <div>
                    <h4 className="font-bold text-gray-900">Perishable Item</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-widest">Track expiry dates</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue("expiryTracking", !watchValues.expiryTracking)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative p-1 flex items-center",
                      watchValues.expiryTracking ? "bg-orange-500" : "bg-gray-200"
                    )}
                  >
                    <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-all transform", watchValues.expiryTracking ? "translate-x-6" : "translate-x-0")} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <div>
                    <h4 className="font-bold text-gray-900">Seasonal Item</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-widest">Limited availability</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue("isSeasonal", !watchValues.isSeasonal)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative p-1 flex items-center",
                      watchValues.isSeasonal ? "bg-brand-500" : "bg-gray-200"
                    )}
                  >
                    <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-all transform", watchValues.isSeasonal ? "translate-x-6" : "translate-x-0")} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-gray-50 flex items-center justify-between bg-white z-10 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 0 ? undefined : prevStep}
            className={cn("h-14 px-8 rounded-2xl font-bold transition-all", currentStep === 0 && "opacity-0 invisible")}
          >
            <ChevronLeft className="mr-2 w-5 h-5" />
            Previous
          </Button>

          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              className="h-14 px-8 rounded-2xl font-bold text-gray-400 hover:text-gray-900"
            >
              Cancel
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={currentStep === 0 && !watchValues.name}
                className="h-14 px-8 rounded-2xl font-black bg-brand-500 hover:bg-brand-600 shadow-xl shadow-brand-200"
              >
                Next Step
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className="h-14 px-10 rounded-2xl font-black bg-brand-500 hover:bg-brand-600 shadow-xl shadow-brand-200"
              >
                {loading ? "Adding Product..." : "Launch Product"}
                <Plus className="ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function RocketIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.6 1.26-1.34 1.74-2.12 1.38-2.23 2.73-4.48 4.08-6.73 1.35-2.25 2.7-4.5 4.05-6.75A.74.74 0 0 0 16.75 3c-2.25 1.35-4.5 2.7-6.75 4.05-2.25 1.35-4.5 2.7-6.75 4.05a.74.74 0 0 0-.62.62c.45 1.35.9 2.7 1.35 4.05.45 1.35.9 2.7 1.35 4.05.45 1.35.9 2.7 1.35 4.05.45 1.35.9 2.7 1.35 4.05.45 1.35.9 2.7 1.35 4.05" />
      <path d="M11 13c.48-.48 1.45-1.45 1.45-1.45" />
      <path d="M9 11c.48-.48 1.45-1.45 1.45-1.45" />
      <path d="m8 8 9 9" />
      <path d="M16 16c.48-.48 1.45-1.45 1.45-1.45" />
      <path d="M14 14c.48-.48 1.45-1.45 1.45-1.45" />
    </svg>
  );
}
