"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ChevronRight, User, Mail, Lock, Hash } from "lucide-react";
import { signUpAction } from "../actions";

export default function SignUpPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <div>
            <div className="flex items-center gap-2 mb-8">
                <Link href="/auth/sign-in" className="flex items-center gap-2 group">
                    <div className="bg-brand-500 rounded-lg p-1.5 group-hover:bg-brand-600 transition-colors">
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
                    <span className="font-bold text-xl tracking-tight group-hover:text-brand-700 transition-colors">Inventory System</span>
                </Link>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
                    New Staff Registration
                </h1>
                <p className="text-gray-500 text-sm">
                    Create an account to join the team.
                </p>
            </div>

            <form className="space-y-4" action={signUpAction}>
                <div className="space-y-2">
                    <Label htmlFor="fullname">Full Name</Label>
                    <div className="relative">
                        <Input
                            id="fullname"
                            placeholder="John Doe"
                            type="text"
                            autoComplete="name"
                            className="pr-10"
                        />
                        <User className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                        <Input
                            id="email"
                            placeholder="john@bistropos.com"
                            type="email"
                            autoComplete="email"
                            className="pr-10"
                        />
                        <Mail className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="pin">4-Digit PIN</Label>
                        <div className="relative">
                            <Input
                                id="pin"
                                placeholder="2468"
                                type={showPassword ? "text" : "password"}
                                maxLength={4}
                                pattern="\d{4}"
                                className="pr-10 tracking-widest"
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

                    <div className="space-y-2">
                        <Label htmlFor="confirm-pin">Confirm PIN</Label>
                        <div className="relative">
                            <Input
                                id="confirm-pin"
                                placeholder="2468"
                                type={showConfirmPassword ? "text" : "password"}
                                maxLength={4}
                                pattern="\d{4}"
                                className="pr-10 tracking-widest"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <div className="relative">
                        <select
                            id="position"
                            className="flex h-12 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                        >
                            <option value="" disabled selected>Select Role</option>
                            <option value="waiter">Waiter / Waitress</option>
                            <option value="chef">Chef / Cook</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Administrator</option>
                        </select>
                        <ChevronRight className="absolute right-3 top-3 h-5 w-5 text-gray-400 rotate-90" />
                    </div>
                </div>

                <Button className="w-full text-base mt-2" size="lg">
                    Create Account
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </form>

            <div className="mt-8 text-center border-t border-gray-100 pt-6">
                <p className="text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link href="/auth/sign-in" className="font-semibold text-brand-600 hover:text-brand-700">
                        Log in here
                    </Link>
                </p>
            </div>
        </div>
    );
}
