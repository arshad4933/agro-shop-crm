"use client";

import {
    Bell,
    LogOut,
    UserCircle,
} from "lucide-react";

export default function Navbar() {

    return (

        <header className="bg-white shadow rounded-xl px-6 py-4 flex items-center justify-between">

            <div>

                <h1 className="text-2xl font-bold text-slate-800">
                    Dashboard
                </h1>

                <p className="text-sm text-slate-500">
                    Welcome to Agro Shop CRM
                </p>

            </div>

            <div className="flex items-center gap-5"></div>
            <button
                className="relative"
            >

                <Bell
                    size={22}
                    className="text-slate-600"
                />

                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500"></span>

            </button>

            <div className="flex items-center gap-3">

                <UserCircle
                    size={36}
                    className="text-green-700"
                />

                <div>

                    <p className="font-semibold text-slate-800">
                        System Administrator
                    </p>

                    <p className="text-xs text-slate-500">
                        Admin
                    </p>

                </div>

            </div>

            <button
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
            >

                <LogOut size={18} />

                Logout

            </button>



        </header >

    );

}
