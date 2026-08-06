"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

type ReportType =
    | "sales"
    | "purchase"
    | "profit"
    | "stock"
    | "cash-book"
    | "expense";

function money(value: any) {
    return `৳ ${Number(value || 0).toLocaleString("en-BD", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function dateFormat(value: any) {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("en-GB");
}

function SummaryCard({
    title,
    value,
    color = "blue",
}: {
    title: string;
    value: any;
    color?: "blue" | "green" | "red" | "yellow";
}) {
    const styles = {
        blue: "bg-blue-50 border-blue-100 text-blue-700",
        green: "bg-green-50 border-green-100 text-green-700",
        red: "bg-red-50 border-red-100 text-red-700",
        yellow: "bg-yellow-50 border-yellow-100 text-yellow-700",
    };

    return (
        <div className={`rounded-2xl border p-5 ${styles[color]}`}>
            <p className="text-sm font-medium opacity-70">
                {title}
            </p>

            <h3 className="mt-2 text-2xl font-bold">
                {value}
            </h3>
        </div>
    );
}

export default function ReportsPage() {
    const [reportType, setReportType] =
        useState<ReportType>("sales");

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [hasGenerated, setHasGenerated] = useState(false);

    async function loadReport() {
        try {
            setLoading(true);
            setReportData(null);
            setHasGenerated(false);

            let url = `/api/reports/${reportType}`;

            const params = new URLSearchParams();

            if (fromDate) {
                params.append("from", fromDate);
            }

            if (toDate) {
                params.append("to", toDate);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await axios.get(url);

            setReportData(response.data);
            setHasGenerated(true);
        } catch (error) {
            console.error(error);

            toast.error("Failed to load report");

            setReportData(null);
            setHasGenerated(false);
        } finally {
            setLoading(false);
        }
    }

    function reportTitle() {
        const titles: Record<ReportType, string> = {
            sales: "Sales Report",
            purchase: "Purchase Report",
            profit: "Profit Report",
            stock: "Stock Report",
            "cash-book": "Cash Book",
            expense: "Expense Report",
        };

        return titles[reportType];
    }

    return (
        <div className="space-y-6">

            {/* HEADER */}

            <div>
                <h1 className="text-3xl font-bold">
                    Reports
                </h1>

                <p className="mt-1 text-slate-500">
                    View and analyze your business reports
                </p>
            </div>


            {/* FILTER */}

            <div className="rounded-2xl border bg-white p-6 shadow-sm">

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Report Type
                        </label>

                        <select
                            value={reportType}
                            onChange={(e) => {
                                setReportType(
                                    e.target.value as ReportType
                                );

                                setReportData(null);
                                setHasGenerated(false);
                            }}
                            className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                        >
                            <option value="sales">
                                Sales Report
                            </option>

                            <option value="purchase">
                                Purchase Report
                            </option>

                            <option value="profit">
                                Profit Report
                            </option>

                            <option value="stock">
                                Stock Report
                            </option>

                            <option value="cash-book">
                                Cash Book
                            </option>

                            <option value="expense">
                                Expense Report
                            </option>
                        </select>
                    </div>


                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            From Date
                        </label>

                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) =>
                                setFromDate(e.target.value)
                            }
                            className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                        />
                    </div>


                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            To Date
                        </label>

                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) =>
                                setToDate(e.target.value)
                            }
                            className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                        />
                    </div>

                </div>


                <div className="mt-5 flex gap-3">

                    <button
                        onClick={loadReport}
                        disabled={loading}
                        className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading
                            ? "Generating..."
                            : "Generate Report"}
                    </button>


                    {(fromDate || toDate) && (
                        <button
                            onClick={() => {
                                setFromDate("");
                                setToDate("");
                                setReportData(null);
                                setHasGenerated(false);
                            }}
                            className="rounded-lg border px-6 py-3 font-medium hover:bg-slate-50"
                        >
                            Clear
                        </button>
                    )}

                </div>

            </div>


            {/* EMPTY STATE */}

            {!hasGenerated && !loading && (
                <div className="rounded-2xl border bg-white p-16 text-center shadow-sm">

                    <div className="text-5xl">
                        📊
                    </div>

                    <h2 className="mt-4 text-xl font-bold">
                        Select a report to begin
                    </h2>

                    <p className="mt-2 text-slate-500">
                        Choose a report type and date range,
                        then click Generate Report.
                    </p>

                </div>
            )}


            {/* LOADING */}

            {loading && (
                <div className="rounded-2xl border bg-white p-16 text-center shadow-sm">

                    <div className="text-xl font-semibold">
                        Generating {reportTitle()}...
                    </div>

                    <p className="mt-2 text-slate-500">
                        Please wait.
                    </p>

                </div>
            )}


            {/* REPORT */}

            {!loading && reportData && hasGenerated && (

                <div className="space-y-6">

                    {/* REPORT HEADER */}

                    <div className="flex items-center justify-between">

                        <div>
                            <h2 className="text-2xl font-bold">
                                {reportTitle()}
                            </h2>

                            {(fromDate || toDate) && (
                                <p className="mt-1 text-sm text-slate-500">
                                    {fromDate || "Beginning"} →{" "}
                                    {toDate || "Today"}
                                </p>
                            )}
                        </div>

                    </div>


                    {/* ================= SALES ================= */}

                    {reportType === "sales" && (

                        <>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">

                                <SummaryCard
                                    title="Total Invoices"
                                    value={
                                        reportData.summary.totalInvoices
                                    }
                                />

                                <SummaryCard
                                    title="Total Sales"
                                    value={money(
                                        reportData.summary.totalSales
                                    )}
                                    color="blue"
                                />

                                <SummaryCard
                                    title="Total Paid"
                                    value={money(
                                        reportData.summary.totalPaid
                                    )}
                                    color="green"
                                />

                                <SummaryCard
                                    title="Total Due"
                                    value={money(
                                        reportData.summary.totalDue
                                    )}
                                    color="red"
                                />

                                <SummaryCard
                                    title="Total Profit"
                                    value={money(
                                        reportData.summary.totalProfit
                                    )}
                                    color="yellow"
                                />

                            </div>


                            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

                                <div className="border-b p-5">

                                    <h3 className="font-bold">
                                        Sales Transactions
                                    </h3>

                                </div>

                                <div className="overflow-x-auto">

                                    <table className="min-w-full">

                                        <thead className="bg-slate-100">

                                            <tr>

                                                <th className="px-5 py-3 text-left">
                                                    Invoice
                                                </th>

                                                <th className="px-5 py-3 text-left">
                                                    Date
                                                </th>

                                                <th className="px-5 py-3 text-left">
                                                    Customer
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Total
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Discount
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Paid
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Due
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {reportData.report.map(
                                                (sale: any) => (

                                                    <tr
                                                        key={sale.id}
                                                        className="border-t hover:bg-slate-50"
                                                    >

                                                        <td className="px-5 py-4 font-semibold">
                                                            {sale.invoiceNo}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            {dateFormat(
                                                                sale.saleDate
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="font-medium">
                                                                {
                                                                    sale
                                                                        .customer
                                                                        .name
                                                                }
                                                            </div>

                                                            <div className="text-xs text-slate-500">
                                                                {
                                                                    sale
                                                                        .customer
                                                                        .phone
                                                                }
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4 text-right font-semibold">
                                                            {money(
                                                                sale.totalAmount
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4 text-right">
                                                            {money(
                                                                sale.discount
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4 text-right text-green-700">
                                                            {money(
                                                                sale.paidAmount
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4 text-right font-semibold text-red-600">
                                                            {money(
                                                                sale.dueAmount
                                                            )}
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        </>
                    )}


                    {/* ================= PURCHASE ================= */}

                    {reportType === "purchase" && (

                        <>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

                                <SummaryCard
                                    title="Total Purchases"
                                    value={
                                        reportData.summary.totalPurchases
                                    }
                                />

                                <SummaryCard
                                    title="Purchase Amount"
                                    value={money(
                                        reportData.summary.totalPurchase
                                    )}
                                    color="blue"
                                />

                                <SummaryCard
                                    title="Paid"
                                    value={money(
                                        reportData.summary.totalPaid
                                    )}
                                    color="green"
                                />

                                <SummaryCard
                                    title="Due"
                                    value={money(
                                        reportData.summary.totalDue
                                    )}
                                    color="red"
                                />

                            </div>


                            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

                                <div className="border-b p-5">
                                    <h3 className="font-bold">
                                        Purchase Transactions
                                    </h3>
                                </div>

                                <div className="overflow-x-auto">

                                    <table className="min-w-full">

                                        <thead className="bg-slate-100">

                                            <tr>

                                                <th className="px-5 py-3 text-left">
                                                    Purchase No
                                                </th>

                                                <th className="px-5 py-3 text-left">
                                                    Date
                                                </th>

                                                <th className="px-5 py-3 text-left">
                                                    Supplier
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Total
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Paid
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Due
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {reportData.report.map(
                                                (purchase: any) => (

                                                    <tr
                                                        key={purchase.id}
                                                        className="border-t hover:bg-slate-50"
                                                    >

                                                        <td className="px-5 py-4 font-semibold">
                                                            {
                                                                purchase.purchaseNo
                                                            }
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            {dateFormat(
                                                                purchase.purchaseDate
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="font-medium">
                                                                {
                                                                    purchase
                                                                        .supplier
                                                                        .name
                                                                }
                                                            </div>

                                                            <div className="text-xs text-slate-500">
                                                                {
                                                                    purchase
                                                                        .supplier
                                                                        .phone
                                                                }
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4 text-right font-semibold">
                                                            {money(
                                                                purchase.totalAmount
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4 text-right text-green-700">
                                                            {money(
                                                                purchase.paidAmount
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4 text-right font-semibold text-red-600">
                                                            {money(
                                                                purchase.dueAmount
                                                            )}
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        </>
                    )}


                    {/* ================= PROFIT ================= */}

                    {reportType === "profit" && (

                        <>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

                                <SummaryCard
                                    title="Gross Profit"
                                    value={money(
                                        reportData.summary.grossProfit
                                    )}
                                    color="blue"
                                />

                                <SummaryCard
                                    title="Profit Reduced"
                                    value={money(
                                        reportData.summary.profitReduced
                                    )}
                                    color="red"
                                />

                                <SummaryCard
                                    title="Actual Profit"
                                    value={money(
                                        reportData.summary.actualProfit
                                    )}
                                    color="green"
                                />

                                <SummaryCard
                                    title="Products"
                                    value={
                                        reportData.summary.totalProducts
                                    }
                                    color="yellow"
                                />

                            </div>


                            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

                                <div className="border-b p-5">

                                    <h3 className="font-bold">
                                        Product Profitability
                                    </h3>

                                </div>

                                <div className="overflow-x-auto">

                                    <table className="min-w-full">

                                        <thead className="bg-slate-100">

                                            <tr>

                                                <th className="px-5 py-3 text-left">
                                                    Product
                                                </th>

                                                <th className="px-5 py-3 text-left">
                                                    Brand
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Quantity Sold
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Sales
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Profit
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {reportData.topProducts.map(
                                                (product: any) => (

                                                    <tr
                                                        key={product.productId}
                                                        className="border-t hover:bg-slate-50"
                                                    >

                                                        <td className="px-5 py-4 font-semibold">
                                                            {
                                                                product.productName
                                                            }
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            {
                                                                product.brand
                                                            }
                                                        </td>

                                                        <td className="px-5 py-4 text-right">
                                                            {
                                                                product.totalSold
                                                            }
                                                        </td>

                                                        <td className="px-5 py-4 text-right">
                                                            {money(
                                                                product.sales
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4 text-right font-bold text-green-700">
                                                            {money(
                                                                product.profit
                                                            )}
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        </>
                    )}


                    {/* ================= STOCK ================= */}

                    {reportType === "stock" && (

                        <>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

                                <SummaryCard
                                    title="Stock Value"
                                    value={money(
                                        reportData.summary.totalStockValue
                                    )}
                                    color="blue"
                                />

                                <SummaryCard
                                    title="Expected Sales Value"
                                    value={money(
                                        reportData.summary.totalSaleValue
                                    )}
                                    color="green"
                                />

                                <SummaryCard
                                    title="Expected Profit"
                                    value={money(
                                        reportData.summary.expectedProfit
                                    )}
                                    color="yellow"
                                />

                                <SummaryCard
                                    title="Low Stock"
                                    value={
                                        reportData.summary.lowStockCount
                                    }
                                    color="red"
                                />

                            </div>


                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                                <SummaryCard
                                    title="Out of Stock"
                                    value={
                                        reportData.summary.outOfStockCount
                                    }
                                    color="red"
                                />

                                <SummaryCard
                                    title="Expired"
                                    value={
                                        reportData.summary.expiredCount
                                    }
                                    color="red"
                                />

                                <SummaryCard
                                    title="Total Batches"
                                    value={
                                        reportData.summary.totalProducts
                                    }
                                    color="blue"
                                />

                            </div>


                            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

                                <div className="border-b p-5">

                                    <h3 className="font-bold">
                                        Current Stock
                                    </h3>

                                </div>

                                <div className="overflow-x-auto">

                                    <table className="min-w-full">

                                        <thead className="bg-slate-100">

                                            <tr>

                                                <th className="px-5 py-3 text-left">
                                                    Product
                                                </th>

                                                <th className="px-5 py-3 text-left">
                                                    Category
                                                </th>

                                                <th className="px-5 py-3 text-left">
                                                    Supplier
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Quantity
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Buy Price
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Sell Price
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Stock Value
                                                </th>

                                                <th className="px-5 py-3 text-center">
                                                    Status
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {reportData.report.map(
                                                (item: any) => (

                                                    <tr
                                                        key={item.batchId}
                                                        className="border-t hover:bg-slate-50"
                                                    >

                                                        <td className="px-5 py-4">
                                                            <div className="font-semibold">
                                                                {
                                                                    item.productName
                                                                }
                                                            </div>

                                                            <div className="text-xs text-slate-500">
                                                                {
                                                                    item.brand
                                                                }
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            {
                                                                item.category
                                                            }
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            {
                                                                item.supplier
                                                            }
                                                        </td>

                                                        <td className="px-5 py-4 text-right font-bold">
                                                            {item.quantity}
                                                        </td>

                                                        <td className="px-5 py-4 text-right">
                                                            {money(
                                                                item.purchasePrice
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4 text-right">
                                                            {money(
                                                                item.sellingPrice
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4 text-right font-semibold">
                                                            {money(
                                                                item.stockValue
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4 text-center">

                                                            {item.isExpired ? (
                                                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                                                    Expired
                                                                </span>
                                                            ) : item.isOutOfStock ? (
                                                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                                                    Out of Stock
                                                                </span>
                                                            ) : item.isLowStock ? (
                                                                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                                                                    Low Stock
                                                                </span>
                                                            ) : (
                                                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                                                    Available
                                                                </span>
                                                            )}

                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        </>
                    )}


                    {/* ================= CASH BOOK ================= */}

                    {reportType === "cash-book" && (

                        <>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">

                                <SummaryCard
                                    title="Opening Balance"
                                    value={money(
                                        reportData.summary.openingBalance
                                    )}
                                />

                                <SummaryCard
                                    title="Cash In"
                                    value={money(
                                        reportData.summary.totalCashIn
                                    )}
                                    color="green"
                                />

                                <SummaryCard
                                    title="Cash Out"
                                    value={money(
                                        reportData.summary.totalCashOut
                                    )}
                                    color="red"
                                />

                                <SummaryCard
                                    title="Closing Balance"
                                    value={money(
                                        reportData.summary.closingBalance
                                    )}
                                    color="blue"
                                />

                                <SummaryCard
                                    title="Transactions"
                                    value={
                                        reportData.summary.totalTransactions
                                    }
                                    color="yellow"
                                />

                            </div>


                            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

                                <div className="border-b p-5">

                                    <h3 className="font-bold">
                                        Cash Book Transactions
                                    </h3>

                                </div>

                                <div className="overflow-x-auto">

                                    <table className="min-w-full">

                                        <thead className="bg-slate-100">

                                            <tr>

                                                <th className="px-5 py-3 text-left">
                                                    Date
                                                </th>

                                                <th className="px-5 py-3 text-left">
                                                    Type
                                                </th>

                                                <th className="px-5 py-3 text-left">
                                                    Description
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Cash In
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Cash Out
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Balance
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {reportData.report.map(
                                                (item: any) => (

                                                    <tr
                                                        key={item.id}
                                                        className="border-t hover:bg-slate-50"
                                                    >

                                                        <td className="px-5 py-4">
                                                            {dateFormat(
                                                                item.date
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                                                                {
                                                                    item.type
                                                                }
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            {
                                                                item.description
                                                            }
                                                        </td>

                                                        <td className="px-5 py-4 text-right font-semibold text-green-700">
                                                            {item.cashIn
                                                                ? money(
                                                                    item.cashIn
                                                                )
                                                                : "-"}
                                                        </td>

                                                        <td className="px-5 py-4 text-right font-semibold text-red-600">
                                                            {item.cashOut
                                                                ? money(
                                                                    item.cashOut
                                                                )
                                                                : "-"}
                                                        </td>

                                                        <td className="px-5 py-4 text-right font-bold">
                                                            {money(
                                                                item.balance
                                                            )}
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        </>
                    )}


                    {/* ================= EXPENSE ================= */}

                    {reportType === "expense" && (

                        <>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                                <SummaryCard
                                    title="Total Expense Entries"
                                    value={
                                        reportData.summary.totalExpenses
                                    }
                                    color="blue"
                                />

                                <SummaryCard
                                    title="Total Expense"
                                    value={money(
                                        reportData.summary.totalExpense
                                    )}
                                    color="red"
                                />

                            </div>


                            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

                                <div className="border-b p-5">

                                    <h3 className="font-bold">
                                        Expense Transactions
                                    </h3>

                                </div>

                                <div className="overflow-x-auto">

                                    <table className="min-w-full">

                                        <thead className="bg-slate-100">

                                            <tr>

                                                <th className="px-5 py-3 text-left">
                                                    Date
                                                </th>

                                                <th className="px-5 py-3 text-left">
                                                    Category
                                                </th>

                                                <th className="px-5 py-3 text-left">
                                                    Description
                                                </th>

                                                <th className="px-5 py-3 text-right">
                                                    Amount
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {reportData.report.map(
                                                (expense: any) => (

                                                    <tr
                                                        key={expense.id}
                                                        className="border-t hover:bg-slate-50"
                                                    >

                                                        <td className="px-5 py-4">
                                                            {dateFormat(
                                                                expense.date
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                                                {
                                                                    expense.category
                                                                }
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            {
                                                                expense.description ||
                                                                "-"
                                                            }
                                                        </td>

                                                        <td className="px-5 py-4 text-right font-bold text-red-600">
                                                            {money(
                                                                expense.amount
                                                            )}
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        </>
                    )}

                </div>
            )}

        </div>
    );
}