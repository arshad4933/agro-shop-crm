import { ReactNode } from "react";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

export default function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (

        <div className="flex min-h-screen bg-slate-100">

            <Sidebar />

            <div className="flex flex-1 flex-col">

                <Navbar />

                <main className="flex-1 p-6">

                    {children}

                </main>

            </div>

        </div>

    );
}