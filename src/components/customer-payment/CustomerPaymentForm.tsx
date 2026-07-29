"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

interface Props {
    loading: boolean;
    initialData?: any;
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

export default function CustomerPaymentForm({
    loading,
    initialData,
    onSubmit,
    onCancel,
}: Props) {

    const [customers, setCustomers] = useState<any[]>([]);
    const [dueSales, setDueSales] = useState<any[]>([]);

    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [selectedSale, setSelectedSale] = useState("");

    const [currentDue, setCurrentDue] = useState(0);

    const [amount, setAmount] = useState("");

    const [paymentMethod, setPaymentMethod] = useState("Cash");

    const [paymentDate, setPaymentDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [note, setNote] = useState("");

    async function loadCustomers() {

        try {

            const response = await axios.get("/api/customer");

            setCustomers(response.data);

        } catch (error) {

            console.error(error);

            toast.error("Failed to load customers");

        }

    }

    async function loadDueSales(customerId: string) {

        try {

            const response = await axios.get(
                `/api/customer/${customerId}/due-sales`
            );

            setDueSales(response.data);

        } catch (error) {

            console.error(error);

            toast.error("Failed to load due invoices");

        }

    }

    useEffect(() => {

        loadCustomers();

    }, []);

    async function handleCustomerChange(customerId: string) {

        setSelectedCustomer(customerId);

        setSelectedSale("");

        setCurrentDue(0);

        setDueSales([]);

        if (!customerId) return;

        await loadDueSales(customerId);

    }

    function handleSaleChange(saleId: string) {

        setSelectedSale(saleId);

        const sale = dueSales.find(
            (item) => item.id === Number(saleId)
        );

        if (sale) {

            setCurrentDue(Number(sale.dueAmount));

        } else {

            setCurrentDue(0);

        }

    }

    function savePayment() {

        if (!selectedCustomer) {

            toast.error("Please select customer");

            return;

        }

        if (!selectedSale) {

            toast.error("Please select invoice");

            return;

        }

        if (!amount) {

            toast.error("Enter payment amount");

            return;

        }

        if (Number(amount) <= 0) {

            toast.error("Invalid payment amount");

            return;

        }

        if (Number(amount) > currentDue) {

            toast.error("Payment exceeds due amount");

            return;

        }

        onSubmit({

            customerId: Number(selectedCustomer),

            saleId: Number(selectedSale),

            amount: Number(amount),

            paymentMethod,

            paymentDate,

            note,

        });

    }

    return (

        <div className="space-y-5">

            {/* Customer */}

            <div>

                <label className="mb-2 block font-medium">
                    Customer
                </label>

                <select
                    value={selectedCustomer}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3"
                >

                    <option value="">
                        Select Customer
                    </option>

                    {customers.map((customer) => (

                        <option
                            key={customer.id}
                            value={customer.id}
                        >
                            {customer.name}
                        </option>

                    ))}

                </select>

            </div>

            {/* Invoice */}

            <div>

                <label className="mb-2 block font-medium">
                    Due Invoice
                </label>

                <select
                    value={selectedSale}
                    onChange={(e) => {
                        handleSaleChange(e.target.value);
                    }}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3"
                >

                    <option value="">
                        Select Invoice
                    </option>

                    {dueSales.map((sale) => (

                        <option
                            key={sale.id}
                            value={sale.id}
                        >
                            {sale.invoiceNo} | Due ৳{sale.dueAmount}
                        </option>

                    ))}

                </select>

            </div>

            {/* Current Due */}

            <div>

                <label className="mb-2 block font-medium">
                    Current Due
                </label>

                <input
                    readOnly
                    value={currentDue}
                    className="w-full rounded-lg border bg-slate-100 px-4 py-3"
                />

            </div>

            {/* Amount */}

            <div>

                <label className="mb-2 block font-medium">
                    Payment Amount
                </label>

                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3"
                />

            </div>

            {/* Payment Method */}

            <div>

                <label className="mb-2 block font-medium">
                    Payment Method
                </label>

                <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3"
                >
                    <option>Cash</option>
                    <option>Bkash</option>
                    <option>Nagad</option>
                    <option>Rocket</option>
                    <option>Bank</option>
                </select>

            </div>

            {/* Payment Date */}

            <div>

                <label className="mb-2 block font-medium">
                    Payment Date
                </label>

                <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3"
                />

            </div>

            {/* Note */}

            <div>

                <label className="mb-2 block font-medium">
                    Note
                </label>

                <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3"
                />

            </div>

            {/* Buttons */}

            <div className="flex justify-end gap-3 pt-4">

                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg bg-slate-500 px-5 py-2 text-white hover:bg-slate-600"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    disabled={loading}
                    onClick={savePayment}
                    className="rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                >
                    {loading ? "Saving..." : "Save Payment"}
                </button>

            </div>

        </div>

    );

}