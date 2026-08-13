"use client";

import axios from "axios";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";

import PurchaseHeader from "@/components/purchase/PurchaseHeader";
import PurchaseForm from "@/components/purchase/PurchaseForm";

export default function PurchasePage() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [purchases, setPurchases] = useState<any[]>([]);

    const [selectedPurchase, setSelectedPurchase] =
        useState<any>(null);

    const [editingId, setEditingId] =
        useState<number | null>(null);

    const [initialData, setInitialData] =
        useState<any>(null);

    const [detailsOpen, setDetailsOpen] =
        useState(false);

    // ==========================================
    // LOAD PURCHASES
    // ==========================================

    useEffect(() => {
        loadPurchases();
    }, []);

    async function loadPurchases() {
        try {
            const response =
                await axios.get("/api/purchase");

            setPurchases(response.data);
        } catch (error) {
            console.error(error);

            toast.error(
                "Failed to load purchases"
            );
        }
    }

    // ==========================================
    // LOAD PURCHASE DETAILS
    // ==========================================

    async function loadPurchaseDetails(
        id: number
    ) {
        try {
            const response =
                await axios.get(
                    `/api/purchase/${id}`
                );

            setSelectedPurchase(
                response.data
            );

            setDetailsOpen(true);
        } catch (error) {
            console.error(error);

            toast.error(
                "Failed to load purchase"
            );
        }
    }

    // ==========================================
    // CREATE / UPDATE PURCHASE
    // ==========================================

    async function createPurchase(data: any) {
        try {
            setLoading(true);

            if (editingId) {
                const response =
                    await axios.put(
                        `/api/purchase/${editingId}`,
                        data
                    );

                toast.success(
                    response.data.message
                );

                await loadPurchases();

                setOpen(false);
                setEditingId(null);
                setInitialData(null);

                return;
            }

            const response =
                await axios.post(
                    "/api/purchase",
                    data
                );

            toast.success(
                response.data.message
            );

            await loadPurchases();

            setOpen(false);
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ??
                "Failed"
            );
        } finally {
            setLoading(false);
        }
    }

    // ==========================================
    // EDIT PURCHASE
    // ==========================================

    async function editPurchase(
        id: number
    ) {
        try {
            const response =
                await axios.get(
                    `/api/purchase/${id}`
                );

            setInitialData(
                response.data
            );

            setEditingId(id);

            setOpen(true);
        } catch (error) {
            console.error(error);

            toast.error(
                "Failed to load purchase"
            );
        }
    }

    // ==========================================
    // DELETE PURCHASE
    // ==========================================

    async function deletePurchase(
        id: number
    ) {
        const ok = confirm(
            "Are you sure you want to delete this purchase?"
        );

        if (!ok) return;

        try {
            setLoading(true);

            const response =
                await axios.delete(
                    `/api/purchase/${id}`
                );

            toast.success(
                response.data.message
            );

            await loadPurchases();
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ??
                "Failed to delete purchase"
            );
        } finally {
            setLoading(false);
        }
    }

    // ==========================================
    // CLOSE DETAILS
    // ==========================================

    function closeDetails() {
        setDetailsOpen(false);
        setSelectedPurchase(null);
    }

    // ==========================================
    // PRINT PURCHASE INVOICE
    // ==========================================

    function printPurchaseInvoice() {
        if (!selectedPurchase) {
            toast.error("Purchase details not found");
            return;
        }

        window.print();
    }

    // ==========================================
    // PURCHASE RETURN CALCULATIONS
    // ==========================================

    const purchaseReturns =
        selectedPurchase?.purchaseReturns ?? [];

    const totalPurchaseReturn =
        purchaseReturns.reduce(
            (
                sum: number,
                purchaseReturn: any
            ) =>
                sum +
                Number(
                    purchaseReturn.totalAmount ?? 0
                ),
            0
        );

    const totalReturnCashReceived =
        purchaseReturns.reduce(
            (
                sum: number,
                purchaseReturn: any
            ) =>
                sum +
                Number(
                    purchaseReturn.cashReceived ?? 0
                ),
            0
        );

    const totalReturnDueAdjusted =
        purchaseReturns.reduce(
            (
                sum: number,
                purchaseReturn: any
            ) =>
                sum +
                Number(
                    purchaseReturn.adjustedDue ?? 0
                ),
            0
        );

    // ==========================================
    // ORIGINAL PURCHASE VALUES
    // ==========================================

    const currentTotal =
        Number(
            selectedPurchase?.totalAmount ?? 0
        );

    const currentPaid =
        Number(
            selectedPurchase?.paidAmount ?? 0
        );

    const currentDue =
        Number(
            selectedPurchase?.dueAmount ?? 0
        );

    const originalTotal =
        currentTotal +
        totalPurchaseReturn;

    const originalPaid =
        currentPaid +
        totalReturnCashReceived;

    const originalDue =
        currentDue +
        totalReturnDueAdjusted;

    // ==========================================
    // MONEY FORMAT
    // ==========================================

    function money(value: number) {
        return Number(value || 0).toLocaleString(
            "en-BD",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }
        );
    }

    // ==========================================
    // UI
    // ==========================================

    return (
        <>
            {/* ====================================================== */}
            {/* NORMAL APPLICATION UI                                  */}
            {/* ====================================================== */}

            <div className="space-y-6 print:hidden">

                {/* HEADER */}

                <PurchaseHeader
                    onAdd={() => {
                        setEditingId(null);
                        setInitialData(null);
                        setOpen(true);
                    }}
                />

                {/* PURCHASE TABLE */}

                <div className="rounded-xl border bg-white shadow-sm">

                    <div className="overflow-x-auto">

                        <table className="w-full">

                            <thead className="border-b bg-slate-100">

                                <tr>

                                    <th className="px-5 py-4 text-left">
                                        Purchase No
                                    </th>

                                    <th className="px-5 py-4 text-left">
                                        Supplier
                                    </th>

                                    <th className="px-5 py-4 text-left">
                                        Date
                                    </th>

                                    <th className="px-5 py-4 text-right">
                                        Total
                                    </th>

                                    <th className="px-5 py-4 text-right">
                                        Paid
                                    </th>

                                    <th className="px-5 py-4 text-right">
                                        Due
                                    </th>

                                    <th className="px-5 py-4 text-center">
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {purchases.map(
                                    (purchase) => (

                                        <tr
                                            key={
                                                purchase.id
                                            }
                                            className="border-b hover:bg-slate-50"
                                        >

                                            <td className="px-5 py-4">

                                                <button
                                                    onClick={() =>
                                                        loadPurchaseDetails(
                                                            purchase.id
                                                        )
                                                    }
                                                    className="font-semibold text-blue-600 hover:underline"
                                                >
                                                    {
                                                        purchase.purchaseNo
                                                    }
                                                </button>

                                            </td>

                                            <td className="px-5 py-4">

                                                {
                                                    purchase
                                                        .supplier
                                                        ?.name
                                                }

                                            </td>

                                            <td className="px-5 py-4">

                                                {new Date(
                                                    purchase.purchaseDate
                                                ).toLocaleDateString(
                                                    "en-BD"
                                                )}

                                            </td>

                                            <td className="px-5 py-4 text-right">

                                                ৳{" "}
                                                {money(
                                                    Number(
                                                        purchase.totalAmount
                                                    )
                                                )}

                                            </td>

                                            <td className="px-5 py-4 text-right">

                                                ৳{" "}
                                                {money(
                                                    Number(
                                                        purchase.paidAmount
                                                    )
                                                )}

                                            </td>

                                            <td className="px-5 py-4 text-right font-semibold text-red-600">

                                                ৳{" "}
                                                {money(
                                                    Number(
                                                        purchase.dueAmount
                                                    )
                                                )}

                                            </td>

                                            <td className="px-5 py-4">

                                                <div className="flex justify-center gap-2">

                                                    <button
                                                        onClick={() =>
                                                            editPurchase(
                                                                purchase.id
                                                            )
                                                        }
                                                        className="rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-600"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            deletePurchase(
                                                                purchase.id
                                                            )
                                                        }
                                                        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

                {/* ================================================== */}
                {/* ADD / EDIT PURCHASE MODAL                         */}
                {/* ================================================== */}

                {open && (

                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">

                        <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">

                            <div className="mb-6 flex items-center justify-between">

                                <div>

                                    <h2 className="text-2xl font-bold">

                                        {editingId
                                            ? "Edit Purchase"
                                            : "New Purchase"}

                                    </h2>

                                    <p className="text-slate-500">

                                        {editingId
                                            ? "Update purchase invoice"
                                            : "Create a purchase invoice"}

                                    </p>

                                </div>

                                <button
                                    onClick={() => {
                                        setOpen(false);
                                        setEditingId(null);
                                        setInitialData(null);
                                    }}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                                >
                                    Close
                                </button>

                            </div>

                            <PurchaseForm
                                loading={loading}
                                initialData={initialData}
                                onSubmit={createPurchase}
                                onCancel={() => {
                                    setOpen(false);
                                    setEditingId(null);
                                    setInitialData(null);
                                }}
                            />

                        </div>

                    </div>

                )}

                {/* ================================================== */}
                {/* PURCHASE DETAILS MODAL                             */}
                {/* ================================================== */}

                {detailsOpen &&
                    selectedPurchase && (

                        <div
                            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6"
                            onMouseDown={(e) => {
                                if (
                                    e.target ===
                                    e.currentTarget
                                ) {
                                    closeDetails();
                                }
                            }}
                        >

                            <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">

                                {/* HEADER */}

                                <div className="mb-6 flex items-center justify-between border-b pb-5">

                                    <div>

                                        <h2 className="text-2xl font-bold text-slate-800">
                                            Purchase Details
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {
                                                selectedPurchase.purchaseNo
                                            }
                                        </p>

                                    </div>

                                    <div className="flex gap-2">

                                        <button
                                            onClick={
                                                printPurchaseInvoice
                                            }
                                            className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                                        >
                                            🖨️ Print Invoice
                                        </button>

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

                                {/* PURCHASE INFORMATION */}

                                <div className="grid gap-4 md:grid-cols-3">

                                    <div className="rounded-xl border bg-slate-50 p-4">

                                        <p className="text-sm text-slate-500">
                                            Purchase No
                                        </p>

                                        <p className="mt-1 font-bold">
                                            {
                                                selectedPurchase.purchaseNo
                                            }
                                        </p>

                                    </div>

                                    <div className="rounded-xl border bg-slate-50 p-4">

                                        <p className="text-sm text-slate-500">
                                            Supplier
                                        </p>

                                        <p className="mt-1 font-bold">
                                            {
                                                selectedPurchase
                                                    .supplier
                                                    ?.name
                                            }
                                        </p>

                                    </div>

                                    <div className="rounded-xl border bg-slate-50 p-4">

                                        <p className="text-sm text-slate-500">
                                            Purchase Date
                                        </p>

                                        <p className="mt-1 font-bold">
                                            {new Date(
                                                selectedPurchase.purchaseDate
                                            ).toLocaleDateString(
                                                "en-BD"
                                            )}
                                        </p>

                                    </div>

                                </div>

                                {/* PURCHASE ITEMS */}

                                <div className="mt-8">

                                    <h3 className="mb-4 text-lg font-bold text-slate-800">
                                        Purchase Items
                                    </h3>

                                    <div className="overflow-x-auto rounded-xl border">

                                        <table className="w-full min-w-[850px]">

                                            <thead className="bg-slate-100">

                                                <tr>

                                                    <th className="border-b px-4 py-3 text-left">
                                                        Product
                                                    </th>

                                                    <th className="border-b px-4 py-3 text-center">
                                                        Original Qty
                                                    </th>

                                                    <th className="border-b px-4 py-3 text-center">
                                                        Returned Qty
                                                    </th>

                                                    <th className="border-b px-4 py-3 text-center">
                                                        Remaining Qty
                                                    </th>

                                                    <th className="border-b px-4 py-3 text-right">
                                                        Buy Price
                                                    </th>

                                                    <th className="border-b px-4 py-3 text-right">
                                                        Original Total
                                                    </th>

                                                </tr>

                                            </thead>

                                            <tbody>

                                                {selectedPurchase.items?.map(
                                                    (
                                                        item: any
                                                    ) => {

                                                        const returnedQty =
                                                            (
                                                                item.purchaseReturnItems ??
                                                                []
                                                            ).reduce(
                                                                (
                                                                    sum: number,
                                                                    returnItem: any
                                                                ) =>
                                                                    sum +
                                                                    Number(
                                                                        returnItem.quantity ??
                                                                        0
                                                                    ),
                                                                0
                                                            );

                                                        const originalQty =
                                                            Number(
                                                                item.quantity ??
                                                                0
                                                            );

                                                        const remainingQty =
                                                            Math.max(
                                                                0,
                                                                originalQty -
                                                                returnedQty
                                                            );

                                                        const originalItemTotal =
                                                            originalQty *
                                                            Number(
                                                                item.buyPrice ??
                                                                0
                                                            );

                                                        return (

                                                            <tr
                                                                key={
                                                                    item.id
                                                                }
                                                                className="border-b"
                                                            >

                                                                <td className="px-4 py-3 font-semibold">

                                                                    {
                                                                        item
                                                                            .batch
                                                                            ?.product
                                                                            ?.name
                                                                    }

                                                                </td>

                                                                <td className="px-4 py-3 text-center font-semibold">

                                                                    {
                                                                        originalQty
                                                                    }

                                                                </td>

                                                                <td className="px-4 py-3 text-center font-semibold text-orange-600">

                                                                    {
                                                                        returnedQty
                                                                    }

                                                                </td>

                                                                <td className="px-4 py-3 text-center font-bold text-green-600">

                                                                    {
                                                                        remainingQty
                                                                    }

                                                                </td>

                                                                <td className="px-4 py-3 text-right">

                                                                    ৳{" "}
                                                                    {money(
                                                                        Number(
                                                                            item.buyPrice ??
                                                                            0
                                                                        )
                                                                    )}

                                                                </td>

                                                                <td className="px-4 py-3 text-right">

                                                                    ৳{" "}
                                                                    {money(
                                                                        originalItemTotal
                                                                    )}

                                                                </td>

                                                            </tr>

                                                        );
                                                    }
                                                )}

                                            </tbody>

                                        </table>

                                    </div>

                                </div>

                                {/* PURCHASE RETURN HISTORY */}

                                <div className="mt-8">

                                    <div className="mb-4">

                                        <h3 className="text-lg font-bold text-slate-800">
                                            🔄 Purchase Return History
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            All Return history from This Purchase
                                        </p>

                                    </div>

                                    {purchaseReturns.length ===
                                        0 ? (

                                        <div className="rounded-xl border border-dashed bg-slate-50 p-6 text-center text-slate-500">

                                            No Return create from this Prchase

                                        </div>

                                    ) : (

                                        <div className="overflow-x-auto rounded-xl border">

                                            <table className="w-full min-w-[900px]">

                                                <thead className="bg-orange-50">

                                                    <tr>

                                                        <th className="border-b px-4 py-3 text-left">
                                                            Return Date
                                                        </th>

                                                        <th className="border-b px-4 py-3 text-left">
                                                            Product
                                                        </th>

                                                        <th className="border-b px-4 py-3 text-center">
                                                            Qty
                                                        </th>

                                                        <th className="border-b px-4 py-3 text-right">
                                                            Return Amount
                                                        </th>

                                                        <th className="border-b px-4 py-3 text-right">
                                                            Cash Received
                                                        </th>

                                                        <th className="border-b px-4 py-3 text-right">
                                                            Due Adjusted
                                                        </th>

                                                        <th className="border-b px-4 py-3 text-left">
                                                            Reason
                                                        </th>

                                                    </tr>

                                                </thead>

                                                <tbody>

                                                    {purchaseReturns.map(
                                                        (
                                                            purchaseReturn: any
                                                        ) => (

                                                            purchaseReturn
                                                                .items
                                                                ?.map(
                                                                    (
                                                                        returnItem: any
                                                                    ) => (

                                                                        <tr
                                                                            key={`${purchaseReturn.id}-${returnItem.id}`}
                                                                            className="border-b"
                                                                        >

                                                                            <td className="px-4 py-3">

                                                                                {new Date(
                                                                                    purchaseReturn.returnDate
                                                                                ).toLocaleDateString(
                                                                                    "en-BD"
                                                                                )}

                                                                            </td>

                                                                            <td className="px-4 py-3 font-semibold">

                                                                                {
                                                                                    returnItem
                                                                                        .batch
                                                                                        ?.product
                                                                                        ?.name
                                                                                }

                                                                            </td>

                                                                            <td className="px-4 py-3 text-center font-semibold text-orange-600">

                                                                                {
                                                                                    returnItem.quantity
                                                                                }

                                                                            </td>

                                                                            <td className="px-4 py-3 text-right font-semibold">

                                                                                ৳{" "}
                                                                                {money(
                                                                                    Number(
                                                                                        returnItem.totalPrice ??
                                                                                        0
                                                                                    )
                                                                                )}

                                                                            </td>

                                                                            <td className="px-4 py-3 text-right text-green-600">

                                                                                ৳{" "}
                                                                                {money(
                                                                                    Number(
                                                                                        purchaseReturn.cashReceived ??
                                                                                        0
                                                                                    )
                                                                                )}

                                                                            </td>

                                                                            <td className="px-4 py-3 text-right text-blue-600">

                                                                                ৳{" "}
                                                                                {money(
                                                                                    Number(
                                                                                        purchaseReturn.adjustedDue ??
                                                                                        0
                                                                                    )
                                                                                )}

                                                                            </td>

                                                                            <td className="px-4 py-3">

                                                                                {
                                                                                    purchaseReturn.reason ??
                                                                                    "-"
                                                                                }

                                                                            </td>

                                                                        </tr>

                                                                    )
                                                                )

                                                        )
                                                    )}

                                                </tbody>

                                            </table>

                                        </div>

                                    )}

                                </div>

                                {/* RETURN SUMMARY */}

                                <div className="mt-8 grid gap-4 md:grid-cols-3">

                                    <div className="rounded-xl border bg-orange-50 p-5">

                                        <p className="text-sm font-semibold text-orange-600">
                                            Total Purchase Return
                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-orange-700">

                                            ৳{" "}
                                            {money(
                                                totalPurchaseReturn
                                            )}

                                        </p>

                                    </div>

                                    <div className="rounded-xl border bg-green-50 p-5">

                                        <p className="text-sm font-semibold text-green-600">
                                            Return Cash Received
                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-green-700">

                                            ৳{" "}
                                            {money(
                                                totalReturnCashReceived
                                            )}

                                        </p>

                                    </div>

                                    <div className="rounded-xl border bg-blue-50 p-5">

                                        <p className="text-sm font-semibold text-blue-600">
                                            Return Due Adjusted
                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-blue-700">

                                            ৳{" "}
                                            {money(
                                                totalReturnDueAdjusted
                                            )}

                                        </p>

                                    </div>

                                </div>

                                {/* PAYMENT SUMMARY */}

                                <div className="mt-8">

                                    <h3 className="mb-4 text-lg font-bold text-slate-800">
                                        💰 Purchase Payment Summary
                                    </h3>

                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                                        <div className="rounded-xl border bg-slate-50 p-5">

                                            <p className="text-sm text-slate-500">
                                                Original Purchase
                                            </p>

                                            <p className="mt-2 text-xl font-bold">

                                                ৳{" "}
                                                {money(
                                                    originalTotal
                                                )}

                                            </p>

                                        </div>

                                        <div className="rounded-xl border bg-green-50 p-5">

                                            <p className="text-sm text-green-600">
                                                Original Paid
                                            </p>

                                            <p className="mt-2 text-xl font-bold text-green-700">

                                                ৳{" "}
                                                {money(
                                                    originalPaid
                                                )}

                                            </p>

                                        </div>

                                        <div className="rounded-xl border bg-red-50 p-5">

                                            <p className="text-sm text-red-600">
                                                Original Due
                                            </p>

                                            <p className="mt-2 text-xl font-bold text-red-700">

                                                ৳{" "}
                                                {money(
                                                    originalDue
                                                )}

                                            </p>

                                        </div>

                                        <div className="rounded-xl border bg-blue-50 p-5">

                                            <p className="text-sm text-blue-600">
                                                Current Due
                                            </p>

                                            <p className="mt-2 text-xl font-bold text-blue-700">

                                                ৳{" "}
                                                {money(
                                                    currentDue
                                                )}

                                            </p>

                                        </div>

                                    </div>

                                </div>

                                {/* DUE ADJUSTMENT EXPLANATION */}

                                <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">

                                    <h3 className="font-bold text-blue-800">
                                        📘 Adjusted Due after Return
                                    </h3>

                                    <div className="mt-3 space-y-2 text-sm text-blue-900">

                                        <p>
                                            Original Due:
                                            <span className="ml-2 font-bold">
                                                ৳{" "}
                                                {money(
                                                    originalDue
                                                )}
                                            </span>
                                        </p>

                                        <p>
                                            Return Due Adjusted:
                                            <span className="ml-2 font-bold text-blue-700">
                                                - ৳{" "}
                                                {money(
                                                    totalReturnDueAdjusted
                                                )}
                                            </span>
                                        </p>

                                        <div className="border-t border-blue-200 pt-2">

                                            <p className="font-bold">

                                                Current Due:
                                                <span className="ml-2 text-red-600">
                                                    ৳{" "}
                                                    {money(
                                                        currentDue
                                                    )}
                                                </span>

                                            </p>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    )}

            </div>

            {/* ====================================================== */}
            {/* PRINT INVOICE                                          */}
            {/* ====================================================== */}

            {selectedPurchase && (

                <div
                    id="purchase-print-invoice"
                    className="hidden print:block"
                >

                    <div className="mx-auto min-h-screen max-w-[210mm] bg-white px-[12mm] py-[10mm] text-slate-900">

                        {/* ========================================== */}
                        {/* SHOP HEADER                                */}
                        {/* ========================================== */}

                        <div className="border-b-2 border-slate-900 pb-5">

                            <div className="flex items-start justify-between gap-8">

                                <div>

                                    <h1 className="text-3xl font-extrabold tracking-tight">
                                        AGRO SHOP
                                    </h1>

                                    <p className="mt-1 text-sm text-slate-600">
                                        Fertilizer • Chemical • Agricultural Products
                                    </p>

                                    <p className="mt-3 text-sm text-slate-600">
                                        Purchase Management System
                                    </p>

                                </div>

                                <div className="text-right">

                                    <h2 className="text-2xl font-extrabold uppercase">
                                        Purchase Invoice
                                    </h2>

                                    <p className="mt-2 text-sm">
                                        <span className="font-semibold">
                                            Invoice No:
                                        </span>{" "}
                                        {selectedPurchase.purchaseNo}
                                    </p>

                                    <p className="mt-1 text-sm">
                                        <span className="font-semibold">
                                            Date:
                                        </span>{" "}
                                        {new Date(
                                            selectedPurchase.purchaseDate
                                        ).toLocaleDateString(
                                            "en-BD"
                                        )}

                                    </p>

                                </div>

                            </div>

                        </div>

                        {/* ========================================== */}
                        {/* SUPPLIER INFORMATION                       */}
                        {/* ========================================== */}

                        <div className="mt-6 grid grid-cols-2 gap-8">

                            <div>

                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Supplier Information
                                </p>

                                <div className="rounded-lg border border-slate-300 p-4">

                                    <p className="text-lg font-bold">
                                        {
                                            selectedPurchase
                                                .supplier
                                                ?.name ?? "-"
                                        }
                                    </p>

                                    {selectedPurchase
                                        .supplier
                                        ?.company && (

                                            <p className="mt-1 text-sm text-slate-600">
                                                {
                                                    selectedPurchase
                                                        .supplier
                                                        .company
                                                }
                                            </p>

                                        )}

                                    {selectedPurchase
                                        .supplier
                                        ?.phone && (

                                            <p className="mt-2 text-sm">
                                                <span className="font-semibold">
                                                    Phone:
                                                </span>{" "}
                                                {
                                                    selectedPurchase
                                                        .supplier
                                                        .phone
                                                }
                                            </p>

                                        )}

                                    {selectedPurchase
                                        .supplier
                                        ?.email && (

                                            <p className="mt-1 text-sm">
                                                <span className="font-semibold">
                                                    Email:
                                                </span>{" "}
                                                {
                                                    selectedPurchase
                                                        .supplier
                                                        .email
                                                }
                                            </p>

                                        )}

                                    {selectedPurchase
                                        .supplier
                                        ?.address && (

                                            <p className="mt-1 text-sm">
                                                <span className="font-semibold">
                                                    Address:
                                                </span>{" "}
                                                {
                                                    selectedPurchase
                                                        .supplier
                                                        .address
                                                }
                                            </p>

                                        )}

                                </div>

                            </div>

                            <div>

                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Purchase Information
                                </p>

                                <div className="rounded-lg border border-slate-300 p-4">

                                    <div className="flex justify-between border-b pb-2 text-sm">

                                        <span className="text-slate-600">
                                            Purchase No
                                        </span>

                                        <span className="font-semibold">
                                            {
                                                selectedPurchase.purchaseNo
                                            }
                                        </span>

                                    </div>

                                    <div className="mt-2 flex justify-between border-b pb-2 text-sm">

                                        <span className="text-slate-600">
                                            Purchase Date
                                        </span>

                                        <span className="font-semibold">
                                            {new Date(
                                                selectedPurchase.purchaseDate
                                            ).toLocaleDateString(
                                                "en-BD"
                                            )}
                                        </span>

                                    </div>

                                    <div className="mt-2 flex justify-between text-sm">

                                        <span className="text-slate-600">
                                            Status
                                        </span>

                                        <span className="font-semibold">
                                            {currentDue > 0
                                                ? "Due"
                                                : "Paid"}
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* ========================================== */}
                        {/* ITEMS TABLE                                 */}
                        {/* ========================================== */}

                        <div className="mt-8">

                            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">
                                Purchase Items
                            </h3>

                            <table className="w-full border-collapse text-sm">

                                <thead>

                                    <tr className="border-y-2 border-slate-900">

                                        <th className="px-2 py-3 text-left">
                                            #
                                        </th>

                                        <th className="px-2 py-3 text-left">
                                            Product
                                        </th>

                                        <th className="px-2 py-3 text-center">
                                            Original Qty
                                        </th>

                                        <th className="px-2 py-3 text-center">
                                            Returned
                                        </th>

                                        <th className="px-2 py-3 text-center">
                                            Remaining
                                        </th>

                                        <th className="px-2 py-3 text-right">
                                            Buy Price
                                        </th>

                                        <th className="px-2 py-3 text-right">
                                            Total
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {selectedPurchase.items?.map(
                                        (
                                            item: any,
                                            index: number
                                        ) => {

                                            const returnedQty =
                                                (
                                                    item.purchaseReturnItems ??
                                                    []
                                                ).reduce(
                                                    (
                                                        sum: number,
                                                        returnItem: any
                                                    ) =>
                                                        sum +
                                                        Number(
                                                            returnItem.quantity ??
                                                            0
                                                        ),
                                                    0
                                                );

                                            const originalQty =
                                                Number(
                                                    item.quantity ?? 0
                                                );

                                            const remainingQty =
                                                Math.max(
                                                    0,
                                                    originalQty -
                                                    returnedQty
                                                );

                                            const originalItemTotal =
                                                originalQty *
                                                Number(
                                                    item.buyPrice ?? 0
                                                );

                                            return (

                                                <tr
                                                    key={
                                                        item.id
                                                    }
                                                    className="border-b border-slate-300"
                                                >

                                                    <td className="px-2 py-3">
                                                        {index + 1}
                                                    </td>

                                                    <td className="px-2 py-3 font-semibold">
                                                        {
                                                            item
                                                                .batch
                                                                ?.product
                                                                ?.name ?? "-"
                                                        }
                                                    </td>

                                                    <td className="px-2 py-3 text-center">
                                                        {
                                                            originalQty
                                                        }
                                                    </td>

                                                    <td className="px-2 py-3 text-center">
                                                        {
                                                            returnedQty
                                                        }
                                                    </td>

                                                    <td className="px-2 py-3 text-center font-semibold">
                                                        {
                                                            remainingQty
                                                        }
                                                    </td>

                                                    <td className="px-2 py-3 text-right">
                                                        ৳{" "}
                                                        {money(
                                                            Number(
                                                                item.buyPrice ?? 0
                                                            )
                                                        )}
                                                    </td>

                                                    <td className="px-2 py-3 text-right font-semibold">
                                                        ৳{" "}
                                                        {money(
                                                            originalItemTotal
                                                        )}
                                                    </td>

                                                </tr>

                                            );
                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>

                        {/* ========================================== */}
                        {/* PURCHASE TOTAL                              */}
                        {/* ========================================== */}

                        <div className="mt-6 flex justify-end">

                            <div className="w-[90mm]">

                                <div className="flex justify-between border-b py-2 text-sm">

                                    <span>
                                        Original Purchase
                                    </span>

                                    <span className="font-semibold">
                                        ৳ {money(originalTotal)}
                                    </span>

                                </div>

                                {totalPurchaseReturn > 0 && (

                                    <div className="flex justify-between border-b py-2 text-sm">

                                        <span>
                                            Purchase Return
                                        </span>

                                        <span className="font-semibold">
                                            - ৳{" "}
                                            {money(
                                                totalPurchaseReturn
                                            )}
                                        </span>

                                    </div>

                                )}

                                <div className="flex justify-between border-b-2 border-slate-900 py-3 text-lg font-bold">

                                    <span>
                                        Current Purchase Total
                                    </span>

                                    <span>
                                        ৳{" "}
                                        {money(currentTotal)}
                                    </span>

                                </div>

                            </div>

                        </div>

                        {/* ========================================== */}
                        {/* PAYMENT SUMMARY                             */}
                        {/* ========================================== */}

                        <div className="mt-8">

                            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">
                                Payment Summary
                            </h3>

                            <div className="grid grid-cols-4 gap-3">

                                <div className="rounded border border-slate-300 p-3">

                                    <p className="text-xs text-slate-500">
                                        Original Paid
                                    </p>

                                    <p className="mt-1 font-bold">
                                        ৳ {money(originalPaid)}
                                    </p>

                                </div>

                                <div className="rounded border border-slate-300 p-3">

                                    <p className="text-xs text-slate-500">
                                        Original Due
                                    </p>

                                    <p className="mt-1 font-bold">
                                        ৳ {money(originalDue)}
                                    </p>

                                </div>

                                <div className="rounded border border-slate-300 p-3">

                                    <p className="text-xs text-slate-500">
                                        Return Cash
                                    </p>

                                    <p className="mt-1 font-bold">
                                        ৳{" "}
                                        {money(
                                            totalReturnCashReceived
                                        )}
                                    </p>

                                </div>

                                <div className="rounded border border-slate-300 p-3">

                                    <p className="text-xs text-slate-500">
                                        Return Due Adjusted
                                    </p>

                                    <p className="mt-1 font-bold">
                                        ৳{" "}
                                        {money(
                                            totalReturnDueAdjusted
                                        )}
                                    </p>

                                </div>

                            </div>

                        </div>

                        {/* ========================================== */}
                        {/* CURRENT BALANCE                             */}
                        {/* ========================================== */}

                        <div className="mt-6 flex justify-end">

                            <div className="w-[90mm] border-2 border-slate-900">

                                <div className="flex justify-between px-4 py-3 text-lg font-bold">

                                    <span>
                                        Current Due
                                    </span>

                                    <span>
                                        ৳ {money(currentDue)}
                                    </span>

                                </div>

                            </div>

                        </div>

                        {/* ========================================== */}
                        {/* RETURN HISTORY                              */}
                        {/* ========================================== */}

                        {purchaseReturns.length > 0 && (

                            <div className="mt-8">

                                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">
                                    Purchase Return History
                                </h3>

                                <table className="w-full border-collapse text-xs">

                                    <thead>

                                        <tr className="border-y border-slate-900">

                                            <th className="px-2 py-2 text-left">
                                                Date
                                            </th>

                                            <th className="px-2 py-2 text-left">
                                                Product
                                            </th>

                                            <th className="px-2 py-2 text-center">
                                                Qty
                                            </th>

                                            <th className="px-2 py-2 text-right">
                                                Return Amount
                                            </th>

                                            <th className="px-2 py-2 text-right">
                                                Cash Received
                                            </th>

                                            <th className="px-2 py-2 text-right">
                                                Due Adjusted
                                            </th>

                                            <th className="px-2 py-2 text-left">
                                                Reason
                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {purchaseReturns.map(
                                            (
                                                purchaseReturn: any
                                            ) =>
                                                purchaseReturn.items?.map(
                                                    (
                                                        returnItem: any
                                                    ) => (

                                                        <tr
                                                            key={`${purchaseReturn.id}-${returnItem.id}`}
                                                            className="border-b border-slate-300"
                                                        >

                                                            <td className="px-2 py-2">
                                                                {new Date(
                                                                    purchaseReturn.returnDate
                                                                ).toLocaleDateString(
                                                                    "en-BD"
                                                                )}
                                                            </td>

                                                            <td className="px-2 py-2 font-semibold">
                                                                {
                                                                    returnItem
                                                                        .batch
                                                                        ?.product
                                                                        ?.name ?? "-"
                                                                }
                                                            </td>

                                                            <td className="px-2 py-2 text-center">
                                                                {
                                                                    returnItem.quantity
                                                                }
                                                            </td>

                                                            <td className="px-2 py-2 text-right">
                                                                ৳{" "}
                                                                {money(
                                                                    Number(
                                                                        returnItem.totalPrice ?? 0
                                                                    )
                                                                )}
                                                            </td>

                                                            <td className="px-2 py-2 text-right">
                                                                ৳{" "}
                                                                {money(
                                                                    Number(
                                                                        purchaseReturn.cashReceived ?? 0
                                                                    )
                                                                )}
                                                            </td>

                                                            <td className="px-2 py-2 text-right">
                                                                ৳{" "}
                                                                {money(
                                                                    Number(
                                                                        purchaseReturn.adjustedDue ?? 0
                                                                    )
                                                                )}
                                                            </td>

                                                            <td className="px-2 py-2">
                                                                {
                                                                    purchaseReturn.reason ??
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

                        )}

                        {/* ========================================== */}
                        {/* NOTE                                        */}
                        {/* ========================================== */}

                        {selectedPurchase.note && (

                            <div className="mt-8 rounded border border-slate-300 p-4">

                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Note
                                </p>

                                <p className="mt-2 text-sm">
                                    {
                                        selectedPurchase.note
                                    }
                                </p>

                            </div>

                        )}

                        {/* ========================================== */}
                        {/* FOOTER                                      */}
                        {/* ========================================== */}

                        <div className="mt-12 border-t border-slate-300 pt-6">

                            <div className="flex justify-between text-xs text-slate-500">

                                <div>
                                    <p>
                                        Generated from Agro Shop CRM
                                    </p>

                                    <p className="mt-1">
                                        This is a computer-generated purchase invoice.
                                    </p>
                                </div>

                                <div className="text-right">

                                    <div className="mt-8 border-t border-slate-500 pt-1">
                                        Authorized Signature
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            )}

            {/* ====================================================== */}
            {/* PRINT CSS                                              */}
            {/* ====================================================== */}

            <style jsx global>{`

                @media print {

                    @page {
                        size: A4;
                        margin: 0;
                    }

                    html,
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }

                    body * {
                        visibility: hidden !important;
                    }

                    #purchase-print-invoice,
                    #purchase-print-invoice * {
                        visibility: visible !important;
                    }

                    #purchase-print-invoice {
                        display: block !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white !important;
                    }

                    #purchase-print-invoice table {
                        page-break-inside: auto;
                    }

                    #purchase-print-invoice tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }

                    #purchase-print-invoice h1,
                    #purchase-print-invoice h2,
                    #purchase-print-invoice h3 {
                        page-break-after: avoid;
                    }

                }

            `}</style>
        </>
    );
}