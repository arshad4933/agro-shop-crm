"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";

type Purchase = {
    id: number;
    purchaseDate?: string | null;
    invoiceNumber?: string | null;
    purchaseNumber?: string | null;
    invoiceNo?: string | null;

    totalAmount?: number | string | null;
    total?: number | string | null;
    grandTotal?: number | string | null;

    paidAmount?: number | string | null;
    dueAmount?: number | string | null;
};

type SupplierPayment = {
    id: number;
    supplierId: number;
    amount: number | string;
    paymentMethod: string;
    paymentDate: string;
    note?: string | null;
};

type PurchaseReturnItem = {
    id: number;
    quantity: number;
    buyPrice: number | string;
    totalPrice: number | string;

    batch?: {
        product?: {
            name: string;
        };
    };
};

type PurchaseReturn = {
    id: number;
    purchaseId: number;
    supplierId: number;

    returnDate: string;

    totalAmount: number | string;
    cashReceived: number | string;
    adjustedDue: number | string;

    reason?: string | null;

    purchase?: {
        purchaseNo: string;
    };

    items?: PurchaseReturnItem[];
};


type Supplier = {
    id: number;
    name: string;
    company?: string | null;
    phone: string;
    email?: string | null;
    address?: string | null;
    openingDue: number | string;
    isActive: boolean;

    purchases?: Purchase[];
    supplierPayments?: SupplierPayment[];
    purchaseReturns?: PurchaseReturn[];
};

export default function SupplierDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const supplierId = params.id;

    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [loading, setLoading] = useState(true);
    const [printing, setPrinting] = useState(false);

    // ======================================
    // LOAD SUPPLIER
    // ======================================

    async function loadSupplier() {
        try {
            setLoading(true);

            const response = await axios.get(
                `/api/supplier/${supplierId}`
            );

            setSupplier(response.data);
        } catch (error: any) {
            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                "Failed to load supplier"
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (supplierId) {
            loadSupplier();
        }
    }, [supplierId]);

    // ======================================
    // PRINT
    // ======================================

    function handlePrint() {
        setPrinting(true);

        setTimeout(() => {
            window.print();
            setPrinting(false);
        }, 150);
    }

    // ======================================
    // LOADING
    // ======================================

    if (loading) {
        return (
            <div className="flex min-h-[500px] items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl">⏳</div>

                    <p className="mt-3 text-slate-500">
                        Loading supplier details...
                    </p>
                </div>
            </div>
        );
    }

    // ======================================
    // NOT FOUND
    // ======================================

    if (!supplier) {
        return (
            <div className="flex min-h-[500px] items-center justify-center">
                <div className="rounded-2xl bg-white p-10 text-center shadow">
                    <div className="text-5xl">❌</div>

                    <h2 className="mt-4 text-2xl font-bold text-slate-800">
                        Supplier Not Found
                    </h2>

                    <p className="mt-2 text-slate-500">
                        The supplier you are looking for does not exist.
                    </p>

                    <button
                        type="button"
                        onClick={() => router.push("/supplier")}
                        className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
                    >
                        ← Back to Suppliers
                    </button>
                </div>
            </div>
        );
    }

    // ======================================
    // DATA
    // ======================================

    const purchases = supplier.purchases || [];
    const duePayments = supplier.supplierPayments || [];

    const purchaseReturns = supplier.purchaseReturns || [];


    const totalPurchaseReturn = purchaseReturns.reduce(
        (sum, purchaseReturn) => {
            return (
                sum +
                Number(purchaseReturn.totalAmount || 0)
            );
        },
        0
    );

    const totalReturnCashReceived = purchaseReturns.reduce(
        (sum, purchaseReturn) => {
            return (
                sum +
                Number(purchaseReturn.cashReceived || 0)
            );
        },
        0
    );

    const totalReturnDueAdjusted = purchaseReturns.reduce(
        (sum, purchaseReturn) => {
            return (
                sum +
                Number(purchaseReturn.adjustedDue || 0)
            );
        },
        0
    );

    // ======================================
    // MONEY FORMAT
    // ======================================

    function money(
        value: number | string | null | undefined
    ) {
        return Number(value || 0).toLocaleString("en-BD", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    // ======================================
    // DATE FORMAT
    // ======================================

    function formatDate(value: string | null | undefined) {
        if (!value) {
            return "-";
        }

        const date = new Date(value);

        if (isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleDateString("en-BD");
    }

    // ======================================
    // TOTAL PURCHASE
    // ======================================

    const totalPurchase = purchases.reduce(
        (sum, purchase) => {
            return (
                sum +
                Number(
                    purchase.totalAmount ??
                    purchase.total ??
                    purchase.grandTotal ??
                    0
                )
            );
        },
        0
    );

    // ======================================
    // PURCHASE-TIME PAID
    // ======================================

    const purchaseTimePaid = purchases.reduce(
        (sum, purchase) => {
            return (
                sum +
                Number(purchase.paidAmount || 0)
            );
        },
        0
    );

    // ======================================
    // LATER DUE PAYMENTS
    // ======================================

    const totalDuePayment = duePayments.reduce(
        (sum, payment) => {
            return (
                sum +
                Number(payment.amount || 0)
            );
        },
        0
    );

    // ======================================
    // TOTAL PAID
    // ======================================

    const totalPaid =
        purchaseTimePaid + totalDuePayment;

    // ======================================
    // OPENING DUE
    // ======================================

    const openingDue =
        Number(supplier.openingDue || 0);

    // ======================================
    // CURRENT PURCHASE DUE
    // ======================================

    const currentPurchaseDue = purchases.reduce(
        (sum, purchase) => {
            return (
                sum +
                Number(purchase.dueAmount || 0)
            );
        },
        0
    );



    // ======================================
    // CURRENT DUE
    // ======================================

    const currentDue =
        openingDue + currentPurchaseDue;

    return (
        <>
            {/* =========================================
                PRINT STYLE
            ========================================== */}

            <style jsx global>{`
    @media print {
        /* =====================================
           HIDE EVERYTHING EXCEPT PRINT AREA
        ===================================== */

        body * {
            visibility: hidden !important;
        }

        .print-area,
        .print-area * {
            visibility: visible !important;
        }

        /* =====================================
           REMOVE SIDEBAR / MAIN LAYOUT EFFECT
        ===================================== */

        .print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;

            width: 100% !important;
            max-width: none !important;

            margin: 0 !important;
            padding: 0 !important;
        }

        /* =====================================
           BODY
        ===================================== */

        html,
        body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        body {
            font-size: 11px !important;
        }

        /* =====================================
           HIDE BUTTONS / SCREEN ONLY ELEMENTS
        ===================================== */

        .no-print {
            display: none !important;
        }

        /* =====================================
           PRINT CARDS
        ===================================== */

        .print-card {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
        }

        /* =====================================
           SUMMARY CARDS
        ===================================== */

        .print-summary {
            display: grid !important;
            grid-template-columns: repeat(
                4,
                minmax(0, 1fr)
            ) !important;

            gap: 8px !important;
        }

        /* =====================================
           TABLE
        ===================================== */

        table {
            width: 100% !important;
            min-width: 0 !important;
            border-collapse: collapse !important;
        }

        th,
        td {
            border-bottom: 1px solid #cbd5e1 !important;
            padding: 7px 8px !important;
        }

        thead {
            display: table-header-group !important;
        }

        tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
        }

        /* =====================================
           SECTIONS
        ===================================== */

        .print-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
        }

        /* =====================================
           REMOVE SCREEN SPACING
        ===================================== */

        .space-y-6 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 12px !important;
        }

        /* =====================================
           PRINT PAGE
        ===================================== */

        @page {
            size: A4;
            margin: 12mm;
        }
    }
`}</style>

            <div className="print-area mx-auto max-w-6xl space-y-6">

                {/* =========================================
                    SCREEN HEADER
                ========================================== */}

                <div className="no-print flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">
                            🚚 Supplier Details
                        </h1>

                        <p className="mt-1 text-slate-500">
                            Complete supplier account information
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                router.push("/supplier")
                            }
                            className="rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-300"
                        >
                            ← Back
                        </button>

                        <button
                            type="button"
                            onClick={handlePrint}
                            disabled={printing}
                            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            🖨️{" "}
                            {printing
                                ? "Preparing..."
                                : "Print Details"}
                        </button>
                    </div>
                </div>

                {/* =========================================
                    PRINT HEADER
                ========================================== */}

                <div className="hidden print:block">
                    <div className="border-b-2 border-slate-800 pb-4 text-center">
                        <h1 className="text-2xl font-bold text-slate-900">
                            SUPPLIER ACCOUNT STATEMENT
                        </h1>

                        <p className="mt-1 text-sm text-slate-600">
                            Agro Shop CRM
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Printed:{" "}
                            {new Date().toLocaleDateString(
                                "en-BD"
                            )}
                        </p>
                    </div>
                </div>

                {/* =========================================
                    SUPPLIER INFORMATION
                ========================================== */}

                <div className="print-card print-section rounded-2xl bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-start justify-between border-b pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                {supplier.name}
                            </h2>

                            {supplier.company && (
                                <p className="mt-1 text-slate-500">
                                    {supplier.company}
                                </p>
                            )}
                        </div>

                        {supplier.isActive ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                                🟢 Active
                            </span>
                        ) : (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                                🔴 Inactive
                            </span>
                        )}
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <p className="text-xs font-medium uppercase text-slate-400">
                                Supplier Name
                            </p>

                            <p className="mt-1 font-semibold text-slate-800">
                                {supplier.name}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase text-slate-400">
                                Company
                            </p>

                            <p className="mt-1 font-semibold text-slate-800">
                                {supplier.company || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase text-slate-400">
                                Phone
                            </p>

                            <p className="mt-1 font-semibold text-slate-800">
                                {supplier.phone}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium uppercase text-slate-400">
                                Email
                            </p>

                            <p className="mt-1 font-semibold text-slate-800">
                                {supplier.email || "-"}
                            </p>
                        </div>

                        <div className="md:col-span-2">
                            <p className="text-xs font-medium uppercase text-slate-400">
                                Address
                            </p>

                            <p className="mt-1 font-semibold text-slate-800">
                                {supplier.address || "-"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* =========================================
                    ACCOUNT SUMMARY
                ========================================== */}

                <div className="print-summary grid gap-4 md:grid-cols-4">

                    {/* OPENING DUE */}

                    <div className="print-card rounded-2xl border bg-white p-5 shadow-sm">
                        <p className="text-xs font-medium uppercase text-slate-400">
                            Opening Due
                        </p>

                        <p className="mt-2 text-xl font-bold text-orange-600">
                            ৳ {money(openingDue)}
                        </p>
                    </div>

                    {/* TOTAL PURCHASE */}

                    <div className="print-card rounded-2xl border bg-white p-5 shadow-sm">
                        <p className="text-xs font-medium uppercase text-slate-400">
                            Total Purchase
                        </p>

                        <p className="mt-2 text-xl font-bold text-slate-800">
                            ৳ {money(totalPurchase)}
                        </p>
                    </div>

                    {/* PURCHASE-TIME PAID */}

                    <div className="print-card rounded-2xl border bg-white p-5 shadow-sm">
                        <p className="text-xs font-medium uppercase text-slate-400">
                            Purchase-time Paid
                        </p>

                        <p className="mt-2 text-xl font-bold text-blue-600">
                            ৳ {money(purchaseTimePaid)}
                        </p>
                    </div>

                    {/* DUE PAYMENT */}

                    <div className="print-card rounded-2xl border bg-white p-5 shadow-sm">
                        <p className="text-xs font-medium uppercase text-slate-400">
                            Due Payment
                        </p>

                        <p className="mt-2 text-xl font-bold text-green-600">
                            ৳ {money(totalDuePayment)}
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">

                    <div className="print-card rounded-2xl border bg-orange-50 p-5 shadow-sm">

                        <p className="text-sm font-semibold text-orange-600">
                            Total Purchase Return
                        </p>

                        <p className="mt-2 text-2xl font-bold text-orange-700">
                            ৳ {money(totalPurchaseReturn)}
                        </p>

                    </div>

                    <div className="print-card rounded-2xl border bg-green-50 p-5 shadow-sm">

                        <p className="text-sm font-semibold text-green-600">
                            Return Cash Received
                        </p>

                        <p className="mt-2 text-2xl font-bold text-green-700">
                            ৳ {money(totalReturnCashReceived)}
                        </p>

                    </div>

                    <div className="print-card rounded-2xl border bg-blue-50 p-5 shadow-sm">

                        <p className="text-sm font-semibold text-blue-600">
                            Return Due Adjusted
                        </p>

                        <p className="mt-2 text-2xl font-bold text-blue-700">
                            ৳ {money(totalReturnDueAdjusted)}
                        </p>

                    </div>

                </div>

                {/* =========================================
                    TOTAL PAID + CURRENT DUE
                ========================================== */}

                <div className="grid gap-4 md:grid-cols-2">

                    {/* TOTAL PAID */}

                    <div className="print-card rounded-2xl border bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-500">
                            Total Paid
                        </p>

                        <p className="mt-2 text-3xl font-bold text-green-600">
                            ৳ {money(totalPaid)}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                            Purchase-time Paid + Due Payment
                        </p>
                    </div>

                    {/* CURRENT DUE */}

                    <div className="print-card rounded-2xl border bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-slate-500">
                            Current Due
                        </p>

                        <p className="mt-2 text-3xl font-bold text-red-600">
                            ৳ {money(currentDue)}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                            Remaining amount payable to supplier
                        </p>
                    </div>
                </div>

                {/* =========================================
                    PURCHASE HISTORY
                ========================================== */}

                <div className="print-card print-section overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="border-b p-5">
                        <h2 className="text-xl font-bold text-slate-800">
                            🧾 Purchase History
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Purchase records and payment status
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px]">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="px-5 py-3 text-left text-sm">
                                        Date
                                    </th>

                                    <th className="px-5 py-3 text-left text-sm">
                                        Invoice
                                    </th>

                                    <th className="px-5 py-3 text-right text-sm">
                                        Total
                                    </th>

                                    <th className="px-5 py-3 text-right text-sm">
                                        Paid
                                    </th>

                                    <th className="px-5 py-3 text-right text-sm">
                                        Due
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {purchases.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-slate-400"
                                        >
                                            No purchase records found.
                                        </td>
                                    </tr>
                                ) : (
                                    purchases.map(
                                        (purchase, index) => {
                                            const total =
                                                Number(
                                                    purchase.totalAmount ??
                                                    purchase.total ??
                                                    purchase.grandTotal ??
                                                    0
                                                );

                                            const paid =
                                                Number(
                                                    purchase.paidAmount || 0
                                                );

                                            const due =
                                                Number(
                                                    purchase.dueAmount || 0
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        purchase.id ||
                                                        index
                                                    }
                                                    className="border-t"
                                                >
                                                    <td className="px-5 py-4">
                                                        {formatDate(
                                                            purchase.purchaseDate
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4 font-semibold">
                                                        {purchase.invoiceNumber ||
                                                            purchase.purchaseNumber ||
                                                            purchase.invoiceNo ||
                                                            `Purchase #${purchase.id}`}
                                                    </td>

                                                    <td className="px-5 py-4 text-right">
                                                        ৳ {money(total)}
                                                    </td>

                                                    <td className="px-5 py-4 text-right font-semibold text-green-600">
                                                        ৳ {money(paid)}
                                                    </td>

                                                    <td className="px-5 py-4 text-right font-bold text-red-600">
                                                        ৳ {money(due)}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* =========================================
                    DUE PAYMENT HISTORY
                ========================================== */}

                <div className="print-card print-section overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="border-b p-5">
                        <h2 className="text-xl font-bold text-slate-800">
                            💸 Due Payment History
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Payments made later against outstanding supplier dues
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px]">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="px-5 py-3 text-left text-sm">
                                        Date
                                    </th>

                                    <th className="px-5 py-3 text-left text-sm">
                                        Payment
                                    </th>

                                    <th className="px-5 py-3 text-left text-sm">
                                        Payment Method
                                    </th>

                                    <th className="px-5 py-3 text-right text-sm">
                                        Amount
                                    </th>

                                    <th className="px-5 py-3 text-left text-sm">
                                        Note
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {duePayments.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-slate-400"
                                        >
                                            No due payment records found.
                                        </td>
                                    </tr>
                                ) : (
                                    duePayments.map(
                                        (payment, index) => (
                                            <tr
                                                key={
                                                    payment.id ||
                                                    index
                                                }
                                                className="border-t"
                                            >
                                                <td className="px-5 py-4">
                                                    {formatDate(
                                                        payment.paymentDate
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="font-semibold text-green-700">
                                                        Due Payment #
                                                        {payment.id}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">
                                                        {
                                                            payment.paymentMethod
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-right font-bold text-green-600">
                                                    ৳{" "}
                                                    {money(
                                                        payment.amount
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-slate-500">
                                                    {payment.note || "-"}
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>






                {/* =========================================
    PURCHASE RETURN HISTORY
========================================== */}

                <div className="print-card print-section overflow-hidden rounded-2xl bg-white shadow-sm">

                    <div className="border-b p-5">

                        <h2 className="text-xl font-bold text-slate-800">
                            🔄 Purchase Return History
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Products returned to this supplier and corresponding financial adjustments
                        </p>

                    </div>

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[950px]">

                            <thead className="bg-slate-100">

                                <tr>

                                    <th className="px-5 py-3 text-left text-sm">
                                        Date
                                    </th>

                                    <th className="px-5 py-3 text-left text-sm">
                                        Return #
                                    </th>

                                    <th className="px-5 py-3 text-left text-sm">
                                        Purchase No
                                    </th>

                                    <th className="px-5 py-3 text-right text-sm">
                                        Return Amount
                                    </th>

                                    <th className="px-5 py-3 text-right text-sm">
                                        Cash Received
                                    </th>

                                    <th className="px-5 py-3 text-right text-sm">
                                        Due Adjusted
                                    </th>

                                    <th className="px-5 py-3 text-left text-sm">
                                        Reason
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {purchaseReturns.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan={7}
                                            className="py-8 text-center text-slate-400"
                                        >
                                            No purchase return records found.
                                        </td>

                                    </tr>

                                ) : (

                                    purchaseReturns.map(
                                        (purchaseReturn) => (

                                            <tr
                                                key={purchaseReturn.id}
                                                className="border-t"
                                            >

                                                {/* DATE */}

                                                <td className="px-5 py-4">

                                                    {formatDate(
                                                        purchaseReturn.returnDate
                                                    )}

                                                </td>


                                                {/* RETURN NUMBER */}

                                                <td className="px-5 py-4">

                                                    <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">

                                                        Return #
                                                        {purchaseReturn.id}

                                                    </span>

                                                </td>


                                                {/* PURCHASE NUMBER */}

                                                <td className="px-5 py-4 font-semibold">

                                                    {purchaseReturn.purchase?.purchaseNo ||
                                                        `Purchase #${purchaseReturn.purchaseId}`}

                                                </td>


                                                {/* RETURN AMOUNT */}

                                                <td className="px-5 py-4 text-right font-bold text-orange-600">

                                                    ৳{" "}
                                                    {money(
                                                        purchaseReturn.totalAmount
                                                    )}

                                                </td>


                                                {/* CASH RECEIVED */}

                                                <td className="px-5 py-4 text-right font-semibold text-green-600">

                                                    ৳{" "}
                                                    {money(
                                                        purchaseReturn.cashReceived
                                                    )}

                                                </td>


                                                {/* DUE ADJUSTED */}

                                                <td className="px-5 py-4 text-right font-semibold text-blue-600">

                                                    ৳{" "}
                                                    {money(
                                                        purchaseReturn.adjustedDue
                                                    )}

                                                </td>


                                                {/* REASON */}

                                                <td className="px-5 py-4 text-slate-500">

                                                    {purchaseReturn.reason || "-"}

                                                </td>

                                            </tr>

                                        )
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

                {/* =========================================
                    ACCOUNT RECONCILIATION
                ========================================== */}

                <div className="print-card print-section rounded-2xl border bg-slate-50 p-5">
                    <h2 className="mb-4 text-lg font-bold text-slate-800">
                        📊 Account Reconciliation
                    </h2>

                    <div className="space-y-2 text-sm">

                        <div className="flex justify-between">
                            <span>Total Purchase</span>

                            <span className="font-semibold">
                                ৳ {money(totalPurchase)}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span>Purchase-time Paid</span>

                            <span className="font-semibold text-blue-600">
                                - ৳ {money(purchaseTimePaid)}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span>Due Payment</span>

                            <span className="font-semibold text-green-600">
                                - ৳ {money(totalDuePayment)}
                            </span>
                        </div>

                        <div className="border-t pt-3">
                            <div className="flex justify-between text-base font-bold">
                                <span>
                                    Current Purchase Due
                                </span>

                                <span className="text-red-600">
                                    ৳ {money(currentPurchaseDue)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =========================================
                    FOOTER
                ========================================== */}

                <div className="border-t pt-5 text-center text-xs text-slate-400">
                    <p>Supplier Account Statement</p>

                    <p className="mt-1">
                        Generated by Agro Shop CRM
                    </p>
                </div>
            </div>
        </>
    );
}