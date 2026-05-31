import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ size = 28, className }: { size?: number; className?: string }) {
    return (
        <div className={cn("flex items-center justify-center drop-shadow-md", className)}>
            <Image 
                src="/Layer1000.svg" 
                alt="Gimnasio Castelar" 
                width={size} 
                height={size}
                className="object-contain"
                priority
            />
        </div>
    );
}
