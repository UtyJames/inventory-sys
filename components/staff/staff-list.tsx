"use client";

import { useState } from "react";
import { formatNaira } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { User, Trash2, KeyRound, Eye, MoreHorizontal } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { deleteStaff, updateStaffPin } from "@/app/lib/actions/staff.actions";
import { getStaffPerformanceReport } from "@/app/lib/actions/order.actions"; // We can fetch this on demand
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StaffListProps {
    initialStaff: any[];
    currentUserRole: string;
}

export function StaffList({ initialStaff, currentUserRole }: StaffListProps) {
    const [staff, setStaff] = useState(initialStaff);
    const [isLoading, setIsLoading] = useState(false);

    // Password Reset State
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [newPin, setNewPin] = useState("");

    // Details State
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [staffStats, setStaffStats] = useState<any>(null);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;

        setIsLoading(true);
        const res = await deleteStaff(id);
        setIsLoading(false);

        if (res.success) {
            toast.success("Staff deleted successfully");
            setStaff(prev => prev.filter(u => u.id !== id));
        } else {
            toast.error(res.error || "Failed to delete staff");
        }
    };

    const handleResetPin = async () => {
        if (!newPin || newPin.length < 4) {
            toast.error("PIN must be at least 4 characters");
            return;
        }

        setIsLoading(true);
        const res = await updateStaffPin(selectedUser.id, newPin);
        setIsLoading(false);

        if (res.success) {
            toast.success("Password/PIN updated successfully");
            setIsResetOpen(false);
            setNewPin("");
            setSelectedUser(null);
        } else {
            toast.error(res.error || "Failed to update PIN");
        }
    };

    const handleViewDetails = async (user: any) => {
        setSelectedUser(user);
        setIsDetailsOpen(true);
        setStaffStats(null); // Loading state for stats

        // Fetch stats
        const res = await getStaffPerformanceReport({
            // Default to all time or this month? Let's say Last 30 Days or All Time
            startDate: new Date(new Date().setDate(new Date().getDate() - 30))
        });

        if (res.success) {
            // Find this specific user's stats
            const stats = (res.staffPerformance || []).find((s: any) => s.name === user.name) || {
                revenue: 0,
                orderCount: 0,
                profit: 0,
                avgOrderValue: 0
            };
            setStaffStats(stats);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map((user) => (
                    <div key={user.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-lg">
                                    {user.image ? <img src={user.image} className="w-full h-full rounded-2xl object-cover" /> : user.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{user.name}</h3>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{user.role}</p>
                                </div>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl">
                                    <DropdownMenuItem onClick={() => handleViewDetails(user)} className="font-medium">
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Details
                                    </DropdownMenuItem>
                                    {(currentUserRole === "ADMIN" || currentUserRole === "MANAGER") && (
                                        <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsResetOpen(true); }} className="font-medium">
                                            <KeyRound className="w-4 h-4 mr-2" />
                                            Reset Access
                                        </DropdownMenuItem>
                                    )}
                                    {currentUserRole === "ADMIN" && user.role !== "ADMIN" && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleDelete(user.id, user.name)} className="text-red-500 font-medium focus:text-red-600 focus:bg-red-50">
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete Staff
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400 font-medium">
                            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                            <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${user.role === 'ADMIN' ? 'bg-purple-500' : user.role === 'MANAGER' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                Active
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reset PIN Modal */}
            <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                <DialogContent className="sm:max-w-md rounded-[32px]">
                    <DialogHeader>
                        <DialogTitle>Reset Password / PIN</DialogTitle>
                        <DialogDescription>
                            Set a new login PIN or password for {selectedUser?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input
                            type="password"
                            placeholder="New PIN (min 4 chars)"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            className="bg-gray-50 border-none h-12 rounded-xl"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsResetOpen(false)} className="rounded-xl">Cancel</Button>
                        <Button onClick={handleResetPin} disabled={isLoading} className="bg-brand-500 hover:bg-brand-600 text-white rounded-xl">
                            {isLoading ? "Updating..." : "Update Access"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Staff Details Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-lg rounded-[32px]">
                    <DialogHeader>
                        <DialogTitle>Performance Overview</DialogTitle>
                        <DialogDescription>
                            Last 30 days performance for {selectedUser?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {staffStats ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-2xl">
                                    <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Total Sales</p>
                                    <p className="text-2xl font-black text-gray-900">{formatNaira(staffStats.revenue)}</p>
                                </div>
                                <div className="bg-green-50 p-4 rounded-2xl">
                                    <p className="text-green-600 text-[10px] font-black uppercase tracking-widest">Orders Took</p>
                                    <p className="text-2xl font-black text-gray-900">{staffStats.orderCount}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-2xl">
                                    <p className="text-purple-600 text-[10px] font-black uppercase tracking-widest">Avg. Order</p>
                                    <p className="text-2xl font-black text-gray-900">{formatNaira(staffStats.avgOrderValue)}</p>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-2xl">
                                    <p className="text-orange-600 text-[10px] font-black uppercase tracking-widest">Est. Profit</p>
                                    <p className="text-2xl font-black text-gray-900">{formatNaira(staffStats.profit)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center py-8">
                                <span className="loading loading-spinner text-brand-500">Loading stats...</span>
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-400 mb-2">LOGIN HOURS</p>
                            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-500">
                                Feature coming soon: Tracking active login sessions.
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
