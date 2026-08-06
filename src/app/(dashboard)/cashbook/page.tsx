"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

interface CashBookEntry {
    id: number;
    transactionDate: string;
    type: string;
    amount: number | string;
    description?: string | null;
    referenceType?: string | null;
    referenceId?: number | null;
}

export default function CashBookPage() {
    const [entries, setEntries] = useState<CashBookEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");

    async function loadCashBook() {
        try {
            setLoading(true);

            const response = await axios.get("/api/cashbook");

            setEntries(response.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load cash book");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCashBook();
    }, []);

    const filteredEntries = useMemo(() => {
        return entries
            .filter((entry) => {
                if (typeFilter === "All") return true;

                return (
                    entry.type?.toLowerCase() ===
                    typeFilter.toLowerCase()
                );
            })
            .filter((entry) => {
                if (!fromDate && !toDate) return true;

                const entryDate = new Date(entry.transactionDate);
                entryDate.setHours(0, 0, 0, 0);

                if (fromDate) {
                    const from = new Date(`${fromDate}T00:00:00`);

                    if (entryDate < from) {
                        return false;
                    }
                }

                if (toDate) {
                    const to = new Date(`${toDate}T23:59:59`);

                    if (entryDate > to) {
                        return false;
                    }
                }

                return true;
            })
            .sort(
                (a, b) =>
                    new Date(a.transactionDate).getTime() -
                    new Date(b.transactionDate).getTime()
            );
    }, [entries, fromDate, toDate, typeFilter]);

    const totalIncome = filteredEntries
        .filter(
            (entry) =>
                entry.type?.toLowerCase() === "income"
        )
        .reduce(
            (sum, entry) => sum + Number(entry.amount),
            0
        );

    const totalExpense = filteredEntries
        .filter(
            (entry) =>
                entry.type?.toLowerCase() === "expense"
        )
        .reduce(
            (sum, entry) => sum + Number(entry.amount),
            0
        );

    const currentBalance = totalIncome - totalExpense;

    let runningBalance = 0;

    const ledgerEntries = filteredEntries.map((entry) => {
        const amount = Number(entry.amount);

        if (entry.type?.toLowerCase() === "income") {
            runningBalance += amount;
        } else {
            runningBalance -= amount;
        }

        return {
            ...entry,
            runningBalance,
        };
    });

    function formatMoney(value: number) {
        return `৳ ${value.toLocaleString("en-BD", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    function formatDate(date: string) {
        return new Date(date).toLocaleDateString("en-GB");
    }

    function getReferenceLabel(entry: CashBookEntry) {
        if (!entry.referenceType) {
            return "Manual";
        }

        switch (entry.referenceType) {
            case "CustomerPayment":
                return "Customer Payment";

            case "SupplierPayment":
                return "Supplier Payment";

            case "Expense":
                return "Expense";

            default:
                return entry.referenceType;
        }
    }

    function clearFilters() {
        setFromDate("");
        setToDate("");
        setTypeFilter("All");
    }

    return (
        <div className="space-y-6">

            {/* ========================= */}
            {/* HEADER */}
            {/* ========================= */}

            <div>
                <h1 className="text-3xl font-bold text-slate-800">
                    Cash Book
                </h1>

                <p className="mt-1 text-slate-500">
                    Track all cash inflow and outflow of your business
                </p>
            </div>

            {/* ========================= */}
            {/* SUMMARY CARDS */}
            {/* ========================= */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-sm">
                    <p className="text-sm font-medium text-green-700">
                        Total Income
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-green-800">
                        {formatMoney(totalIncome)}
                    </h2>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
                    <p className="text-sm font-medium text-red-700">
                        Total Expense
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-red-800">
                        {formatMoney(totalExpense)}
                    </h2>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
                    <p className="text-sm font-medium text-blue-700">
                        Current Balance
                    </p>

                    <h2
                        className={`mt-2 text-3xl font-bold ${currentBalance >= 0
                                ? "text-blue-800"
                                : "text-red-700"
                            }`}
                    >
                        {formatMoney(currentBalance)}
                    </h2>
                </div>

            </div>

            {/* ========================= */}
            {/* FILTERS */}
            {/* ========================= */}

            <div className="rounded-2xl border bg-white p-6 shadow-sm">

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
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
                        <label className="mb-2 block text-sm font-medium text-slate-700">
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

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Transaction Type
                        </label>

                        <select
                            value={typeFilter}
                            onChange={(e) =>
                                setTypeFilter(e.target.value)
                            }
                            className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                        >
                            <option value="All">
                                All Transactions
                            </option>

                            <option value="Income">
                                Income
                            </option>

                            <option value="Expense">
                                Expense
                            </option>
                        </select>
                    </div>

                    <div className="flex items-end">

                        <button
                            onClick={clearFilters}
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-100"
                        >
                            Clear Filters
                        </button>

                    </div>

                </div>

            </div>

            {/* ========================= */}
            {/* CASH BOOK TABLE */}
            {/* ========================= */}

            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

                <div className="flex items-center justify-between border-b px-6 py-5">

                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            Cash Transactions
                        </h2>

                        <p className="text-sm text-slate-500">
                            {filteredEntries.length} transaction
                            {filteredEntries.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                </div>

                {loading ? (

                    <div className="py-16 text-center text-slate-500">
                        Loading cash book...
                    </div>

                ) : filteredEntries.length === 0 ? (

                    <div className="py-16 text-center">

                        <p className="text-lg font-medium text-slate-600">
                            No cash transactions found
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                            Cash transactions will appear here automatically.
                        </p>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="min-w-full">

                            <thead className="bg-slate-100">

                                <tr>

                                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                                        Date
                                    </th>

                                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-700">
                                        Particular
                                    </th>

                                    <th className="px-5 py-4 text-center text-sm font-semibold text-slate-700">
                                        Type
                                    </th>

                                    <th className="px-5 py-4 text-right text-sm font-semibold text-slate-700">
                                        Income
                                    </th>

                                    <th className="px-5 py-4 text-right text-sm font-semibold text-slate-700">
                                        Expense
                                    </th>

                                    <th className="px-5 py-4 text-right text-sm font-semibold text-slate-700">
                                        Balance
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {ledgerEntries.map((entry) => {

                                    const isIncome =
                                        entry.type?.toLowerCase() ===
                                        "income";

                                    return (
                                        <tr
                                            key={entry.id}
                                            className="border-t hover:bg-slate-50"
                                        >

                                            <td className="whitespace-nowrap px-5 py-4 text-sm">
                                                {formatDate(
                                                    entry.transactionDate
                                                )}
                                            </td>

                                            <td className="px-5 py-4">

                                                <p className="font-medium text-slate-800">
                                                    {entry.description ||
                                                        "Cash Transaction"}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    {getReferenceLabel(
                                                        entry
                                                    )}
                                                    {entry.referenceId
                                                        ? ` #${entry.referenceId}`
                                                        : ""}
                                                </p>

                                            </td>

                                            <td className="px-5 py-4 text-center">

                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isIncome
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {isIncome
                                                        ? "Income"
                                                        : "Expense"}
                                                </span>

                                            </td>

                                            <td className="px-5 py-4 text-right font-semibold text-green-700">
                                                {isIncome
                                                    ? formatMoney(
                                                        Number(
                                                            entry.amount
                                                        )
                                                    )
                                                    : "-"}
                                            </td>

                                            <td className="px-5 py-4 text-right font-semibold text-red-700">
                                                {!isIncome
                                                    ? formatMoney(
                                                        Number(
                                                            entry.amount
                                                        )
                                                    )
                                                    : "-"}
                                            </td>

                                            <td className="px-5 py-4 text-right font-bold text-slate-800">
                                                {formatMoney(
                                                    entry.runningBalance
                                                )}
                                            </td>

                                        </tr>
                                    );
                                })}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    );
}