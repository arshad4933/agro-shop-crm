"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

interface Props {
    sale: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function SaleReturnModal({
    sale,
    onClose,
    onSuccess,
}: Props) {
    const [returnDate, setReturnDate] = useState(
        new Date().toISOString().slice(0, 10)
    );

    const [reason, setReason] = useState("");

    const [cashReturned, setCashReturned] =
        useState("0");

    const [adjustedDue, setAdjustedDue] =
        useState("0");

    const [loading, setLoading] = useState(false);

    const [items, setItems] = useState<any[]>([]);

    // ======================================
    // LOAD PREVIOUS RETURNS
    // ======================================

    useEffect(() => {
        async function loadPreviousReturns() {
            try {
                const response = await axios.get(
                    `/api/sale-return?`
                );

                const returns =
                    response.data || [];

                const returnedQtyMap: Record<
                    number,
                    number
                > = {};

                returns
                    .filter(
                        (item: any) =>
                            item.saleId === sale.id
                    )
                    .forEach((saleReturn: any) => {
                        saleReturn.items?.forEach(
                            (item: any) => {
                                returnedQtyMap[
                                    item.saleItemId
                                ] =
                                    (returnedQtyMap[
                                        item.saleItemId
                                    ] || 0) +
                                    Number(
                                        item.quantity
                                    );
                            }
                        );
                    });

                const prepared =
                    sale.items?.map(
                        (item: any) => {
                            const alreadyReturned =
                                returnedQtyMap[
                                item.id
                                ] || 0;

                            const remaining =
                                Number(
                                    item.quantity
                                ) -
                                alreadyReturned;

                            return {
                                ...item,

                                alreadyReturned,

                                remainingToReturn:
                                    Math.max(
                                        0,
                                        remaining
                                    ),

                                returnQuantity: 0,
                            };
                        }
                    ) || [];

                setItems(prepared);
            } catch (error) {
                console.error(error);

                toast.error(
                    "Failed to load previous returns"
                );

                onClose();
            }
        }

        loadPreviousReturns();
    }, [sale.id, sale.items, onClose]);

    // ======================================
    // UPDATE RETURN QTY
    // ======================================

    function updateQuantity(
        saleItemId: number,
        value: string
    ) {
        const quantity = Number(value);

        setItems((current) =>
            current.map((item) => {
                if (item.id !== saleItemId) {
                    return item;
                }

                const max =
                    item.remainingToReturn;

                return {
                    ...item,

                    returnQuantity: Math.min(
                        Math.max(
                            Number.isFinite(
                                quantity
                            )
                                ? quantity
                                : 0,
                            0
                        ),
                        max
                    ),
                };
            })
        );
    }

    // ======================================
    // TOTAL RETURN
    // ======================================

    const totalReturnAmount = useMemo(() => {
        return items.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.returnQuantity || 0
                ) *
                Number(item.sellPrice || 0),
            0
        );
    }, [items]);

    const cash = Number(
        cashReturned || 0
    );

    const due = Number(
        adjustedDue || 0
    );

    const allocatedAmount =
        cash + due;

    const remainingAllocation =
        totalReturnAmount -
        allocatedAmount;

    // ======================================
    // SUBMIT
    // ======================================

    async function handleSubmit(
        e: React.FormEvent
    ) {
        e.preventDefault();

        const selectedItems =
            items.filter(
                (item) =>
                    Number(
                        item.returnQuantity
                    ) > 0
            );

        if (selectedItems.length === 0) {
            toast.error(
                "Select at least one item to return"
            );

            return;
        }

        if (!returnDate) {
            toast.error(
                "Return date is required"
            );

            return;
        }

        if (cash < 0 || due < 0) {
            toast.error(
                "Amounts cannot be negative"
            );

            return;
        }

        if (
            Math.abs(
                allocatedAmount -
                totalReturnAmount
            ) > 0.01
        ) {
            toast.error(
                `Cash Returned + Adjusted Due must equal ৳${totalReturnAmount.toFixed(
                    2
                )}`
            );

            return;
        }

        if (cash > Number(sale.paidAmount)) {
            toast.error(
                "Cash returned cannot exceed sale paid amount"
            );

            return;
        }

        if (due > Number(sale.dueAmount)) {
            toast.error(
                "Adjusted due cannot exceed current sale due"
            );

            return;
        }

        try {
            setLoading(true);

            await axios.post(
                "/api/sale-return",
                {
                    saleId: sale.id,

                    customerId:
                        sale.customerId,

                    returnDate,

                    cashReturned: cash,

                    adjustedDue: due,

                    reason,

                    items: selectedItems.map(
                        (item) => ({
                            saleItemId:
                                item.id,

                            quantity:
                                Number(
                                    item.returnQuantity
                                ),
                        })
                    ),
                }
            );

            toast.success(
                "Sale Return created successfully"
            );

            onSuccess();
        } catch (error: any) {
            console.error(error);

            toast.error(
                error?.response?.data
                    ?.error ||
                error?.response?.data
                    ?.message ||
                "Failed to create Sale Return"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-5">
            <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-6">
                    <div>
                        <h2 className="text-2xl font-bold text-orange-700">
                            Sale Return
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Invoice:{" "}
                            <span className="font-semibold">
                                {sale.invoiceNo}
                            </span>
                        </p>

                        <p className="text-sm text-slate-500">
                            Customer:{" "}
                            <span className="font-semibold">
                                {
                                    sale.customer
                                        ?.name
                                }
                            </span>
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                    >
                        Close
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 p-6"
                >
                    {/* DATE + REASON */}

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-semibold">
                                Return Date
                            </label>

                            <input
                                type="date"
                                value={returnDate}
                                onChange={(e) =>
                                    setReturnDate(
                                        e.target
                                            .value
                                    )
                                }
                                className="w-full rounded-lg border px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-semibold">
                                Reason
                            </label>

                            <input
                                value={reason}
                                onChange={(e) =>
                                    setReason(
                                        e.target
                                            .value
                                    )
                                }
                                placeholder="Optional"
                                className="w-full rounded-lg border px-3 py-2"
                            />
                        </div>
                    </div>

                    {/* ITEMS */}

                    <div className="overflow-hidden rounded-xl border">
                        <div className="border-b bg-orange-50 p-4">
                            <h3 className="font-bold text-orange-700">
                                Select Products
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            Product
                                        </th>

                                        <th className="px-4 py-3 text-center">
                                            Sold
                                        </th>

                                        <th className="px-4 py-3 text-center">
                                            Already Returned
                                        </th>

                                        <th className="px-4 py-3 text-center">
                                            Available
                                        </th>

                                        <th className="px-4 py-3 text-right">
                                            Sell Price
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
                                        (item) => {
                                            const qty =
                                                Number(
                                                    item.returnQuantity ||
                                                    0
                                                );

                                            const total =
                                                qty *
                                                Number(
                                                    item.sellPrice ||
                                                    0
                                                );

                                            return (
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

                                                    <td className="px-4 py-3 text-center text-orange-600">
                                                        {
                                                            item.alreadyReturned
                                                        }
                                                    </td>

                                                    <td className="px-4 py-3 text-center font-semibold text-green-600">
                                                        {
                                                            item.remainingToReturn
                                                        }
                                                    </td>

                                                    <td className="px-4 py-3 text-right">
                                                        ৳{" "}
                                                        {Number(
                                                            item.sellPrice
                                                        ).toFixed(
                                                            2
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-3 text-center">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={
                                                                item.remainingToReturn
                                                            }
                                                            value={
                                                                item.returnQuantity
                                                            }
                                                            disabled={
                                                                item.remainingToReturn <=
                                                                0
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                updateQuantity(
                                                                    item.id,
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            className="w-24 rounded-lg border px-2 py-2 text-center"
                                                        />
                                                    </td>

                                                    <td className="px-4 py-3 text-right font-semibold">
                                                        ৳{" "}
                                                        {total.toFixed(
                                                            2
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

                    {/* PAYMENT ALLOCATION */}

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-xl border bg-slate-50 p-5">
                            <h3 className="mb-4 font-bold">
                                Return Adjustment
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-semibold">
                                        Cash Returned
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            cashReturned
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setCashReturned(
                                                e
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="w-full rounded-lg border px-3 py-2"
                                    />

                                    <p className="mt-1 text-xs text-slate-500">
                                        Current Paid: ৳{" "}
                                        {Number(
                                            sale.paidAmount ||
                                            0
                                        ).toFixed(
                                            2
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-semibold">
                                        Adjusted Due
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
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
                                        className="w-full rounded-lg border px-3 py-2"
                                    />

                                    <p className="mt-1 text-xs text-slate-500">
                                        Current Due: ৳{" "}
                                        {Number(
                                            sale.dueAmount ||
                                            0
                                        ).toFixed(
                                            2
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-orange-50 p-5">
                            <h3 className="mb-4 font-bold text-orange-700">
                                Return Summary
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span>
                                        Return Amount
                                    </span>

                                    <span className="font-bold">
                                        ৳{" "}
                                        {totalReturnAmount.toFixed(
                                            2
                                        )}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span>
                                        Cash Returned
                                    </span>

                                    <span>
                                        ৳{" "}
                                        {cash.toFixed(
                                            2
                                        )}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span>
                                        Due Adjusted
                                    </span>

                                    <span>
                                        ৳{" "}
                                        {due.toFixed(
                                            2
                                        )}
                                    </span>
                                </div>

                                <hr />

                                <div
                                    className={`flex justify-between font-bold ${Math.abs(
                                        remainingAllocation
                                    ) <
                                            0.01
                                            ? "text-green-700"
                                            : "text-red-600"
                                        }`}
                                >
                                    <span>
                                        Remaining
                                    </span>

                                    <span>
                                        ৳{" "}
                                        {remainingAllocation.toFixed(
                                            2
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BUTTONS */}

                    <div className="flex justify-end gap-3 border-t pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border px-5 py-2"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                loading ||
                                totalReturnAmount <=
                                0 ||
                                Math.abs(
                                    remainingAllocation
                                ) > 0.01
                            }
                            className="rounded-lg bg-orange-600 px-6 py-2 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Processing..."
                                : "Create Sale Return"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}