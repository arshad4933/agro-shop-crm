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
    openingDue: number | string;
    isActive: boolean;
    batches?: any[];
    purchases?: any[];
    supplierPayments?: any[];
};

export default function SupplierDetailsPage() {
    const params = useParams();
    const router = useRouter();

    const supplierId = params.id;

    const [supplier, setSupplier] =
        useState<Supplier | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [printing, setPrinting] =
        useState(false);

    // ==========================================
    // LOAD SUPPLIER
    // ==========================================

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

    // ==========================================
    // PRINT
    // ==========================================

    function handlePrint() {
        setPrinting(true);

        setTimeout(() => {
            window.print();
            setPrinting(false);
        }, 200);
    }

    // ==========================================
    // MONEY FORMAT
    // ==========================================

    function money(value: number | string) {
        return Number(value || 0).toLocaleString(
            "en-BD",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        );
    }

    // ==========================================
    // DATE FORMAT
    // ==========================================

    function formatDate(value: any) {
        if (!value) return "-";

        const d = new Date(value);

        if (isNaN(d.getTime())) {
            return "-";
        }

        return d.toLocaleDateString("en-BD", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl">
                        ⏳
                    </div>

                    <p className="mt-3 text-slate-500">
                        Loading supplier details...
                    </p>
                </div>
            </div>
        );
    }

    // ==========================================
    // NOT FOUND
    // ==========================================

    if (!supplier) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="rounded-2xl bg-white p-10 text-center shadow">
                    <div className="text-5xl">
                        ❌
                    </div>

                    <h2 className="mt-4 text-2xl font-bold text-slate-800">
                        Supplier Not Found
                    </h2>

                    <p className="mt-2 text-slate-500">
                        The supplier you are looking for
                        does not exist.
                    </p>

                    <button
                        onClick={() =>
                            router.push("/supplier")
                        }
                        className="mt-6 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
                    >
                        ← Back to Suppliers
                    </button>
                </div>
            </div>
        );
    }

    // ==========================================
    // DATA
    // ==========================================

    const purchases =
        supplier.purchases || [];

    const payments =
        supplier.supplierPayments || [];

    // ==========================================
    // TOTAL PURCHASE
    // ==========================================

    const totalPurchase =
        purchases.reduce(
            (sum, purchase) =>
                sum +
                Number(
                    purchase.totalAmount ??
                    purchase.total ??
                    purchase.grandTotal ??
                    0
                ),
            0
        );

    // ==========================================
    // TOTAL PAID
    // ==========================================

    const totalPaid =
        payments.reduce(
            (sum, payment) =>
                sum +
                Number(payment.amount || 0),
            0
        );

    // ==========================================
    // PURCHASE DUE
    // ==========================================

    const totalPurchaseDue =
        purchases.reduce(
            (sum, purchase) =>
                sum +
                Number(
                    purchase.dueAmount || 0
                ),
            0
        );

    // ==========================================
    // OPENING DUE
    // ==========================================

    const openingDue =
        Number(supplier.openingDue || 0);

    // ==========================================
    // CURRENT DUE
    // ==========================================

    const currentDue =
        openingDue + totalPurchaseDue;

    return (
        <>
            {/* ==================================================
                PRINT CSS
            ================================================== */}

            <style jsx global>{`
                @media print {

                    @page {
                        size: A4;
                        margin: 10mm;
                    }

                    html,
                    body {
                        width: 210mm;
                        min-height: 297mm;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }

                    /*
                     * Hide EVERYTHING from dashboard
                     */
                    body * {
                        visibility: hidden !important;
                    }

                    /*
                     * Show ONLY supplier print page
                     */
                    .supplier-print-page,
                    .supplier-print-page * {
                        visibility: visible !important;
                    }

                    .supplier-print-page {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }

                    .no-print {
                        display: none !important;
                    }

                    .print-only {
                        display: block !important;
                    }

                    .print-section {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }

                    .print-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }

                    .print-table th,
                    .print-table td {
                        border: 1px solid #cbd5e1 !important;
                        padding: 7px 8px !important;
                        font-size: 10px !important;
                    }

                    .print-table th {
                        background: #f1f5f9 !important;
                        font-weight: 700 !important;
                    }

                    .print-summary {
                        display: grid !important;
                        grid-template-columns: repeat(4, 1fr) !important;
                        gap: 8px !important;
                    }

                    .print-box {
                        border: 1px solid #94a3b8 !important;
                        padding: 10px !important;
                    }

                    .print-no-shadow {
                        box-shadow: none !important;
                    }

                    .print-border {
                        border: 1px solid #64748b !important;
                    }

                    .print-page-break {
                        page-break-before: always;
                        break-before: page;
                    }
                }

                @media screen {
                    .print-only {
                        display: none;
                    }
                }
            `}</style>

            {/* ==================================================
                MAIN
            ================================================== */}

            <div className="supplier-print-page">

                {/* ==================================================
                    SCREEN HEADER
                ================================================== */}

                <div className="no-print mb-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">

                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">
                            🚚 Supplier Details
                        </h1>

                        <p className="mt-1 text-slate-500">
                            Complete supplier account
                            information
                        </p>
                    </div>

                    <div className="flex gap-3">

                        <button
                            onClick={() =>
                                router.push("/supplier")
                            }
                            className="rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-300"
                        >
                            ← Back
                        </button>

                        <button
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

                {/* ==================================================
                    PRINT DOCUMENT
                ================================================== */}

                <div className="bg-white">

                    {/* ==================================================
                        PRINT HEADER
                    ================================================== */}

                    <div className="print-section mb-5 border-b-2 border-slate-800 pb-4 text-center">

                        <h1 className="text-2xl font-bold tracking-wide text-slate-900">
                            SUPPLIER ACCOUNT STATEMENT
                        </h1>

                        <p className="mt-1 text-sm font-medium text-slate-600">
                            Agro Shop CRM
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Printed:{" "}
                            {new Date().toLocaleDateString(
                                "en-BD",
                                {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                }
                            )}
                        </p>

                    </div>

                    {/* ==================================================
                        SUPPLIER INFORMATION
                    ================================================== */}

                    <section className="print-section mb-4">

                        <div className="mb-2 flex items-center justify-between">

                            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                                Supplier Information
                            </h2>

                            <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold ${supplier.isActive
                                        ? "border-green-600 text-green-700"
                                        : "border-red-600 text-red-700"
                                    }`}
                            >
                                {supplier.isActive
                                    ? "ACTIVE"
                                    : "INACTIVE"}
                            </span>

                        </div>

                        <div className="print-border rounded-lg p-4">

                            <div className="mb-4 border-b border-slate-300 pb-3">

                                <h2 className="text-xl font-bold text-slate-900">
                                    {supplier.name}
                                </h2>

                                {supplier.company && (
                                    <p className="mt-1 text-sm font-medium text-slate-500">
                                        {supplier.company}
                                    </p>
                                )}

                            </div>

                            <div className="grid grid-cols-2 gap-x-10 gap-y-4">

                                <div>
                                    <p className="text-[10px] font-semibold uppercase text-slate-500">
                                        Supplier Name
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {supplier.name}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-semibold uppercase text-slate-500">
                                        Company
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {supplier.company ||
                                            "-"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-semibold uppercase text-slate-500">
                                        Phone
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {supplier.phone}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-semibold uppercase text-slate-500">
                                        Email
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {supplier.email ||
                                            "-"}
                                    </p>
                                </div>

                                <div className="col-span-2">

                                    <p className="text-[10px] font-semibold uppercase text-slate-500">
                                        Address
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {supplier.address ||
                                            "-"}
                                    </p>

                                </div>

                            </div>

                        </div>

                    </section>

                    {/* ==================================================
                        ACCOUNT SUMMARY
                    ================================================== */}

                    <section className="print-section mb-5">

                        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-800">
                            Account Summary
                        </h2>

                        <div className="print-summary grid gap-3 md:grid-cols-4">

                            <div className="print-box rounded-lg border border-orange-300 bg-orange-50 p-4">

                                <p className="text-[10px] font-semibold uppercase text-slate-500">
                                    Opening Due
                                </p>

                                <p className="mt-2 text-lg font-bold text-orange-600">
                                    ৳ {money(openingDue)}
                                </p>

                            </div>

                            <div className="print-box rounded-lg border border-slate-300 bg-slate-50 p-4">

                                <p className="text-[10px] font-semibold uppercase text-slate-500">
                                    Total Purchase
                                </p>

                                <p className="mt-2 text-lg font-bold text-slate-900">
                                    ৳ {money(totalPurchase)}
                                </p>

                            </div>

                            <div className="print-box rounded-lg border border-green-300 bg-green-50 p-4">

                                <p className="text-[10px] font-semibold uppercase text-slate-500">
                                    Total Paid
                                </p>

                                <p className="mt-2 text-lg font-bold text-green-600">
                                    ৳ {money(totalPaid)}
                                </p>

                            </div>

                            <div className="print-box rounded-lg border border-red-300 bg-red-50 p-4">

                                <p className="text-[10px] font-semibold uppercase text-slate-500">
                                    Current Due
                                </p>

                                <p className="mt-2 text-lg font-bold text-red-600">
                                    ৳ {money(currentDue)}
                                </p>

                            </div>

                        </div>

                    </section>

                    {/* ==================================================
                        PURCHASE HISTORY
                    ================================================== */}

                    <section className="print-section mb-5">

                        <div className="mb-2">

                            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                                Purchase History
                            </h2>

                            <p className="text-xs text-slate-500">
                                Products purchased from this
                                supplier
                            </p>

                        </div>

                        <table className="print-table w-full border-collapse">

                            <thead>

                                <tr>

                                    <th className="text-left">
                                        Date
                                    </th>

                                    <th className="text-left">
                                        Invoice
                                    </th>

                                    <th className="text-right">
                                        Total
                                    </th>

                                    <th className="text-right">
                                        Paid
                                    </th>

                                    <th className="text-right">
                                        Due
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {purchases.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan={5}
                                            className="text-center"
                                        >
                                            No purchase
                                            records found.
                                        </td>

                                    </tr>

                                ) : (

                                    purchases.map(
                                        (
                                            purchase,
                                            index
                                        ) => (

                                            <tr
                                                key={
                                                    purchase.id ||
                                                    index
                                                }
                                            >

                                                <td>
                                                    {formatDate(
                                                        purchase.purchaseDate
                                                    )}
                                                </td>

                                                <td className="font-semibold">

                                                    {purchase.invoiceNumber ||
                                                        purchase.purchaseNumber ||
                                                        purchase.invoiceNo ||
                                                        `Purchase #${purchase.id}`}

                                                </td>

                                                <td className="text-right">

                                                    ৳{" "}
                                                    {money(
                                                        purchase.totalAmount ??
                                                        purchase.total ??
                                                        purchase.grandTotal ??
                                                        0
                                                    )}

                                                </td>

                                                <td className="text-right">

                                                    ৳{" "}
                                                    {money(
                                                        purchase.paidAmount ??
                                                        0
                                                    )}

                                                </td>

                                                <td className="text-right font-bold">

                                                    ৳{" "}
                                                    {money(
                                                        purchase.dueAmount ??
                                                        0
                                                    )}

                                                </td>

                                            </tr>

                                        )
                                    )

                                )}

                            </tbody>

                        </table>

                    </section>

                    {/* ==================================================
                        PAYMENT HISTORY
                    ================================================== */}

                    <section className="print-section mb-5">

                        <div className="mb-2">

                            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                                Payment History
                            </h2>

                            <p className="text-xs text-slate-500">
                                Payments made to this supplier
                            </p>

                        </div>

                        <table className="print-table w-full border-collapse">

                            <thead>

                                <tr>

                                    <th className="text-left">
                                        Date
                                    </th>

                                    <th className="text-left">
                                        Payment Method
                                    </th>

                                    <th className="text-right">
                                        Amount
                                    </th>

                                    <th className="text-left">
                                        Note
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {payments.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan={4}
                                            className="text-center"
                                        >
                                            No payment
                                            records found.
                                        </td>

                                    </tr>

                                ) : (

                                    payments.map(
                                        (
                                            payment,
                                            index
                                        ) => (

                                            <tr
                                                key={
                                                    payment.id ||
                                                    index
                                                }
                                            >

                                                <td>
                                                    {formatDate(
                                                        payment.paymentDate
                                                    )}
                                                </td>

                                                <td className="font-semibold">

                                                    {
                                                        payment.paymentMethod
                                                    }

                                                </td>

                                                <td className="text-right font-bold">

                                                    ৳{" "}
                                                    {money(
                                                        payment.amount
                                                    )}

                                                </td>

                                                <td>
                                                    {payment.note ||
                                                        "-"}
                                                </td>

                                            </tr>

                                        )
                                    )

                                )}

                            </tbody>

                        </table>

                    </section>

                    {/* ==================================================
                        STATEMENT FOOTER
                    ================================================== */}

                    <section className="print-section mt-10">

                        <div className="grid grid-cols-2 gap-20">

                            <div className="pt-8">

                                <div className="border-t border-slate-700 pt-2 text-center">

                                    <p className="text-xs font-semibold">
                                        Prepared By
                                    </p>

                                </div>

                            </div>

                            <div className="pt-8">

                                <div className="border-t border-slate-700 pt-2 text-center">

                                    <p className="text-xs font-semibold">
                                        Authorized Signature
                                    </p>

                                </div>

                            </div>

                        </div>

                    </section>

                    {/* ==================================================
                        PRINT FOOTER
                    ================================================== */}

                    <div className="print-only mt-8 border-t border-slate-300 pt-3 text-center">

                        <p className="text-[10px] text-slate-500">
                            Supplier Account Statement •
                            Agro Shop CRM
                        </p>

                    </div>

                </div>
            </div>
        </>
    );
}