"use client";

import axios from "axios";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";

export default function PurchaseReturnPage() {
    const [returns, setReturns] = useState<any[]>([]);
    const [purchases, setPurchases] = useState<any[]>([]);

    const [open, setOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const [loading, setLoading] = useState(false);

    const [selectedReturn, setSelectedReturn] =
        useState<any>(null);

    const [selectedPurchase, setSelectedPurchase] =
        useState<any>(null);

    const [purchaseId, setPurchaseId] =
        useState("");

    const [returnDate, setReturnDate] =
        useState(
            new Date().toISOString().split("T")[0]
        );

    const [cashReceived, setCashReceived] =
        useState("");

    const [adjustedDue, setAdjustedDue] =
        useState("");

    const [reason, setReason] =
        useState("");

    const [items, setItems] =
        useState<any[]>([]);

    // ======================================
    // LOAD DATA
    // ======================================

    useEffect(() => {
        loadReturns();
        loadPurchases();
    }, []);

    async function loadReturns() {
        try {
            const response =
                await axios.get(
                    "/api/purchase-return"
                );

            setReturns(response.data);
        } catch (error) {
            console.error(error);
            toast.error(
                "Failed to load purchase returns"
            );
        }
    }

    async function loadPurchases() {
        try {
            const response =
                await axios.get(
                    "/api/purchase"
                );

            setPurchases(response.data);
        } catch (error) {
            console.error(error);
            toast.error(
                "Failed to load purchases"
            );
        }
    }

    // ======================================
    // SELECT PURCHASE
    // ======================================

    async function handlePurchaseChange(
        id: string
    ) {
        setPurchaseId(id);

        if (!id) {
            setSelectedPurchase(null);
            setItems([]);
            return;
        }

        try {
            const response =
                await axios.get(
                    `/api/purchase/${id}`
                );

            const purchase =
                response.data;

            setSelectedPurchase(purchase);

            setItems(
                (purchase.items || []).map(
                    (item: any) => ({
                        purchaseItemId:
                            item.id,

                        productName:
                            item.batch?.product
                                ?.name ||
                            "Unknown Product",

                        purchasedQuantity:
                            Number(
                                item.quantity
                            ),

                        quantity: 0,

                        buyPrice:
                            Number(
                                item.buyPrice
                            ),

                        totalPrice: 0,
                    })
                )
            );

        } catch (error) {
            console.error(error);

            toast.error(
                "Failed to load purchase details"
            );
        }
    }

    // ======================================
    // CHANGE RETURN QUANTITY
    // ======================================

    function changeQuantity(
        index: number,
        value: string
    ) {
        const quantity =
            Number(value) || 0;

        setItems((previous) =>
            previous.map(
                (item, i) => {
                    if (i !== index) {
                        return item;
                    }

                    const safeQuantity =
                        Math.min(
                            Math.max(
                                quantity,
                                0
                            ),
                            item.purchasedQuantity
                        );

                    return {
                        ...item,

                        quantity:
                            safeQuantity,

                        totalPrice:
                            safeQuantity *
                            item.buyPrice,
                    };
                }
            )
        );
    }

    // ======================================
    // TOTAL RETURN
    // ======================================

    const totalReturnAmount =
        items.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.totalPrice || 0
                ),
            0
        );

    // ======================================
    // CREATE RETURN
    // ======================================

    async function createReturn() {
        try {
            if (!purchaseId) {
                toast.error(
                    "Please select a purchase"
                );
                return;
            }

            const selectedItems =
                items.filter(
                    (item) =>
                        Number(
                            item.quantity
                        ) > 0
                );

            if (
                selectedItems.length === 0
            ) {
                toast.error(
                    "Please enter return quantity"
                );
                return;
            }

            const cash =
                Number(
                    cashReceived || 0
                );

            const due =
                Number(
                    adjustedDue || 0
                );

            if (
                cash + due >
                totalReturnAmount
            ) {
                toast.error(
                    "Cash received + adjusted due cannot be greater than return amount"
                );
                return;
            }

            setLoading(true);

            const response =
                await axios.post(
                    "/api/purchase-return",
                    {
                        purchaseId:
                            Number(
                                purchaseId
                            ),

                        supplierId:
                            Number(
                                selectedPurchase
                                    .supplierId
                            ),

                        returnDate,

                        cashReceived:
                            cash,

                        adjustedDue:
                            due,

                        reason:
                            reason ||
                            null,

                        items:
                            selectedItems.map(
                                (item) => ({
                                    purchaseItemId:
                                        item.purchaseItemId,

                                    quantity:
                                        Number(
                                            item.quantity
                                        ),
                                })
                            ),
                    }
                );

            toast.success(
                response.data.message ||
                "Purchase return created successfully"
            );

            resetForm();

            await loadReturns();
            await loadPurchases();

        } catch (error: any) {
            console.error(error);

            toast.error(
                error?.response?.data
                    ?.error ||
                error?.response?.data
                    ?.message ||
                "Failed to create purchase return"
            );
        } finally {
            setLoading(false);
        }
    }

    // ======================================
    // RESET FORM
    // ======================================

    function resetForm() {
        setOpen(false);

        setPurchaseId("");

        setSelectedPurchase(null);

        setItems([]);

        setReturnDate(
            new Date()
                .toISOString()
                .split("T")[0]
        );

        setCashReceived("");

        setAdjustedDue("");

        setReason("");
    }

    // ======================================
    // VIEW DETAILS
    // ======================================

    async function viewReturn(id: number) {
        try {
            const response =
                await axios.get(
                    `/api/purchase-return/${id}`
                );

            setSelectedReturn(
                response.data
            );

            setDetailsOpen(true);
        } catch (error) {
            console.error(error);

            toast.error(
                "Failed to load return details"
            );
        }
    }

    // ======================================
    // DELETE RETURN
    // ======================================

    async function deleteReturn(
        id: number
    ) {
        const confirmed =
            confirm(
                "Are you sure you want to delete this purchase return?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);

            const response =
                await axios.delete(
                    `/api/purchase-return/${id}`
                );

            toast.success(
                response.data.message ||
                "Purchase return deleted successfully"
            );

            await loadReturns();
            await loadPurchases();

        } catch (error: any) {
            console.error(error);

            toast.error(
                error?.response?.data
                    ?.error ||
                error?.response?.data
                    ?.message ||
                "Failed to delete purchase return"
            );
        } finally {
            setLoading(false);
        }
    }

    // ======================================
    // UI
    // ======================================

    return (
        <div className="space-y-6">

            {/* ==================================
                HEADER
            ================================== */}

            <div className="flex items-center justify-between">

                <div>
                    <h1 className="text-2xl font-bold">
                        Purchase Return
                    </h1>

                    <p className="text-sm text-slate-500">
                        Manage returned products from suppliers
                    </p>
                </div>

                <button
                    onClick={() =>
                        setOpen(true)
                    }
                    className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                >
                    + New Purchase Return
                </button>

            </div>

            {/* ==================================
                RETURN LIST
            ================================== */}

            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

                <table className="w-full">

                    <thead className="border-b bg-slate-100">

                        <tr>

                            <th className="px-5 py-4 text-left">
                                Return #
                            </th>

                            <th className="px-5 py-4 text-left">
                                Purchase
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
                                Cash
                            </th>

                            <th className="px-5 py-4 text-right">
                                Adjusted Due
                            </th>

                            <th className="px-5 py-4 text-center">
                                Action
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {returns.length === 0 ? (

                            <tr>

                                <td
                                    colSpan={8}
                                    className="px-5 py-12 text-center text-slate-500"
                                >
                                    No purchase returns found.
                                </td>

                            </tr>

                        ) : (

                            returns.map(
                                (item) => (

                                    <tr
                                        key={
                                            item.id
                                        }
                                        className="border-b hover:bg-slate-50"
                                    >

                                        <td className="px-5 py-4">

                                            <button
                                                onClick={() =>
                                                    viewReturn(
                                                        item.id
                                                    )
                                                }
                                                className="font-semibold text-blue-600 hover:underline"
                                            >
                                                #{item.id}
                                            </button>

                                        </td>

                                        <td className="px-5 py-4">

                                            {item.purchase
                                                ?.purchaseNo ||
                                                "-"}

                                        </td>

                                        <td className="px-5 py-4">

                                            {item.supplier
                                                ?.name ||
                                                "-"}

                                        </td>

                                        <td className="px-5 py-4">

                                            {new Date(
                                                item.returnDate
                                            ).toLocaleDateString()}

                                        </td>

                                        <td className="px-5 py-4 text-right font-semibold">

                                            ৳{" "}
                                            {Number(
                                                item.totalAmount
                                            ).toLocaleString()}

                                        </td>

                                        <td className="px-5 py-4 text-right text-green-600">

                                            ৳{" "}
                                            {Number(
                                                item.cashReceived ||
                                                0
                                            ).toLocaleString()}

                                        </td>

                                        <td className="px-5 py-4 text-right text-orange-600">

                                            ৳{" "}
                                            {Number(
                                                item.adjustedDue ||
                                                0
                                            ).toLocaleString()}

                                        </td>

                                        <td className="px-5 py-4">

                                            <div className="flex justify-center gap-2">

                                                <button
                                                    onClick={() =>
                                                        viewReturn(
                                                            item.id
                                                        )
                                                    }
                                                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                                >
                                                    View
                                                </button>

                                                <button
                                                    disabled={
                                                        loading
                                                    }
                                                    onClick={() =>
                                                        deleteReturn(
                                                            item.id
                                                        )
                                                    }
                                                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                )
                            )

                        )}

                    </tbody>

                </table>

            </div>

            {/* ==================================
                NEW RETURN MODAL
            ================================== */}

            {open && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">

                    <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">

                        <div className="mb-6 flex items-center justify-between">

                            <div>

                                <h2 className="text-2xl font-bold">
                                    New Purchase Return
                                </h2>

                                <p className="text-slate-500">
                                    Return products to supplier
                                </p>

                            </div>

                            <button
                                onClick={
                                    resetForm
                                }
                                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                            >
                                Close
                            </button>

                        </div>

                        {/* ==================================
                            PURCHASE INFO
                        ================================== */}

                        <div className="grid gap-5 md:grid-cols-3">

                            <div>

                                <label className="mb-2 block font-semibold">
                                    Purchase
                                </label>

                                <select
                                    value={
                                        purchaseId
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        handlePurchaseChange(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    className="w-full rounded-lg border px-4 py-3"
                                >

                                    <option value="">
                                        Select Purchase
                                    </option>

                                    {purchases.map(
                                        (
                                            purchase
                                        ) => (

                                            <option
                                                key={
                                                    purchase.id
                                                }
                                                value={
                                                    purchase.id
                                                }
                                            >
                                                {
                                                    purchase.purchaseNo
                                                }{" "}
                                                —{" "}
                                                {
                                                    purchase
                                                        .supplier
                                                        ?.name
                                                }
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>

                            <div>

                                <label className="mb-2 block font-semibold">
                                    Supplier
                                </label>

                                <input
                                    value={
                                        selectedPurchase
                                            ?.supplier
                                            ?.name ||
                                        ""
                                    }
                                    readOnly
                                    className="w-full rounded-lg border bg-slate-100 px-4 py-3"
                                />

                            </div>

                            <div>

                                <label className="mb-2 block font-semibold">
                                    Return Date
                                </label>

                                <input
                                    type="date"
                                    value={
                                        returnDate
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setReturnDate(
                                            e
                                                .target
                                                .value
                                        )
                                    }
                                    className="w-full rounded-lg border px-4 py-3"
                                />

                            </div>

                        </div>

                        {/* ==================================
                            PURCHASE SUMMARY
                        ================================== */}

                        {selectedPurchase && (

                            <div className="mt-6 grid gap-4 md:grid-cols-3">

                                <div className="rounded-xl border bg-slate-50 p-4">

                                    <p className="text-sm text-slate-500">
                                        Purchase Total
                                    </p>

                                    <p className="text-xl font-bold">
                                        ৳{" "}
                                        {Number(
                                            selectedPurchase.totalAmount
                                        ).toLocaleString()}
                                    </p>

                                </div>

                                <div className="rounded-xl border bg-green-50 p-4">

                                    <p className="text-sm text-slate-500">
                                        Paid
                                    </p>

                                    <p className="text-xl font-bold text-green-600">
                                        ৳{" "}
                                        {Number(
                                            selectedPurchase.paidAmount
                                        ).toLocaleString()}
                                    </p>

                                </div>

                                <div className="rounded-xl border bg-red-50 p-4">

                                    <p className="text-sm text-slate-500">
                                        Due
                                    </p>

                                    <p className="text-xl font-bold text-red-600">
                                        ৳{" "}
                                        {Number(
                                            selectedPurchase.dueAmount
                                        ).toLocaleString()}
                                    </p>

                                </div>

                            </div>

                        )}

                        {/* ==================================
                            ITEMS
                        ================================== */}

                        {items.length > 0 && (

                            <div className="mt-8">

                                <h3 className="mb-4 text-lg font-bold">
                                    Return Items
                                </h3>

                                <div className="overflow-hidden rounded-xl border">

                                    <table className="w-full">

                                        <thead className="bg-slate-100">

                                            <tr>

                                                <th className="px-4 py-3 text-left">
                                                    Product
                                                </th>

                                                <th className="px-4 py-3 text-center">
                                                    Purchased
                                                </th>

                                                <th className="px-4 py-3 text-right">
                                                    Buy Price
                                                </th>

                                                <th className="px-4 py-3 text-center">
                                                    Return Qty
                                                </th>

                                                <th className="px-4 py-3 text-right">
                                                    Return Total
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {items.map(
                                                (
                                                    item,
                                                    index
                                                ) => (

                                                    <tr
                                                        key={
                                                            item.purchaseItemId
                                                        }
                                                        className="border-t"
                                                    >

                                                        <td className="px-4 py-4 font-medium">
                                                            {
                                                                item.productName
                                                            }
                                                        </td>

                                                        <td className="px-4 py-4 text-center">
                                                            {
                                                                item.purchasedQuantity
                                                            }
                                                        </td>

                                                        <td className="px-4 py-4 text-right">
                                                            ৳{" "}
                                                            {item.buyPrice.toLocaleString()}
                                                        </td>

                                                        <td className="px-4 py-4">

                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={
                                                                    item.purchasedQuantity
                                                                }
                                                                value={
                                                                    item.quantity
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    changeQuantity(
                                                                        index,
                                                                        e
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                className="mx-auto block w-28 rounded-lg border px-3 py-2 text-center"
                                                            />

                                                        </td>

                                                        <td className="px-4 py-4 text-right font-semibold">
                                                            ৳{" "}
                                                            {Number(
                                                                item.totalPrice
                                                            ).toLocaleString()}
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                        )}

                        {/* ==================================
                            PAYMENT
                        ================================== */}

                        {selectedPurchase && (

                            <div className="mt-8 grid gap-6 md:grid-cols-2">

                                <div>

                                    <label className="mb-2 block font-semibold">
                                        Reason
                                    </label>

                                    <textarea
                                        value={
                                            reason
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setReason(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        rows={5}
                                        placeholder="Reason for purchase return..."
                                        className="w-full rounded-lg border px-4 py-3"
                                    />

                                </div>

                                <div className="rounded-xl border bg-slate-50 p-6">

                                    <h3 className="mb-5 text-lg font-bold">
                                        Return Summary
                                    </h3>

                                    <div className="space-y-4">

                                        <div className="flex justify-between">

                                            <span>
                                                Total Return
                                            </span>

                                            <span className="font-bold">
                                                ৳{" "}
                                                {totalReturnAmount.toLocaleString()}
                                            </span>

                                        </div>

                                        <div>

                                            <label className="mb-2 block font-medium">
                                                Cash Received
                                            </label>

                                            <input
                                                type="number"
                                                min="0"
                                                value={
                                                    cashReceived
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    setCashReceived(
                                                        e
                                                            .target
                                                            .value
                                                    )
                                                }
                                                placeholder="0"
                                                className="w-full rounded-lg border bg-white px-4 py-3"
                                            />

                                        </div>

                                        <div>

                                            <label className="mb-2 block font-medium">
                                                Adjusted Due
                                            </label>

                                            <input
                                                type="number"
                                                min="0"
                                                value={
                                                    adjustedDue
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    setAdjustedDue(
                                                        e
                                                            .target
                                                            .value
                                                    )
                                                }
                                                placeholder="0"
                                                className="w-full rounded-lg border bg-white px-4 py-3"
                                            />

                                        </div>

                                        <div className="border-t pt-4">

                                            <div className="flex justify-between font-bold">

                                                <span>
                                                    Remaining
                                                </span>

                                                <span className="text-orange-600">

                                                    ৳{" "}
                                                    {Math.max(
                                                        0,
                                                        totalReturnAmount -
                                                        Number(
                                                            cashReceived ||
                                                            0
                                                        ) -
                                                        Number(
                                                            adjustedDue ||
                                                            0
                                                        )
                                                    ).toLocaleString()}

                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        )}

                        {/* ==================================
                            BUTTONS
                        ================================== */}

                        <div className="mt-8 flex justify-end gap-3">

                            <button
                                onClick={
                                    resetForm
                                }
                                className="rounded-lg border px-5 py-3 font-semibold hover:bg-slate-50"
                            >
                                Cancel
                            </button>

                            <button
                                disabled={
                                    loading ||
                                    !purchaseId ||
                                    totalReturnAmount <=
                                    0
                                }
                                onClick={
                                    createReturn
                                }
                                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading
                                    ? "Processing..."
                                    : "Create Purchase Return"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* ==================================
                DETAILS MODAL
            ================================== */}

            {detailsOpen &&
                selectedReturn && (

                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">

                        <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">

                            <div className="mb-6 flex items-center justify-between">

                                <div>

                                    <h2 className="text-2xl font-bold">
                                        Purchase Return Details
                                    </h2>

                                    <p className="text-slate-500">
                                        Return #
                                        {
                                            selectedReturn.id
                                        }
                                    </p>

                                </div>

                                <button
                                    onClick={() =>
                                        setDetailsOpen(
                                            false
                                        )
                                    }
                                    className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                                >
                                    Close
                                </button>

                            </div>

                            {/* INFO */}

                            <div className="grid gap-4 md:grid-cols-4">

                                <div className="rounded-xl border bg-slate-50 p-4">

                                    <p className="text-sm text-slate-500">
                                        Purchase
                                    </p>

                                    <p className="font-bold">
                                        {
                                            selectedReturn
                                                .purchase
                                                ?.purchaseNo
                                        }
                                    </p>

                                </div>

                                <div className="rounded-xl border bg-slate-50 p-4">

                                    <p className="text-sm text-slate-500">
                                        Supplier
                                    </p>

                                    <p className="font-bold">
                                        {
                                            selectedReturn
                                                .supplier
                                                ?.name
                                        }
                                    </p>

                                </div>

                                <div className="rounded-xl border bg-slate-50 p-4">

                                    <p className="text-sm text-slate-500">
                                        Return Date
                                    </p>

                                    <p className="font-bold">
                                        {new Date(
                                            selectedReturn.returnDate
                                        ).toLocaleDateString()}
                                    </p>

                                </div>

                                <div className="rounded-xl border bg-slate-50 p-4">

                                    <p className="text-sm text-slate-500">
                                        Total Return
                                    </p>

                                    <p className="font-bold">
                                        ৳{" "}
                                        {Number(
                                            selectedReturn.totalAmount
                                        ).toLocaleString()}
                                    </p>

                                </div>

                            </div>

                            {/* ITEMS */}

                            <div className="mt-8">

                                <h3 className="mb-4 text-lg font-bold">
                                    Returned Products
                                </h3>

                                <div className="overflow-hidden rounded-xl border">

                                    <table className="w-full">

                                        <thead className="bg-slate-100">

                                            <tr>

                                                <th className="px-4 py-3 text-left">
                                                    Product
                                                </th>

                                                <th className="px-4 py-3 text-center">
                                                    Quantity
                                                </th>

                                                <th className="px-4 py-3 text-right">
                                                    Buy Price
                                                </th>

                                                <th className="px-4 py-3 text-right">
                                                    Total
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {(
                                                selectedReturn.items ||
                                                []
                                            ).map(
                                                (
                                                    item: any
                                                ) => (

                                                    <tr
                                                        key={
                                                            item.id
                                                        }
                                                        className="border-t"
                                                    >

                                                        <td className="px-4 py-3">
                                                            {
                                                                item
                                                                    .batch
                                                                    ?.product
                                                                    ?.name
                                                            }
                                                        </td>

                                                        <td className="px-4 py-3 text-center">
                                                            {
                                                                item.quantity
                                                            }
                                                        </td>

                                                        <td className="px-4 py-3 text-right">
                                                            ৳{" "}
                                                            {Number(
                                                                item.buyPrice
                                                            ).toLocaleString()}
                                                        </td>

                                                        <td className="px-4 py-3 text-right font-semibold">
                                                            ৳{" "}
                                                            {Number(
                                                                item.totalPrice
                                                            ).toLocaleString()}
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            </div>

                            {/* PAYMENT SUMMARY */}

                            <div className="mt-8 flex justify-end">

                                <div className="w-full max-w-md rounded-xl border bg-slate-50 p-6">

                                    <h3 className="mb-5 text-lg font-bold">
                                        Return Summary
                                    </h3>

                                    <div className="space-y-4">

                                        <div className="flex justify-between">

                                            <span>
                                                Total Return
                                            </span>

                                            <span className="font-bold">
                                                ৳{" "}
                                                {Number(
                                                    selectedReturn.totalAmount
                                                ).toLocaleString()}
                                            </span>

                                        </div>

                                        <div className="flex justify-between">

                                            <span>
                                                Cash Received
                                            </span>

                                            <span className="font-semibold text-green-600">
                                                ৳{" "}
                                                {Number(
                                                    selectedReturn.cashReceived ||
                                                    0
                                                ).toLocaleString()}
                                            </span>

                                        </div>

                                        <div className="flex justify-between">

                                            <span>
                                                Adjusted Due
                                            </span>

                                            <span className="font-semibold text-orange-600">
                                                ৳{" "}
                                                {Number(
                                                    selectedReturn.adjustedDue ||
                                                    0
                                                ).toLocaleString()}
                                            </span>

                                        </div>

                                        <div className="border-t pt-4">

                                            <div className="flex justify-between">

                                                <span className="font-bold">
                                                    Reason
                                                </span>

                                                <span className="max-w-[250px] text-right text-slate-600">
                                                    {
                                                        selectedReturn.reason ||
                                                        "—"
                                                    }
                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                )}

        </div>
    );
}