"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";

type Supplier = {
    id: number;
    name: string;
    company?: string | null;
    phone: string;
    openingDue: number | string;
};

type Purchase = {
    id: number;
    purchaseDate: string;
    paidAmount: number | string;
    dueAmount: number | string;
    totalAmount?: number | string;
    invoiceNumber?: string | null;
    purchaseNumber?: string | null;
};

type SupplierPayment = {
    id: number;
    supplierId: number;
    amount: number | string;
    paymentMethod: string;
    paymentDate: string;
    note?: string | null;
    supplier: Supplier;
};

type SupplierDetails = Supplier & {
    purchases: Purchase[];
};

export default function SupplierPaymentPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [payments, setPayments] = useState<SupplierPayment[]>([]);

    const [supplierPurchases, setSupplierPurchases] = useState<Purchase[]>(
        []
    );

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [loadingPurchases, setLoadingPurchases] = useState(false);

    const [open, setOpen] = useState(false);

    const [editingPayment, setEditingPayment] =
        useState<SupplierPayment | null>(null);

    const [search, setSearch] = useState("");
    const router = useRouter();
    const [form, setForm] = useState({
        supplierId: "",
        amount: "",
        paymentMethod: "Cash",
        paymentDate: new Date().toISOString().split("T")[0],
        note: "",
    });

    // ======================================
    // LOAD ALL DATA
    // ======================================

    async function loadData() {
        try {
            setLoadingData(true);

            const [supplierResponse, paymentResponse] = await Promise.all([
                axios.get("/api/supplier"),
                axios.get("/api/supplier-payment"),
            ]);

            setSuppliers(supplierResponse.data);
            setPayments(paymentResponse.data);
        } catch (error) {
            console.error(error);

            toast.error("Failed to load supplier payment data");
        } finally {
            setLoadingData(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    // ======================================
    // LOAD SELECTED SUPPLIER PURCHASES
    // ======================================

    async function loadSupplierPurchases(supplierId: string) {
        if (!supplierId) {
            setSupplierPurchases([]);
            return;
        }

        try {
            setLoadingPurchases(true);

            const response = await axios.get(
                `/api/supplier/${supplierId}`
            );

            const supplier: SupplierDetails = response.data;

            setSupplierPurchases(supplier.purchases || []);
        } catch (error) {
            console.error(error);

            setSupplierPurchases([]);

            toast.error("Failed to load supplier purchase history");
        } finally {
            setLoadingPurchases(false);
        }
    }

    // ======================================
    // SUPPLIER CHANGE
    // ======================================

    function handleSupplierChange(supplierId: string) {
        setForm((previous) => ({
            ...previous,
            supplierId,
        }));

        loadSupplierPurchases(supplierId);
    }

    // ======================================
    // RESET FORM
    // ======================================

    function resetForm() {
        setForm({
            supplierId: "",
            amount: "",
            paymentMethod: "Cash",
            paymentDate: new Date().toISOString().split("T")[0],
            note: "",
        });

        setSupplierPurchases([]);
        setEditingPayment(null);
    }

    // ======================================
    // CLOSE MODAL
    // ======================================

    function closeModal() {
        if (loading) return;

        setOpen(false);
        resetForm();
    }

    // ======================================
    // OPEN ADD
    // ======================================

    function openAddForm() {
        resetForm();
        setOpen(true);
    }

    // ======================================
    // OPEN EDIT
    // ======================================

    async function openEditForm(payment: SupplierPayment) {
        setEditingPayment(payment);

        setForm({
            supplierId: String(payment.supplierId),
            amount: String(payment.amount),
            paymentMethod: payment.paymentMethod,
            paymentDate: new Date(payment.paymentDate)
                .toISOString()
                .split("T")[0],
            note: payment.note || "",
        });

        setOpen(true);

        await loadSupplierPurchases(String(payment.supplierId));
    }

    // ======================================
    // SAVE PAYMENT
    // ======================================

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!form.supplierId) {
            toast.error("Please select a supplier");
            return;
        }

        if (!form.amount || Number(form.amount) <= 0) {
            toast.error("Enter a valid payment amount");
            return;
        }

        // Don't allow payment greater than current outstanding
        const totalOutstanding =
            Number(selectedSupplier?.openingDue || 0) +
            supplierPurchases.reduce(
                (sum, purchase) => sum + Number(purchase.dueAmount || 0),
                0
            );

        if (!editingPayment && Number(form.amount) > totalOutstanding) {
            toast.error(
                `Payment cannot exceed outstanding due of ৳${totalOutstanding.toLocaleString(
                    "en-BD",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }
                )}`
            );

            return;
        }

        try {
            setLoading(true);

            if (editingPayment) {
                await axios.put(
                    `/api/supplier-payment/${editingPayment.id}`,
                    {
                        amount: Number(form.amount),
                        paymentMethod: form.paymentMethod,
                        paymentDate: form.paymentDate,
                        note: form.note,
                    }
                );

                toast.success(
                    "Supplier payment updated successfully"
                );
            } else {
                await axios.post("/api/supplier-payment", {
                    supplierId: Number(form.supplierId),
                    amount: Number(form.amount),
                    paymentMethod: form.paymentMethod,
                    paymentDate: form.paymentDate,
                    note: form.note,
                });

                toast.success(
                    "Supplier payment added successfully"
                );
            }

            setOpen(false);
            resetForm();

            await loadData();
        } catch (error: any) {
            console.error(error);

            toast.error(
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                "Failed to save supplier payment"
            );
        } finally {
            setLoading(false);
        }
    }

    // ======================================
    // DELETE PAYMENT
    // ======================================

    async function deletePayment(payment: SupplierPayment) {
        const ok = window.confirm(
            `Delete payment of ৳${Number(
                payment.amount
            ).toLocaleString()} to ${payment.supplier.name}?`
        );

        if (!ok) return;

        try {
            await axios.delete(
                `/api/supplier-payment/${payment.id}`
            );

            toast.success(
                "Supplier payment deleted successfully"
            );

            await loadData();
        } catch (error: any) {
            console.error(error);

            toast.error(
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                "Failed to delete payment"
            );
        }
    }

    // ======================================
    // SEARCH
    // ======================================

    const filteredPayments = useMemo(() => {
        const keyword = search.toLowerCase().trim();

        if (!keyword) return payments;

        return payments.filter(
            (payment) =>
                payment.supplier?.name
                    ?.toLowerCase()
                    .includes(keyword) ||
                payment.supplier?.company
                    ?.toLowerCase()
                    .includes(keyword) ||
                payment.supplier?.phone
                    ?.toLowerCase()
                    .includes(keyword) ||
                payment.paymentMethod
                    ?.toLowerCase()
                    .includes(keyword)
        );
    }, [payments, search]);

    // ======================================
    // TOTAL PAYMENT
    // ======================================

    const totalPayment = filteredPayments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
    );

    // ======================================
    // SELECTED SUPPLIER
    // ======================================

    const selectedSupplier = suppliers.find(
        (supplier) =>
            String(supplier.id) === form.supplierId
    );

    // ======================================
    // PURCHASE TOTALS
    // ======================================

    const purchaseTotal = supplierPurchases.reduce(
        (sum, purchase) =>
            sum +
            Number(
                purchase.totalAmount ||
                Number(purchase.paidAmount) +
                Number(purchase.dueAmount)
            ),
        0
    );

    const purchasePaid = supplierPurchases.reduce(
        (sum, purchase) =>
            sum + Number(purchase.paidAmount || 0),
        0
    );

    const purchaseDue = supplierPurchases.reduce(
        (sum, purchase) =>
            sum + Number(purchase.dueAmount || 0),
        0
    );

    const totalOutstanding =
        Number(selectedSupplier?.openingDue || 0) +
        purchaseDue;

    // ======================================
    // GET INVOICE NUMBER
    // ======================================

    function getInvoiceNumber(purchase: Purchase) {
        return (
            purchase.invoiceNumber ||
            purchase.purchaseNumber ||
            `PUR-${purchase.id}`
        );
    }

    // ======================================
    // UI
    // ======================================

    return (
        <div className="space-y-6">
            {/* HEADER */}

            <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">
                        💸 Supplier Payments
                    </h1>

                    <p className="mt-1 text-slate-500">
                        Record and manage payments made to suppliers
                    </p>
                </div>

                <button
                    onClick={openAddForm}
                    className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
                >
                    + Make Supplier Payment
                </button>
            </div>

            {/* SUMMARY */}

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Total Payments
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-800">
                        {filteredPayments.length}
                    </p>
                </div>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Total Paid
                    </p>

                    <p className="mt-2 text-2xl font-bold text-red-600">
                        ৳{" "}
                        {totalPayment.toLocaleString("en-BD", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </p>
                </div>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Suppliers
                    </p>

                    <p className="mt-2 text-2xl font-bold text-green-700">
                        {suppliers.length}
                    </p>
                </div>
            </div>

            {/* SEARCH */}

            <div className="rounded-2xl bg-white p-5 shadow-sm">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔍 Search supplier, company, phone or payment method..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
            </div>

            {/* TABLE */}

            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="px-5 py-4 text-left text-sm font-semibold">
                                    Date
                                </th>

                                <th className="px-5 py-4 text-left text-sm font-semibold">
                                    Supplier
                                </th>

                                <th className="px-5 py-4 text-left text-sm font-semibold">
                                    Phone
                                </th>

                                <th className="px-5 py-4 text-left text-sm font-semibold">
                                    Method
                                </th>

                                <th className="px-5 py-4 text-right text-sm font-semibold">
                                    Amount
                                </th>

                                <th className="px-5 py-4 text-left text-sm font-semibold">
                                    Note
                                </th>

                                <th className="px-5 py-4 text-center text-sm font-semibold">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loadingData ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-12 text-center text-slate-500"
                                    >
                                        Loading payments...
                                    </td>
                                </tr>
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-12 text-center text-slate-400"
                                    >
                                        No supplier payments found.
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <tr
                                        key={payment.id}
                                        className="border-t transition hover:bg-slate-50"
                                    >
                                        <td className="px-5 py-4">
                                            {new Date(
                                                payment.paymentDate
                                            ).toLocaleDateString("en-BD")}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-slate-800">
                                                {payment.supplier?.name}
                                            </div>

                                            {payment.supplier?.company && (
                                                <div className="text-xs text-slate-500">
                                                    {payment.supplier.company}
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-5 py-4 text-slate-600">
                                            {payment.supplier?.phone}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">
                                                {payment.paymentMethod}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-right font-bold text-red-600">
                                            - ৳{" "}
                                            {Number(
                                                payment.amount
                                            ).toLocaleString("en-BD", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </td>

                                        <td className="max-w-[220px] truncate px-5 py-4 text-sm text-slate-500">
                                            {payment.note || "-"}
                                        </td>

                                        <td className="px-5 py-4 text-center">
                                            <button
                                                onClick={() =>
                                                    openEditForm(payment)
                                                }
                                                className="mr-3 rounded-lg px-3 py-2 text-lg hover:bg-blue-50"
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() =>
                                                    router.push(
                                                        `/supplier/${payment.supplierId}/ledger`
                                                    )
                                                }
                                                className="mr-2 rounded-lg px-3 py-2 text-lg hover:bg-green-50"
                                                title="Account Ledger"
                                            >
                                                📒
                                            </button>
                                            <button
                                                onClick={() =>
                                                    deletePayment(payment)
                                                }
                                                className="rounded-lg px-3 py-2 text-lg hover:bg-red-50"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ====================================== */}
            {/* MODAL */}
            {/* ====================================== */}

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            closeModal();
                        }
                    }}
                >
                    <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                        {/* MODAL HEADER */}

                        <div className="flex shrink-0 items-center justify-between border-b bg-white p-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
                                    {editingPayment
                                        ? "Edit Supplier Payment"
                                        : "Make Supplier Payment"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {editingPayment
                                        ? "Update the payment information"
                                        : "Record a payment made to a supplier"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={loading}
                                className="rounded-lg bg-red-100 px-4 py-2 font-semibold text-red-600 hover:bg-red-200 disabled:opacity-50"
                            >
                                ✕
                            </button>
                        </div>

                        {/* SCROLLABLE BODY */}

                        <div className="min-h-0 flex-1 overflow-y-auto">
                            <form
                                onSubmit={handleSubmit}
                                className="space-y-5 p-5 md:p-6"
                            >
                                {/* SUPPLIER */}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Supplier *
                                    </label>

                                    <select
                                        value={form.supplierId}
                                        disabled={!!editingPayment || loading}
                                        onChange={(e) =>
                                            handleSupplierChange(
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600 disabled:bg-slate-100"
                                    >
                                        <option value="">
                                            Select Supplier
                                        </option>

                                        {suppliers.map((supplier) => (
                                            <option
                                                key={supplier.id}
                                                value={supplier.id}
                                            >
                                                {supplier.name}
                                                {" — "}
                                                {supplier.phone}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* SUPPLIER PURCHASE INFORMATION */}

                                {form.supplierId && (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800">
                                                    📦 Purchase & Due Details
                                                </h3>

                                                <p className="text-sm text-slate-500">
                                                    {selectedSupplier?.name}
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-red-50 px-4 py-2 text-right">
                                                <p className="text-xs text-red-500">
                                                    Total Outstanding
                                                </p>

                                                <p className="text-lg font-bold text-red-600">
                                                    ৳{" "}
                                                    {totalOutstanding.toLocaleString(
                                                        "en-BD",
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        }
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {/* SUMMARY */}

                                        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                                            <div className="rounded-xl bg-white p-3">
                                                <p className="text-xs text-slate-500">
                                                    Purchases
                                                </p>

                                                <p className="mt-1 font-bold">
                                                    {
                                                        supplierPurchases.length
                                                    }
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-white p-3">
                                                <p className="text-xs text-slate-500">
                                                    Purchase Total
                                                </p>

                                                <p className="mt-1 font-bold">
                                                    ৳{" "}
                                                    {purchaseTotal.toLocaleString(
                                                        "en-BD"
                                                    )}
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-white p-3">
                                                <p className="text-xs text-slate-500">
                                                    Paid
                                                </p>

                                                <p className="mt-1 font-bold text-green-600">
                                                    ৳{" "}
                                                    {purchasePaid.toLocaleString(
                                                        "en-BD"
                                                    )}
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-white p-3">
                                                <p className="text-xs text-slate-500">
                                                    Due
                                                </p>

                                                <p className="mt-1 font-bold text-red-600">
                                                    ৳{" "}
                                                    {purchaseDue.toLocaleString(
                                                        "en-BD"
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {/* PURCHASE LIST */}

                                        {loadingPurchases ? (
                                            <div className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">
                                                Loading purchase history...
                                            </div>
                                        ) : supplierPurchases.length === 0 ? (
                                            <div className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">
                                                No purchase records found for
                                                this supplier.
                                            </div>
                                        ) : (
                                            <div className="overflow-hidden rounded-xl border bg-white">
                                                <div className="max-h-64 overflow-y-auto overflow-x-auto">
                                                    <table className="w-full min-w-[650px] text-sm">
                                                        <thead className="sticky top-0 bg-slate-100">
                                                            <tr>
                                                                <th className="px-3 py-3 text-left">
                                                                    Invoice
                                                                </th>

                                                                <th className="px-3 py-3 text-left">
                                                                    Date
                                                                </th>

                                                                <th className="px-3 py-3 text-right">
                                                                    Total
                                                                </th>

                                                                <th className="px-3 py-3 text-right">
                                                                    Paid
                                                                </th>

                                                                <th className="px-3 py-3 text-right">
                                                                    Due
                                                                </th>
                                                            </tr>
                                                        </thead>

                                                        <tbody>
                                                            {supplierPurchases.map(
                                                                (purchase) => {
                                                                    const total =
                                                                        Number(
                                                                            purchase.totalAmount ??
                                                                            Number(
                                                                                purchase.paidAmount
                                                                            ) +
                                                                            Number(
                                                                                purchase.dueAmount
                                                                            )
                                                                        );

                                                                    const paid =
                                                                        Number(
                                                                            purchase.paidAmount ||
                                                                            0
                                                                        );

                                                                    const due =
                                                                        Number(
                                                                            purchase.dueAmount ||
                                                                            0
                                                                        );

                                                                    return (
                                                                        <tr
                                                                            key={
                                                                                purchase.id
                                                                            }
                                                                            className="border-t"
                                                                        >
                                                                            <td className="px-3 py-3 font-semibold">
                                                                                {
                                                                                    getInvoiceNumber(
                                                                                        purchase
                                                                                    )
                                                                                }
                                                                            </td>

                                                                            <td className="px-3 py-3 text-slate-600">
                                                                                {new Date(
                                                                                    purchase.purchaseDate
                                                                                ).toLocaleDateString(
                                                                                    "en-BD"
                                                                                )}
                                                                            </td>

                                                                            <td className="px-3 py-3 text-right">
                                                                                ৳{" "}
                                                                                {total.toLocaleString(
                                                                                    "en-BD",
                                                                                    {
                                                                                        minimumFractionDigits: 2,
                                                                                    }
                                                                                )}
                                                                            </td>

                                                                            <td className="px-3 py-3 text-right text-green-600">
                                                                                ৳{" "}
                                                                                {paid.toLocaleString(
                                                                                    "en-BD",
                                                                                    {
                                                                                        minimumFractionDigits: 2,
                                                                                    }
                                                                                )}
                                                                            </td>

                                                                            <td className="px-3 py-3 text-right font-bold text-red-600">
                                                                                {due >
                                                                                    0
                                                                                    ? `৳ ${due.toLocaleString(
                                                                                        "en-BD",
                                                                                        {
                                                                                            minimumFractionDigits: 2,
                                                                                        }
                                                                                    )}`
                                                                                    : "Paid"}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                }
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* AMOUNT + METHOD */}

                                <div className="grid gap-5 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Payment Amount *
                                        </label>

                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={form.amount}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    amount: e.target.value,
                                                })
                                            }
                                            placeholder="0.00"
                                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
                                        />

                                        {form.supplierId && (
                                            <p className="mt-1 text-xs text-slate-500">
                                                Outstanding: ৳{" "}
                                                {totalOutstanding.toLocaleString(
                                                    "en-BD",
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    }
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Payment Method *
                                        </label>

                                        <select
                                            value={form.paymentMethod}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    paymentMethod:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
                                        >
                                            <option value="Cash">
                                                Cash
                                            </option>

                                            <option value="Bank">
                                                Bank
                                            </option>

                                            <option value="bKash">
                                                bKash
                                            </option>

                                            <option value="Nagad">
                                                Nagad
                                            </option>

                                            <option value="Card">
                                                Card
                                            </option>

                                            <option value="Other">
                                                Other
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                {/* DATE */}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Payment Date *
                                    </label>

                                    <input
                                        type="date"
                                        value={form.paymentDate}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                paymentDate: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
                                    />
                                </div>

                                {/* NOTE */}

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Note
                                    </label>

                                    <textarea
                                        rows={3}
                                        value={form.note}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                note: e.target.value,
                                            })
                                        }
                                        placeholder="Optional note..."
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
                                    />
                                </div>

                                {/* ACTION BUTTONS */}

                                <div className="flex justify-end gap-3 border-t bg-white pt-5">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={loading}
                                        className="rounded-xl bg-slate-200 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={
                                            loading ||
                                            loadingPurchases
                                        }
                                        className="rounded-xl bg-green-600 px-7 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {loading
                                            ? "Saving..."
                                            : editingPayment
                                                ? "Update Payment"
                                                : "💸 Save Payment"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}