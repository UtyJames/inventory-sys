"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./button";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps {
    children: React.ReactNode;
    className?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
}

export function SubmitButton({ children, className, variant, size }: SubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            disabled={pending}
            className={className}
            variant={variant}
            size={size}
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                </>
            ) : (
                children
            )}
        </Button>
    );
}
