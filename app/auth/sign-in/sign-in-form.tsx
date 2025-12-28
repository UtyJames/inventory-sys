"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Briefcase, ChevronRight } from "lucide-react";
import { signInAction } from "../actions";

import { toast } from "sonner";
import { SubmitButton } from "@/components/ui/submit-button";

export default function SignInForm() {
    const [showPassword, setShowPassword] = useState(false);

    const handleAction = async (formData: FormData) => {
        const result = await signInAction(formData);
        if (result?.success) {
            toast.success(result.message);
        } else if (result) {
            toast.error(result.message);
        }
    };

    return (
        <div>
            {/* Same header code... */}
            <div className="flex items-center gap-2 mb-10">
                <div className="bg-brand-500 rounded-lg p-1.5">
                    <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                    </svg>
                </div>
                <span className="font-bold text-xl tracking-tight">Ktcstocks Inventory System</span>
            </div>

            <div className="mb-8">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
                    Staff Login
                </h1>
                <p className="text-gray-500">
                    Please enter your credentials to start your shift.
                </p>
            </div>

            <form className="space-y-6" action={handleAction}>
                <div className="space-y-2">
                    <Label htmlFor="username">Employee ID / Username</Label>
                    <div className="relative">
                        <Input
                            id="username"
                            name="username"
                            placeholder="e.g. 84021"
                            type="text"
                            autoCapitalize="none"
                            autoComplete="username"
                            autoCorrect="off"
                            className="pr-10"
                            required
                        />
                        <Briefcase className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password / PIN</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            className="pr-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-end">
                    <Link
                        href="#"
                        className="text-sm font-semibold text-gray-600 hover:text-gray-900"
                    >
                        Forgot Password?
                    </Link>
                </div>

                <SubmitButton className="w-full text-base" size="lg">
                    Log In
                    <ChevronRight className="ml-2 h-4 w-4" />
                </SubmitButton>
            </form>

            <div className="mt-10 text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    <span className="h-2 w-2 rounded-full bg-brand-400"></span>
                    System Online • v4.2.0
                </div>
                <p className="text-xs text-gray-300">
                    Need help? <a href="#" className="hover:underline">Contact Manager</a>
                </p>

                <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        Don't have an account?{" "}
                        <Link href="/auth/sign-up" className="font-semibold text-brand-600 hover:text-brand-700">
                            Sign up as new staff
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
