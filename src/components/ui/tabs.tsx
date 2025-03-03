"use client";

import * as React from "react";

export function Tabs({ children }: { children: React.ReactNode }) {
    return <div className="border-b border-gray-200">{children}</div>;
}

export function TabsList({ children }: { children: React.ReactNode }) {
    return <div className="flex space-x-2">{children}</div>;
}

export function TabsTrigger({ value, onClick, children }: { value: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <button onClick={onClick} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black">
            {children}
        </button>
    );
}
