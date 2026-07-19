"use client";

import { useEffect, useState } from "react";

import axios from "axios";
import DashboardCard from "@/components/dashboard/DashboardCard";
import SalesChart from "@/components/dashboard/SalesChart";
import PurchaseChart from "@/components/dashboard/PurchaseChart";
import RecentSalesTable from "@/components/dashboard/RecentSalesTable";

import {
    DollarSign,
    ShoppingCart,
    Package,
    Users,
    Truck,
    TrendingUp,
    Wallet,
    Landmark,
    Boxes,
} from "lucide-react";


type DashboardData = {
    totalSales: number;
    totalPurchase: number;
    totalExpense: number;
    totalCashIn: number;
    totalCashOut: number;
    totalProfit: number;
    totalCustomerDue: number;
    totalSupplierDue: number;
    totalProducts: number;
    totalCustomers: number;
    totalSuppliers: number;
    totalStock: number;
    salesChart: {
        month: string;
        sales: number;
    }[];

    purchaseChart: {
        month: string;
        purchase: number;
    }[];
    recentSales: {
        id: number;
        invoiceNo: string;
        saleDate: string;
        totalAmount: string;
        dueAmount: string;
        customer: {
            name: string;
        };
    }[];
};

export default function DashboardPage() {

    const [dashboard, setDashboard] =
        useState<DashboardData | null>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {

        async function loadDashboard() {

            try {

                const token =
                    localStorage.getItem("token");

                const response =
                    await axios.get(
                        "/api/dashboard",
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    );

                setDashboard(response.data);

            } catch (error) {

                console.error(error);

            } finally {

                setLoading(false);

            }

        }

        loadDashboard();

    }, []);

    if (loading) {

        return (
            <h1 className="text-xl">
                Loading Dashboard...
            </h1>
        );

    }

    return (

        <div>

            <h1 className="mb-6 text-3xl font-bold">
                Dashboard
            </h1>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

                <DashboardCard
                    title="Total Sales"
                    value={`৳ ${dashboard?.totalSales.toLocaleString()}`}
                    icon={<DollarSign size={28} />}
                    color="bg-green-600"
                />

                <DashboardCard
                    title="Total Purchase"
                    value={`৳ ${dashboard?.totalPurchase.toLocaleString()}`}
                    icon={<ShoppingCart size={28} />}
                    color="bg-blue-600"
                />

                <DashboardCard
                    title="Total Profit"
                    value={`৳ ${dashboard?.totalProfit.toLocaleString()}`}
                    icon={<TrendingUp size={28} />}
                    color="bg-emerald-600"
                />

                <DashboardCard
                    title="Total Expense"
                    value={`৳ ${dashboard?.totalExpense.toLocaleString()}`}
                    icon={<Wallet size={28} />}
                    color="bg-red-600"
                />

                <DashboardCard
                    title="Products"
                    value={dashboard?.totalProducts ?? 0}
                    icon={<Boxes size={28} />}
                    color="bg-indigo-600"
                />

                <DashboardCard
                    title="Stock"
                    value={dashboard?.totalStock ?? 0}
                    icon={<Package size={28} />}
                    color="bg-purple-600"
                />

                <DashboardCard
                    title="Customers"
                    value={dashboard?.totalCustomers ?? 0}
                    icon={<Users size={28} />}
                    color="bg-cyan-600"
                />

                <DashboardCard
                    title="Suppliers"
                    value={dashboard?.totalSuppliers ?? 0}
                    icon={<Truck size={28} />}
                    color="bg-orange-600"
                />

                <DashboardCard
                    title="Customer Due"
                    value={`৳ ${dashboard?.totalCustomerDue.toLocaleString()}`}
                    icon={<DollarSign size={28} />}
                    color="bg-pink-600"
                />

                <DashboardCard
                    title="Supplier Due"
                    value={`৳ ${dashboard?.totalSupplierDue.toLocaleString()}`}
                    icon={<Landmark size={28} />}
                    color="bg-yellow-600"
                />

                <DashboardCard
                    title="Cash In"
                    value={`৳ ${dashboard?.totalCashIn.toLocaleString()}`}
                    icon={<TrendingUp size={28} />}
                    color="bg-lime-600"
                />

                <DashboardCard
                    title="Cash Out"
                    value={`৳ ${dashboard?.totalCashOut.toLocaleString()}`}
                    icon={<Wallet size={28} />}
                    color="bg-rose-600"
                />

            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-2">

                <SalesChart
                    data={dashboard?.salesChart ?? []}
                />

                <PurchaseChart
                    data={dashboard?.purchaseChart ?? []}
                />

            </div>
            <div className="mt-8">

                <RecentSalesTable
                    sales={dashboard?.recentSales ?? []}
                />

            </div>

        </div>

    );
}