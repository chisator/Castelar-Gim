import React from "react";
import Image from "next/image";

export function Logo({ size = 28 }: { size?: number }) {
    return (
        <div className="flex items-center justify-center">
            <Image 
                src="/logo.webp" 
                alt="Gimnasio Castelar" 
                width={size} 
                height={size}
                className="object-contain drop-shadow-md"
                priority
            />
        </div>
    );
}
