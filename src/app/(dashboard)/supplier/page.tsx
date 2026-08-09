"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

import SupplierHeader from "@/components/supplier/SupplierHeader";
import SupplierForm from "@/components/supplier/SupplierForm";
import SupplierTable from "@/components/supplier/SupplierTable";

type Supplier = {
    id: number;
    name: string;
    company?: string | null;
    phone: string;
    email?: string | null;
    address?: string | null;
    openingDue: number | string;
    isActive: boolean;
};

type Purchase = {
    id: number;
    invoiceNumber?: string | null;
    purchaseDate?: string;
    totalAmount?: number | string;
    paidAmount?: number | string;
    dueAmount?: number | string;
    supplierId: number;
    items?: any[];
};

type SupplierPayment = {
    id: number;
    supplierId: number;
    amount: number | string;
    paymentMethod: string;
    paymentDate: string;
    note?: string | null;
};

type SupplierDetails = Supplier & {
    purchases?: Purchase[];
    supplierPayments?: SupplierPayment[];
    batches?: any[];
};

export default function SupplierPage() {
    const [open, setOpen] = useState(false);

    const [loading, setLoading] = useState(false);

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    const [search, setSearch] = useState("");

    const [selectedSupplier, setSelectedSupplier] =
        useState<Supplier | null>(null);

    const [viewOpen, setViewOpen] = useState(false);

    const [supplierDetails, setSupplierDetails] =
        useState<SupplierDetails | null>(null);

    const [detailsLoading, setDetailsLoading] =
        useState(false);

    // ==========================================
    // LOAD SUPPLIERS
    // ==========================================

    async function loadSuppliers() {
        try {
            const response = await axios.get("/api/supplier");

            setSuppliers(response.data);
        } catch (error) {
            console.error(error);

            toast.error("Failed to load suppliers");
        }
    }

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {
        loadSuppliers();
    }, []);

    // ==========================================
    // CREATE / UPDATE SUPPLIER
    // ==========================================

    async function createSupplier(data: any) {
        try {
            setLoading(true);

            if (selectedSupplier) {
                await axios.put(
                    `/api/supplier/${selectedSupplier.id}`,
                    data
                );

                toast.success(
                    "Supplier updated successfully"
                );
            } else {
                await axios.post(
                    "/api/supplier",
                    data
                );

                toast.success(
                    "Supplier added successfully"
                );
            }

            await loadSuppliers();

            setSelectedSupplier(null);

            setOpen(false);
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ??
                "Failed to save supplier"
            );
        } finally {
            setLoading(false);
        }
    }

    // ==========================================
    // DELETE SUPPLIER
    // ==========================================

    async function deleteSupplier(
        supplier: Supplier
    ) {
        const ok = window.confirm(
            `Delete "${supplier.name}" ?`
        );

        if (!ok) return;

        try {
            await axios.delete(
                `/api/supplier/${supplier.id}`
            );

            toast.success(
                "Supplier deleted successfully"
            );

            await loadSuppliers();
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ??
                "Failed to delete supplier"
            );
        }
    }

    // ==========================================
    // OPEN ADD FORM
    // ==========================================

    function openAddSupplier() {
        setSelectedSupplier(null);

        setOpen(true);
    }

    // ==========================================
    // OPEN EDIT FORM
    // ==========================================

    function openEditSupplier(
        supplier: Supplier
    ) {
        setSelectedSupplier(supplier);

        setOpen(true);
    }

    // ==========================================
    // CLOSE FORM
    // ==========================================

    function closeSupplierForm() {
        setSelectedSupplier(null);

        setOpen(false);
    }

    // ==========================================
    // VIEW SUPPLIER DETAILS
    // ==========================================

    async function viewSupplierDetails(
        supplier: Supplier
    ) {
        try {
            setDetailsLoading(true);

            setViewOpen(true);

            const response = await axios.get(
                `/api/supplier/${supplier.id}`
            );

            setSupplierDetails(response.data);
        } catch (error) {
            console.error(error);

            toast.error(
                "Failed to load supplier details"
            );

            setViewOpen(false);
        } finally {
            setDetailsLoading(false);
        }
    }

    // ==========================================
    // CLOSE DETAILS
    // ==========================================

    function closeDetails() {
        setViewOpen(false);

        setSupplierDetails(null);
    }

    // ==========================================
    // PRINT SUPPLIER DETAILS
    // ==========================================

    function printSupplierDetails() {
        if (!supplierDetails) return;

        const purchases =
            supplierDetails.purchases ?? [];

        const payments =
            supplierDetails.supplierPayments ?? [];

        const purchaseTotal =
            purchases.reduce(
                (sum, purchase) =>
                    sum +
                    Number(
                        purchase.totalAmount ?? 0
                    ),
                0
            );

        const paidTotal =
            purchases.reduce(
                (sum, purchase) =>
                    sum +
                    Number(
                        purchase.paidAmount ?? 0
                    ),
                0
            );

        const dueTotal =
            purchases.reduce(
                (sum, purchase) =>
                    sum +
                    Number(
                        purchase.dueAmount ?? 0
                    ),
                0
            );

        const paymentTotal =
            payments.reduce(
                (sum, payment) =>
                    sum +
                    Number(payment.amount),
                0
            );

        const printWindow =
            window.open(
                "",
                "_blank",
                "width=1000,height=800"
            );

        if (!printWindow) {
            toast.error(
                "Please allow pop-ups to print"
            );

            return;
        }

        const purchaseRows =
            purchases.length > 0
                ? purchases
                    .map(
                        (purchase) => `
                <tr>
                    <td>
                        ${purchase.invoiceNumber ??
                            `Purchase #${purchase.id}`
                            }
                    </td>

                    <td>
                        ${purchase.purchaseDate
                                ? new Date(
                                    purchase.purchaseDate
                                ).toLocaleDateString(
                                    "en-BD"
                                )
                                : "-"
                            }
                    </td>

                    <td>
                        ৳ ${Number(
                                purchase.totalAmount ?? 0
                            ).toLocaleString(
                                "en-BD",
                                {
                                    minimumFractionDigits: 2,
                                }
                            )}
                    </td>

                    <td>
                        ৳ ${Number(
                                purchase.paidAmount ?? 0
                            ).toLocaleString(
                                "en-BD",
                                {
                                    minimumFractionDigits: 2,
                                }
                            )}
                    </td>

                    <td>
                        ৳ ${Number(
                                purchase.dueAmount ?? 0
                            ).toLocaleString(
                                "en-BD",
                                {
                                    minimumFractionDigits: 2,
                                }
                            )}
                    </td>
                </tr>
            `
                    )
                    .join("")
                : `
                    <tr>
                        <td colspan="5">
                            No purchase records found.
                        </td>
                    </tr>
                `;

        const paymentRows =
            payments.length > 0
                ? payments
                    .map(
                        (payment) => `
                <tr>
                    <td>
                        ${payment.paymentDate
                                ? new Date(
                                    payment.paymentDate
                                ).toLocaleDateString(
                                    "en-BD"
                                )
                                : "-"
                            }
                    </td>

                    <td>
                        ${payment.paymentMethod}
                    </td>

                    <td>
                        ৳ ${Number(
                                payment.amount
                            ).toLocaleString(
                                "en-BD",
                                {
                                    minimumFractionDigits: 2,
                                }
                            )}
                    </td>

                    <td>
                        ${payment.note ?? "-"}
                    </td>
                </tr>
            `
                    )
                    .join("")
                : `
                    <tr>
                        <td colspan="4">
                            No supplier payment records found.
                        </td>
                    </tr>
                `;

        printWindow.document.write(`
            <!DOCTYPE html>

            <html>

            <head>

                <title>
                    Supplier Report - ${supplierDetails.name
            }
                </title>

                <style>

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        font-family: Arial, sans-serif;
                        margin: 40px;
                        color: #1e293b;
                    }

                    .header {
                        display: flex;
                        justify-content: space-between;
                        border-bottom: 2px solid #16a34a;
                        padding-bottom: 20px;
                        margin-bottom: 25px;
                    }

                    h1 {
                        margin: 0;
                        color: #166534;
                    }

                    h2 {
                        margin-top: 30px;
                        color: #334155;
                        border-bottom: 1px solid #cbd5e1;
                        padding-bottom: 8px;
                    }

                    .subtitle {
                        color: #64748b;
                        margin-top: 6px;
                    }

                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 12px 30px;
                        background: #f8fafc;
                        padding: 20px;
                        border-radius: 8px;
                    }

                    .info-item {
                        padding: 5px 0;
                    }

                    .label {
                        font-weight: bold;
                        color: #475569;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                    }

                    th,
                    td {
                        border: 1px solid #cbd5e1;
                        padding: 9px;
                        text-align: left;
                    }

                    th {
                        background: #f1f5f9;
                    }

                    .summary {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 12px;
                        margin-top: 20px;
                    }

                    .summary-box {
                        border: 1px solid #cbd5e1;
                        padding: 15px;
                        border-radius: 8px;
                    }

                    .summary-label {
                        color: #64748b;
                        font-size: 13px;
                    }

                    .summary-value {
                        font-size: 20px;
                        font-weight: bold;
                        margin-top: 5px;
                    }

                    .footer {
                        margin-top: 40px;
                        padding-top: 15px;
                        border-top: 1px solid #cbd5e1;
                        text-align: center;
                        color: #64748b;
                        font-size: 12px;
                    }

                    @media print {
                        body {
                            margin: 20px;
                        }

                        .no-print {
                            display: none;
                        }
                    }

                </style>

            </head>

            <body>

                <div class="header">

                    <div>

                        <h1>
                            Supplier Statement
                        </h1>

                        <div class="subtitle">
                            Supplier Purchase & Payment Report
                        </div>

                    </div>

                    <div>
                        <strong>
                            Generated:
                        </strong>

                        ${new Date().toLocaleString(
                "en-BD"
            )}
                    </div>

                </div>

                <h2>
                    Supplier Information
                </h2>

                <div class="info-grid">

                    <div class="info-item">
                        <span class="label">
                            Supplier Name:
                        </span>

                        ${supplierDetails.name
            }
                    </div>

                    <div class="info-item">
                        <span class="label">
                            Company:
                        </span>

                        ${supplierDetails.company ??
            "-"
            }
                    </div>

                    <div class="info-item">
                        <span class="label">
                            Phone:
                        </span>

                        ${supplierDetails.phone
            }
                    </div>

                    <div class="info-item">
                        <span class="label">
                            Email:
                        </span>

                        ${supplierDetails.email ??
            "-"
            }
                    </div>

                    <div class="info-item">
                        <span class="label">
                            Address:
                        </span>

                        ${supplierDetails.address ??
            "-"
            }
                    </div>

                    <div class="info-item">
                        <span class="label">
                            Opening Due:
                        </span>

                        ৳ ${Number(
                supplierDetails.openingDue ??
                0
            ).toLocaleString(
                "en-BD",
                {
                    minimumFractionDigits: 2,
                }
            )}
                    </div>

                </div>

                <h2>
                    Purchase Summary
                </h2>

                <div class="summary">

                    <div class="summary-box">
                        <div class="summary-label">
                            Total Purchases
                        </div>

                        <div class="summary-value">
                            ৳ ${purchaseTotal.toLocaleString(
                "en-BD",
                {
                    minimumFractionDigits: 2,
                }
            )}
                        </div>
                    </div>

                    <div class="summary-box">
                        <div class="summary-label">
                            Paid Against Purchases
                        </div>

                        <div class="summary-value">
                            ৳ ${paidTotal.toLocaleString(
                "en-BD",
                {
                    minimumFractionDigits: 2,
                }
            )}
                        </div>
                    </div>

                    <div class="summary-box">
                        <div class="summary-label">
                            Purchase Due
                        </div>

                        <div class="summary-value">
                            ৳ ${dueTotal.toLocaleString(
                "en-BD",
                {
                    minimumFractionDigits: 2,
                }
            )}
                        </div>
                    </div>

                    <div class="summary-box">
                        <div class="summary-label">
                            Payment Records
                        </div>

                        <div class="summary-value">
                            ${payments.length}
                        </div>
                    </div>

                </div>

                <h2>
                    Purchase / Invoice History
                </h2>

                <table>

                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Paid</th>
                            <th>Due</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${purchaseRows}
                    </tbody>

                </table>

                <h2>
                    Supplier Payment History
                </h2>

                <table>

                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Method</th>
                            <th>Amount</th>
                            <th>Note</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${paymentRows}
                    </tbody>

                </table>

                <div class="summary">

                    <div class="summary-box">

                        <div class="summary-label">
                            Total Supplier Payments
                        </div>

                        <div class="summary-value">
                            ৳ ${paymentTotal.toLocaleString(
                "en-BD",
                {
                    minimumFractionDigits: 2,
                }
            )}
                        </div>

                    </div>

                </div>

                <div class="footer">
                    Supplier Statement • Agro Shop CRM
                </div>

                <script>

                    window.onload = function() {
                        window.print();
                    };

                </script>

            </body>

            </html>
        `);

        printWindow.document.close();
    }

    // ==========================================
    // SEARCH
    // ==========================================

    const filteredSuppliers = useMemo(() => {
        const keyword =
            search.toLowerCase().trim();

        if (!keyword) {
            return suppliers;
        }

        return suppliers.filter(
            (supplier) =>
                supplier.name
                    ?.toLowerCase()
                    .includes(keyword) ||
                supplier.company
                    ?.toLowerCase()
                    .includes(keyword) ||
                supplier.phone
                    ?.toLowerCase()
                    .includes(keyword)
        );
    }, [suppliers, search]);

    // ==========================================
    // DETAILS CALCULATIONS
    // ==========================================

    const purchases =
        supplierDetails?.purchases ?? [];

    const payments =
        supplierDetails?.supplierPayments ?? [];

    const totalPurchase =
        purchases.reduce(
            (sum, purchase) =>
                sum +
                Number(
                    purchase.totalAmount ?? 0
                ),
            0
        );

    const totalPaid =
        purchases.reduce(
            (sum, purchase) =>
                sum +
                Number(
                    purchase.paidAmount ?? 0
                ),
            0
        );

    const totalDue =
        purchases.reduce(
            (sum, purchase) =>
                sum +
                Number(
                    purchase.dueAmount ?? 0
                ),
            0
        );

    const totalSupplierPayments =
        payments.reduce(
            (sum, payment) =>
                sum + Number(payment.amount),
            0
        );

    // ==========================================
    // UI
    // ==========================================

    return (
        <div className="space-y-6">

            {/* HEADER */}

            <SupplierHeader
                onAdd={openAddSupplier}
            />

            {/* SEARCH */}

            <div className="rounded-xl bg-white p-5 shadow">

                <input
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    placeholder="🔍 Search by Supplier, Company or Phone..."
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
                />

            </div>

            {/* TABLE */}

            <SupplierTable
                suppliers={filteredSuppliers}
                onEdit={openEditSupplier}
                onDelete={deleteSupplier}
            />

            {/* ================================= */}
            {/* ADD / EDIT MODAL */}
            {/* ================================= */}

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">

                    <div className="my-6 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b p-6">

                            <div>

                                <h2 className="text-2xl font-bold text-slate-800">

                                    {selectedSupplier
                                        ? "Edit Supplier"
                                        : "Add Supplier"}

                                </h2>

                                <p className="text-sm text-slate-500">

                                    {selectedSupplier
                                        ? "Update supplier information"
                                        : "Create a new supplier"}

                                </p>

                            </div>

                            <button
                                onClick={
                                    closeSupplierForm
                                }
                                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                            >
                                Close
                            </button>

                        </div>

                        <div className="max-h-[75vh] overflow-y-auto p-6">

                            <SupplierForm
                                loading={loading}
                                initialData={
                                    selectedSupplier
                                }
                                onSubmit={
                                    createSupplier
                                }
                                onCancel={
                                    closeSupplierForm
                                }
                            />

                        </div>

                    </div>

                </div>
            )}

            {/* ================================= */}
            {/* VIEW DETAILS MODAL */}
            {/* ================================= */}

            {viewOpen && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4"
                    onMouseDown={(e) => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            closeDetails();
                        }
                    }}
                >

                    <div className="my-6 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

                        {/* MODAL HEADER */}

                        <div className="flex shrink-0 items-center justify-between border-b bg-white p-5">

                            <div>

                                <h2 className="text-2xl font-bold text-slate-800">

                                    👁️ Supplier Details

                                </h2>

                                {supplierDetails && (
                                    <p className="mt-1 text-sm text-slate-500">

                                        {
                                            supplierDetails.name
                                        }

                                        {supplierDetails.company &&
                                            ` • ${supplierDetails.company}`}

                                    </p>
                                )}

                            </div>

                            <div className="flex gap-2">

                                {supplierDetails && (
                                    <button
                                        onClick={
                                            printSupplierDetails
                                        }
                                        className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
                                    >
                                        🖨️ Print
                                    </button>
                                )}

                                <button
                                    onClick={
                                        closeDetails
                                    }
                                    className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                                >
                                    Close
                                </button>

                            </div>

                        </div>

                        {/* MODAL BODY */}

                        <div className="min-h-0 flex-1 overflow-y-auto p-6">

                            {detailsLoading ? (
                                <div className="py-20 text-center text-slate-500">

                                    Loading supplier
                                    details...

                                </div>
                            ) : supplierDetails ? (
                                <div className="space-y-6">

                                    {/* SUPPLIER INFORMATION */}

                                    <div className="rounded-xl border bg-slate-50 p-5">

                                        <h3 className="mb-4 text-lg font-bold text-slate-800">

                                            🚚 Supplier Information

                                        </h3>

                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                                            <div>
                                                <p className="text-xs font-semibold uppercase text-slate-500">
                                                    Name
                                                </p>

                                                <p className="mt-1 font-semibold">
                                                    {
                                                        supplierDetails.name
                                                    }
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold uppercase text-slate-500">
                                                    Company
                                                </p>

                                                <p className="mt-1">
                                                    {
                                                        supplierDetails.company ??
                                                        "-"
                                                    }
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold uppercase text-slate-500">
                                                    Phone
                                                </p>

                                                <p className="mt-1">
                                                    {
                                                        supplierDetails.phone
                                                    }
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold uppercase text-slate-500">
                                                    Email
                                                </p>

                                                <p className="mt-1">
                                                    {
                                                        supplierDetails.email ??
                                                        "-"
                                                    }
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold uppercase text-slate-500">
                                                    Opening Due
                                                </p>

                                                <p className="mt-1 font-bold text-red-600">
                                                    ৳{" "}
                                                    {Number(
                                                        supplierDetails.openingDue ??
                                                        0
                                                    ).toLocaleString(
                                                        "en-BD",
                                                        {
                                                            minimumFractionDigits: 2,
                                                        }
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-semibold uppercase text-slate-500">
                                                    Status
                                                </p>

                                                <p className="mt-1">
                                                    {supplierDetails.isActive
                                                        ? "🟢 Active"
                                                        : "🔴 Inactive"}
                                                </p>
                                            </div>

                                            <div className="md:col-span-2 lg:col-span-3">

                                                <p className="text-xs font-semibold uppercase text-slate-500">
                                                    Address
                                                </p>

                                                <p className="mt-1">
                                                    {
                                                        supplierDetails.address ??
                                                        "-"
                                                    }
                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                    {/* SUMMARY CARDS */}

                                    <div className="grid gap-4 md:grid-cols-4">

                                        <div className="rounded-xl border bg-white p-5 shadow-sm">

                                            <p className="text-sm text-slate-500">
                                                Total Purchase
                                            </p>

                                            <p className="mt-2 text-xl font-bold text-slate-800">
                                                ৳{" "}
                                                {totalPurchase.toLocaleString(
                                                    "en-BD",
                                                    {
                                                        minimumFractionDigits: 2,
                                                    }
                                                )}
                                            </p>

                                        </div>

                                        <div className="rounded-xl border bg-white p-5 shadow-sm">

                                            <p className="text-sm text-slate-500">
                                                Paid
                                            </p>

                                            <p className="mt-2 text-xl font-bold text-green-600">
                                                ৳{" "}
                                                {totalPaid.toLocaleString(
                                                    "en-BD",
                                                    {
                                                        minimumFractionDigits: 2,
                                                    }
                                                )}
                                            </p>

                                        </div>

                                        <div className="rounded-xl border bg-white p-5 shadow-sm">

                                            <p className="text-sm text-slate-500">
                                                Purchase Due
                                            </p>

                                            <p className="mt-2 text-xl font-bold text-red-600">
                                                ৳{" "}
                                                {totalDue.toLocaleString(
                                                    "en-BD",
                                                    {
                                                        minimumFractionDigits: 2,
                                                    }
                                                )}
                                            </p>

                                        </div>

                                        <div className="rounded-xl border bg-white p-5 shadow-sm">

                                            <p className="text-sm text-slate-500">
                                                Payments Made
                                            </p>

                                            <p className="mt-2 text-xl font-bold text-blue-600">
                                                ৳{" "}
                                                {totalSupplierPayments.toLocaleString(
                                                    "en-BD",
                                                    {
                                                        minimumFractionDigits: 2,
                                                    }
                                                )}
                                            </p>

                                        </div>

                                    </div>

                                    {/* PURCHASE HISTORY */}

                                    <div className="rounded-xl border bg-white">

                                        <div className="border-b p-5">

                                            <h3 className="text-lg font-bold text-slate-800">

                                                📦 Purchase / Invoice History

                                            </h3>

                                            <p className="mt-1 text-sm text-slate-500">

                                                What was purchased from this supplier and how much is still due.

                                            </p>

                                        </div>

                                        <div className="overflow-x-auto">

                                            <table className="w-full min-w-[800px]">

                                                <thead className="bg-slate-100">

                                                    <tr>

                                                        <th className="px-4 py-3 text-left text-sm">
                                                            Invoice
                                                        </th>

                                                        <th className="px-4 py-3 text-left text-sm">
                                                            Date
                                                        </th>

                                                        <th className="px-4 py-3 text-right text-sm">
                                                            Total
                                                        </th>

                                                        <th className="px-4 py-3 text-right text-sm">
                                                            Paid
                                                        </th>

                                                        <th className="px-4 py-3 text-right text-sm">
                                                            Due
                                                        </th>

                                                    </tr>

                                                </thead>

                                                <tbody>

                                                    {purchases.length ===
                                                        0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={
                                                                    5
                                                                }
                                                                className="py-8 text-center text-slate-400"
                                                            >
                                                                No purchase records found.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        purchases.map(
                                                            (
                                                                purchase
                                                            ) => (
                                                                <tr
                                                                    key={
                                                                        purchase.id
                                                                    }
                                                                    className="border-t"
                                                                >

                                                                    <td className="px-4 py-3 font-semibold">

                                                                        {purchase.invoiceNumber ??
                                                                            `Purchase #${purchase.id}`}

                                                                    </td>

                                                                    <td className="px-4 py-3">

                                                                        {purchase.purchaseDate
                                                                            ? new Date(
                                                                                purchase.purchaseDate
                                                                            ).toLocaleDateString(
                                                                                "en-BD"
                                                                            )
                                                                            : "-"}

                                                                    </td>

                                                                    <td className="px-4 py-3 text-right">

                                                                        ৳{" "}
                                                                        {Number(
                                                                            purchase.totalAmount ??
                                                                            0
                                                                        ).toLocaleString(
                                                                            "en-BD",
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                            }
                                                                        )}

                                                                    </td>

                                                                    <td className="px-4 py-3 text-right font-semibold text-green-600">

                                                                        ৳{" "}
                                                                        {Number(
                                                                            purchase.paidAmount ??
                                                                            0
                                                                        ).toLocaleString(
                                                                            "en-BD",
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                            }
                                                                        )}

                                                                    </td>

                                                                    <td className="px-4 py-3 text-right font-semibold text-red-600">

                                                                        ৳{" "}
                                                                        {Number(
                                                                            purchase.dueAmount ??
                                                                            0
                                                                        ).toLocaleString(
                                                                            "en-BD",
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                            }
                                                                        )}

                                                                    </td>

                                                                </tr>
                                                            )
                                                        )
                                                    )}

                                                </tbody>

                                            </table>

                                        </div>

                                    </div>

                                    {/* PAYMENT HISTORY */}

                                    <div className="rounded-xl border bg-white">

                                        <div className="border-b p-5">

                                            <h3 className="text-lg font-bold text-slate-800">

                                                💸 Supplier Payment History

                                            </h3>

                                        </div>

                                        <div className="overflow-x-auto">

                                            <table className="w-full min-w-[700px]">

                                                <thead className="bg-slate-100">

                                                    <tr>

                                                        <th className="px-4 py-3 text-left text-sm">
                                                            Date
                                                        </th>

                                                        <th className="px-4 py-3 text-left text-sm">
                                                            Method
                                                        </th>

                                                        <th className="px-4 py-3 text-right text-sm">
                                                            Amount
                                                        </th>

                                                        <th className="px-4 py-3 text-left text-sm">
                                                            Note
                                                        </th>

                                                    </tr>

                                                </thead>

                                                <tbody>

                                                    {payments.length ===
                                                        0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan={
                                                                    4
                                                                }
                                                                className="py-8 text-center text-slate-400"
                                                            >
                                                                No payment records found.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        payments.map(
                                                            (
                                                                payment
                                                            ) => (
                                                                <tr
                                                                    key={
                                                                        payment.id
                                                                    }
                                                                    className="border-t"
                                                                >

                                                                    <td className="px-4 py-3">

                                                                        {new Date(
                                                                            payment.paymentDate
                                                                        ).toLocaleDateString(
                                                                            "en-BD"
                                                                        )}

                                                                    </td>

                                                                    <td className="px-4 py-3">

                                                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">

                                                                            {
                                                                                payment.paymentMethod
                                                                            }

                                                                        </span>

                                                                    </td>

                                                                    <td className="px-4 py-3 text-right font-bold text-red-600">

                                                                        - ৳{" "}
                                                                        {Number(
                                                                            payment.amount
                                                                        ).toLocaleString(
                                                                            "en-BD",
                                                                            {
                                                                                minimumFractionDigits: 2,
                                                                            }
                                                                        )}

                                                                    </td>

                                                                    <td className="px-4 py-3 text-sm text-slate-500">

                                                                        {
                                                                            payment.note ??
                                                                            "-"
                                                                        }

                                                                    </td>

                                                                </tr>
                                                            )
                                                        )
                                                    )}

                                                </tbody>

                                            </table>

                                        </div>

                                    </div>

                                </div>
                            ) : null}

                        </div>

                        {/* MODAL FOOTER */}

                        <div className="flex shrink-0 justify-end gap-3 border-t bg-slate-50 p-4">

                            {supplierDetails && (
                                <button
                                    onClick={
                                        printSupplierDetails
                                    }
                                    className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
                                >
                                    🖨️ Print Supplier Details
                                </button>
                            )}

                            <button
                                onClick={
                                    closeDetails
                                }
                                className="rounded-xl bg-slate-200 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-300"
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}