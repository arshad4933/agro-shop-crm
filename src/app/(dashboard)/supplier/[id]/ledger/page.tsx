"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";

type Supplier = {
    id: number;
    name: string;
    company?: string | null;
    phone: string;
    email?: string | null;
    address?: string | null;
};

type LedgerEntry = {
    id: string;
    date: string;
    type: "OPENING" | "PURCHASE" | "PAYMENT";
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    paymentMethod?: string;
    purchaseId?: number;
    supplierPaymentId?: number;
};

type LedgerResponse = {
    supplier: Supplier;

    summary: {
        openingDue: number;
        totalPurchase: number;
        totalInitialPaid: number;
        totalAllocatedPayments: number;
        totalUnallocatedPayments: number;
        totalSupplierPayments: number;
        calculatedBalance: number;
    };

    ledger: LedgerEntry[];
};

function money(value: number) {
    return Number(value || 0).toLocaleString(
        "en-BD",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    );
}

function dateFormat(date: string) {
    return new Date(date).toLocaleDateString(
        "en-BD",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}

export default function SupplierLedgerPage() {
    const params = useParams();
    const router = useRouter();

    const supplierId = params.id;

    const [data, setData] =
        useState<LedgerResponse | null>(null);

    const [loading, setLoading] =
        useState(true);

    async function loadLedger() {
        try {
            setLoading(true);

            const response = await axios.get(
                `/api/supplier/${supplierId}/ledger`
            );

            setData(response.data);
        } catch (error) {
            console.error(error);

            toast.error(
                "Failed to load supplier ledger"
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (supplierId) {
            loadLedger();
        }
    }, [supplierId]);

    function handlePrint() {
        window.print();
    }

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <p className="text-slate-500">
                    Loading supplier account ledger...
                </p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <p className="text-red-500">
                    Supplier ledger could not be loaded.
                </p>

                <button
                    onClick={() =>
                        router.back()
                    }
                    className="mt-4 rounded-xl bg-slate-800 px-5 py-2 text-white"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const { supplier, summary, ledger } =
        data;

    return (
        <>
            {/* ================================================== */}
            {/* SCREEN PAGE */}
            {/* ================================================== */}

            <div className="space-y-6 print:hidden">
                {/* HEADER */}

                <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div>
                        <button
                            onClick={() =>
                                router.back()
                            }
                            className="mb-3 text-sm font-medium text-slate-500 hover:text-slate-800"
                        >
                            ← Back
                        </button>

                        <h1 className="text-3xl font-bold text-slate-800">
                            Supplier Account Ledger
                        </h1>

                        <p className="mt-1 text-slate-500">
                            Complete transaction history
                            of this supplier
                        </p>
                    </div>

                    <button
                        onClick={handlePrint}
                        className="rounded-xl bg-slate-800 px-6 py-3 font-semibold text-white hover:bg-slate-900"
                    >
                        🖨️ Print Ledger
                    </button>
                </div>

                {/* SUPPLIER INFO */}

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <p className="text-sm text-slate-500">
                                Supplier
                            </p>

                            <p className="mt-1 text-xl font-bold text-slate-800">
                                {supplier.name}
                            </p>

                            {supplier.company && (
                                <p className="text-sm text-slate-500">
                                    {supplier.company}
                                </p>
                            )}
                        </div>

                        <div>
                            <p className="text-sm text-slate-500">
                                Contact
                            </p>

                            <p className="mt-1 font-semibold text-slate-700">
                                {supplier.phone}
                            </p>

                            {supplier.address && (
                                <p className="text-sm text-slate-500">
                                    {supplier.address}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* SUMMARY */}

                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Opening Due
                        </p>

                        <p className="mt-2 text-xl font-bold text-red-600">
                            ৳ {money(summary.openingDue)}
                        </p>
                    </div>

                    <div className="rounded-2xl border bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Total Purchase
                        </p>

                        <p className="mt-2 text-xl font-bold text-slate-800">
                            ৳ {money(summary.totalPurchase)}
                        </p>
                    </div>

                    <div className="rounded-2xl border bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Total Paid
                        </p>

                        <p className="mt-2 text-xl font-bold text-green-600">
                            ৳{" "}
                            {money(
                                summary.totalSupplierPayments
                            )}
                        </p>
                    </div>

                    <div className="rounded-2xl border bg-red-50 p-5 shadow-sm">
                        <p className="text-sm text-red-500">
                            Current Balance Due
                        </p>

                        <p className="mt-2 text-xl font-bold text-red-600">
                            ৳{" "}
                            {money(
                                summary.calculatedBalance
                            )}
                        </p>
                    </div>
                </div>

                {/* LEDGER TABLE */}

                <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="border-b p-5">
                        <h2 className="text-xl font-bold text-slate-800">
                            Account Transactions
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Debit increases payable. Credit
                            represents payment made to supplier.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px]">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="px-5 py-4 text-left text-sm font-semibold">
                                        Date
                                    </th>

                                    <th className="px-5 py-4 text-left text-sm font-semibold">
                                        Reference
                                    </th>

                                    <th className="px-5 py-4 text-left text-sm font-semibold">
                                        Description
                                    </th>

                                    <th className="px-5 py-4 text-right text-sm font-semibold">
                                        Debit
                                    </th>

                                    <th className="px-5 py-4 text-right text-sm font-semibold">
                                        Credit
                                    </th>

                                    <th className="px-5 py-4 text-right text-sm font-semibold">
                                        Balance
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {ledger.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-12 text-center text-slate-400"
                                        >
                                            No transactions found.
                                        </td>
                                    </tr>
                                ) : (
                                    ledger.map(
                                        (entry) => (
                                            <tr
                                                key={entry.id}
                                                className="border-t hover:bg-slate-50"
                                            >
                                                <td className="px-5 py-4 text-sm">
                                                    {dateFormat(
                                                        entry.date
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={
                                                            entry.type ===
                                                                "PURCHASE"
                                                                ? "rounded-lg bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700"
                                                                : entry.type ===
                                                                    "PAYMENT"
                                                                    ? "rounded-lg bg-green-50 px-3 py-1 text-sm font-semibold text-green-700"
                                                                    : "rounded-lg bg-red-50 px-3 py-1 text-sm font-semibold text-red-700"
                                                        }
                                                    >
                                                        {
                                                            entry.reference
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="font-medium text-slate-700">
                                                        {
                                                            entry.description
                                                        }
                                                    </div>

                                                    {entry.paymentMethod && (
                                                        <div className="mt-1 text-xs text-slate-400">
                                                            Method:{" "}
                                                            {
                                                                entry.paymentMethod
                                                            }
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-right font-semibold text-red-600">
                                                    {entry.debit >
                                                        0
                                                        ? `৳ ${money(
                                                            entry.debit
                                                        )}`
                                                        : "-"}
                                                </td>

                                                <td className="px-5 py-4 text-right font-semibold text-green-600">
                                                    {entry.credit >
                                                        0
                                                        ? `৳ ${money(
                                                            entry.credit
                                                        )}`
                                                        : "-"}
                                                </td>

                                                <td className="px-5 py-4 text-right font-bold text-slate-800">
                                                    ৳{" "}
                                                    {money(
                                                        entry.balance
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>

                            <tfoot className="bg-slate-50">
                                <tr>
                                    <td
                                        colSpan={3}
                                        className="px-5 py-4 text-right font-bold"
                                    >
                                        Total
                                    </td>

                                    <td className="px-5 py-4 text-right font-bold text-red-600">
                                        ৳{" "}
                                        {money(
                                            ledger.reduce(
                                                (
                                                    sum,
                                                    item
                                                ) =>
                                                    sum +
                                                    item.debit,
                                                0
                                            )
                                        )}
                                    </td>

                                    <td className="px-5 py-4 text-right font-bold text-green-600">
                                        ৳{" "}
                                        {money(
                                            ledger.reduce(
                                                (
                                                    sum,
                                                    item
                                                ) =>
                                                    sum +
                                                    item.credit,
                                                0
                                            )
                                        )}
                                    </td>

                                    <td className="px-5 py-4 text-right font-bold text-slate-800">
                                        ৳{" "}
                                        {money(
                                            summary.calculatedBalance
                                        )}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* ================================================== */}
            {/* PRINT ONLY */}
            {/* ================================================== */}

            <div className="hidden print:block">
                <div className="mx-auto max-w-5xl bg-white p-8 text-black">
                    {/* SHOP / DOCUMENT HEADER */}

                    <div className="border-b-2 border-black pb-5 text-center">
                        <h1 className="text-2xl font-bold">
                            SUPPLIER ACCOUNT LEDGER
                        </h1>

                        <p className="mt-2 text-lg font-semibold">
                            {supplier.name}
                        </p>

                        {supplier.company && (
                            <p className="text-sm">
                                {supplier.company}
                            </p>
                        )}

                        <p className="mt-1 text-sm">
                            Phone: {supplier.phone}
                        </p>

                        {supplier.address && (
                            <p className="text-sm">
                                {supplier.address}
                            </p>
                        )}
                    </div>

                    {/* PRINT SUMMARY */}

                    <div className="mt-6 grid grid-cols-4 gap-4">
                        <div className="border p-3">
                            <p className="text-xs">
                                Opening Due
                            </p>

                            <p className="mt-1 font-bold">
                                ৳{" "}
                                {money(
                                    summary.openingDue
                                )}
                            </p>
                        </div>

                        <div className="border p-3">
                            <p className="text-xs">
                                Total Purchase
                            </p>

                            <p className="mt-1 font-bold">
                                ৳{" "}
                                {money(
                                    summary.totalPurchase
                                )}
                            </p>
                        </div>

                        <div className="border p-3">
                            <p className="text-xs">
                                Total Paid
                            </p>

                            <p className="mt-1 font-bold">
                                ৳{" "}
                                {money(
                                    summary.totalSupplierPayments
                                )}
                            </p>
                        </div>

                        <div className="border p-3">
                            <p className="text-xs">
                                Balance Due
                            </p>

                            <p className="mt-1 font-bold">
                                ৳{" "}
                                {money(
                                    summary.calculatedBalance
                                )}
                            </p>
                        </div>
                    </div>

                    {/* PRINT TABLE */}

                    <table className="mt-8 w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                <th className="border border-black p-2 text-left">
                                    Date
                                </th>

                                <th className="border border-black p-2 text-left">
                                    Reference
                                </th>

                                <th className="border border-black p-2 text-left">
                                    Description
                                </th>

                                <th className="border border-black p-2 text-right">
                                    Debit
                                </th>

                                <th className="border border-black p-2 text-right">
                                    Credit
                                </th>

                                <th className="border border-black p-2 text-right">
                                    Balance
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {ledger.map(
                                (entry) => (
                                    <tr
                                        key={`print-${entry.id}`}
                                    >
                                        <td className="border border-black p-2">
                                            {dateFormat(
                                                entry.date
                                            )}
                                        </td>

                                        <td className="border border-black p-2">
                                            {
                                                entry.reference
                                            }
                                        </td>

                                        <td className="border border-black p-2">
                                            {
                                                entry.description
                                            }

                                            {entry.paymentMethod &&
                                                ` (${entry.paymentMethod})`}
                                        </td>

                                        <td className="border border-black p-2 text-right">
                                            {entry.debit >
                                                0
                                                ? money(
                                                    entry.debit
                                                )
                                                : "-"}
                                        </td>

                                        <td className="border border-black p-2 text-right">
                                            {entry.credit >
                                                0
                                                ? money(
                                                    entry.credit
                                                )
                                                : "-"}
                                        </td>

                                        <td className="border border-black p-2 text-right font-bold">
                                            {money(
                                                entry.balance
                                            )}
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>

                    <div className="mt-8 flex justify-between border-t pt-4 text-sm">
                        <span>
                            Generated:{" "}
                            {new Date().toLocaleString(
                                "en-BD"
                            )}
                        </span>

                        <span className="font-bold">
                            Current Due: ৳{" "}
                            {money(
                                summary.calculatedBalance
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* ================================================== */}
            {/* PRINT CSS */}
            {/* ================================================== */}

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 12mm;
                    }

                    body {
                        background: white !important;
                    }

                    body * {
                        visibility: hidden;
                    }

                    .print\\:block,
                    .print\\:block * {
                        visibility: visible;
                    }

                    .print\\:block {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </>
    );
}