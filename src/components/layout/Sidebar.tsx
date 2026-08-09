import Link from "next/link";

import {
    LayoutDashboard,
    Boxes,
    Users,
    Truck,
    ShoppingCart,
    Package,
    Receipt,
    BarChart3,
    Wallet,
    CircleDollarSign,
} from "lucide-react";

export default function Sidebar() {
    return (
        <aside className="w-64 min-h-screen bg-green-700 text-white">

            <div className="p-6 text-2xl font-bold border-b border-green-600">
                ARSHAD AGRO SHOP
            </div>

            <nav className="p-4 space-y-2">

                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-600"
                >
                    <LayoutDashboard size={20} />
                    Dashboard
                </Link>

                <Link
                    href="/category"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-600"
                >
                    <Boxes size={20} />
                    Category
                </Link>

                <Link
                    href="/product"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-600"
                >
                    <Package size={20} />
                    Product
                </Link>

                <Link
                    href="/supplier"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-600"
                >
                    <Truck size={20} />
                    Supplier
                </Link>

                <Link
                    href="/customer"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-600"
                >
                    <Users size={20} />
                    Customer
                </Link>

                <Link
                    href="/purchase"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-600"
                >
                    <ShoppingCart size={20} />
                    Purchase
                </Link>
                <Link
                    href="/supplier-payment"
                    className="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-green-600"
                >
                    <CircleDollarSign size={20} />
                    Supplier Payment
                </Link>
                <Link
                    href="/sale"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-600"
                >
                    <Receipt size={20} />
                    Sale
                </Link>
                <Link
                    href="/customer-payment"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-600"
                >
                    <Receipt size={20} />
                    Customer Payment
                </Link>


                <Link
                    href="/cashbook"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-600"
                >
                    <Wallet size={20} />
                    Cash Book
                </Link>
                <Link
                    href="/reports"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-600"
                >
                    <BarChart3 size={20} />
                    Reports
                </Link>

            </nav>

        </aside>
    );
}