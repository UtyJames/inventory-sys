"use client";

import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    FileSpreadsheet,
    Upload,
    X,
    CheckCircle2,
    AlertCircle,
    Download,
    Loader2
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { bulkCreateProducts } from "@/app/lib/actions/bulk.actions";
import { cn } from "@/lib/utils";

interface BulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BulkUploadModal({ isOpen, onClose }: BulkUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                toast.error("Please upload a valid Excel (.xlsx) file");
                return;
            }
            setFile(selectedFile);
            parseExcel(selectedFile);
        }
    };

    const parseExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            setPreview(json.slice(0, 5)); // Just preview the first 5 rows
        };
        reader.readAsArrayBuffer(file);
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

                const result = await bulkCreateProducts(json);
                if (result.success) {
                    toast.success(`Successfully uploaded ${result.count} products`);
                    if (result.errors) {
                        toast.warning(`Some items had issues: ${result.errors.length} errors`);
                    }
                    onClose();
                } else {
                    toast.error(result.error || "Failed to upload products");
                }
            } catch (error) {
                toast.error("Error processing file");
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const downloadTemplate = () => {
        const worksheet = XLSX.utils.json_to_sheet([
            {
                Name: "Sample Product",
                Category: "Burgers",
                Price: 1500,
                CostPrice: 1200,
                Stock: 50,
                LowStock: 10,
                Unit: "pcs",
                SKU: "PRD-001",
                Description: "Delicious sample product"
            }
        ]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
        XLSX.writeFile(workbook, "product_template.xlsx");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white rounded-[40px] border-none shadow-2xl">
                <div className="p-8 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-lg">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Bulk Product Upload</DialogTitle>
                            <p className="text-xs text-brand-600 font-bold uppercase tracking-widest mt-0.5">Import products from Excel</p>
                        </div>
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    {!file ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="group cursor-pointer border-4 border-dashed border-gray-100 rounded-[40px] p-16 flex flex-col items-center justify-center text-center transition-all hover:border-brand-200 hover:bg-brand-50/30"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white group-hover:shadow-xl transition-all duration-300">
                                <Upload className="w-10 h-10 text-gray-400 group-hover:text-brand-500" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">Select Excel File</h3>
                            <p className="text-gray-500 font-medium max-w-[280px]">Drag and drop or click to browse your .xlsx file</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".xlsx"
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between p-6 bg-green-50 rounded-3xl border border-green-100 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center text-white shadow-lg">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900">{file.name}</p>
                                        <p className="text-xs text-green-600 font-bold uppercase tracking-widest mt-0.5">Ready to import</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        setPreview([]);
                                    }}
                                    className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-red-500"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {preview.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Data Preview (First 5 Rows)</h4>
                                    <div className="bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-gray-100/50">
                                                    <tr>
                                                        <th className="px-4 py-3 font-black text-gray-500 uppercase">Name</th>
                                                        <th className="px-4 py-3 font-black text-gray-500 uppercase">Category</th>
                                                        <th className="px-4 py-3 font-black text-gray-500 uppercase">Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {preview.map((row, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-4 py-3 font-bold text-gray-900">{row.Name}</td>
                                                            <td className="px-4 py-3 font-bold text-gray-500">{row.Category}</td>
                                                            <td className="px-4 py-3 font-black text-brand-600">₦{Number(row.Price).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <Button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            className="h-16 rounded-3xl font-black text-lg bg-brand-500 hover:bg-brand-600 shadow-xl shadow-brand-200"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-6 h-6 mr-3" />
                                    Start Bulk Import
                                </>
                            )}
                        </Button>
                        <button
                            onClick={downloadTemplate}
                            className="flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors py-2"
                        >
                            <Download className="w-4 h-4" />
                            Download Excel Template
                        </button>
                    </div>
                </div>

                <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                        <b>Important:</b> Category names in your Excel sheet must match existing category names exactly (case-insensitive). Duplicate SKUs will be skipped.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
