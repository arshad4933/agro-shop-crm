"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";



interface Props {
    customer: any;
    onClose: () => void;
}

export default function CustomerView({
    customer,
    onClose,
}: Props) {

    const [details, setDetails] = useState<any>(null);

    async function loadCustomerDetails() {
        try {

            const res = await axios.get(
                `/api/customer/${customer.id}/details`
            );

            setDetails(res.data);

        } catch (error) {

            console.error(error);
            console.log(details.paymentHistory);
            toast.error("Failed to load customer details");

        }
    }

    useEffect(() => {

        if (customer) {

            loadCustomerDetails();

        }

    }, [customer]);


    if (!customer) return null;




    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">

            <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

                {/* Header */}

                <div className="flex items-center justify-between border-b p-6">

                    <div>

                        <h2 className="text-3xl font-bold">

                            Customer Details

                        </h2>

                        <p className="text-slate-500">

                            Purchase History • Payment History • Ledger

                        </p>

                    </div>

                    <button

                        onClick={onClose}

                        className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700"

                    >

                        Close

                    </button>

                </div>

                <div className="space-y-6 p-6">

                    {/* Customer Information */}

                    <div className="rounded-xl border bg-slate-50 p-6">

                        <h3 className="mb-4 text-xl font-bold">

                            Customer Information

                        </h3>

                        <div className="grid grid-cols-3 gap-6">

                            <div>

                                <p className="text-sm text-slate-500">

                                    Name

                                </p>

                                <p className="font-semibold">

                                    {customer.name}

                                </p>

                            </div>

                            <div>

                                <p className="text-sm text-slate-500">

                                    Phone

                                </p>

                                <p className="font-semibold">

                                    {customer.phone}

                                </p>

                            </div>

                            <div>

                                <p className="text-sm text-slate-500">

                                    Address

                                </p>

                                <p className="font-semibold">

                                    {customer.address || "-"}

                                </p>

                            </div>

                        </div>

                    </div>

                    {/* Summary */}

                    <div className="grid grid-cols-4 gap-5">

                        <div className="rounded-xl bg-blue-50 p-5 shadow">

                            <p className="text-slate-500">

                                Total Purchase

                            </p>

                            <h2 className="mt-2 text-3xl font-bold">

                                ৳{details?.summary?.totalPurchase ?? 0}

                            </h2>

                        </div>

                        <div className="rounded-xl bg-green-50 p-5 shadow">

                            <p className="text-slate-500">

                                Total Paid

                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-green-700">

                                ৳{details?.summary?.totalPaid ?? 0}

                            </h2>

                        </div>

                        <div className="rounded-xl bg-red-50 p-5 shadow">

                            <p className="text-slate-500">

                                Current Due

                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-red-600">

                                ৳{details?.summary?.currentDue ?? 0}

                            </h2>

                        </div>

                        <div className="rounded-xl bg-yellow-50 p-5 shadow">

                            <p className="text-slate-500">

                                Total Invoice

                            </p>

                            <h2 className="mt-2 text-3xl font-bold">

                                {details?.summary?.invoiceCount ?? 0}

                            </h2>

                        </div>

                    </div>

                </div>

                {/* Purchase History */}

                <div className="rounded-xl border bg-white p-6">

                    <h3 className="mb-4 text-xl font-bold">

                        Purchase History

                    </h3>

                    <table className="min-w-full">

                        <thead className="bg-slate-100">

                            <tr>

                                <th className="px-4 py-3 text-left">
                                    Invoice
                                </th>

                                <th className="px-4 py-3 text-center">
                                    Date
                                </th>

                                <th className="px-4 py-3 text-right">
                                    Total
                                </th>

                                <th className="px-4 py-3 text-right">
                                    Paid
                                </th>

                                <th className="px-4 py-3 text-right">
                                    Due
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {details?.sales?.length === 0 && (

                                <tr>

                                    <td
                                        colSpan={5}
                                        className="py-10 text-center text-slate-500"
                                    >

                                        No Purchase History

                                    </td>

                                </tr>

                            )}

                            {details?.sales?.map((sale: any) => (

                                <tr
                                    key={sale.id}
                                    className="border-t"
                                >

                                    <td className="px-4 py-3">

                                        {sale.invoiceNo}

                                    </td>

                                    <td className="px-4 py-3 text-center">

                                        {new Date(
                                            sale.saleDate
                                        ).toLocaleDateString()}

                                    </td>

                                    <td className="px-4 py-3 text-right">

                                        ৳ {sale.totalAmount}

                                    </td>

                                    <td className="px-4 py-3 text-right">

                                        ৳ {sale.paidAmount}

                                    </td>

                                    <td className="px-4 py-3 text-right text-red-600 font-semibold">

                                        ৳ {sale.dueAmount}

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

                {/* Payment History */}

                <div className="rounded-xl border bg-white p-6">

                    <h3 className="mb-4 text-xl font-bold">

                        Due Payment History

                    </h3>

                    <table className="min-w-full">

                        <thead className="bg-slate-100">

                            <tr>

                                <th className="px-4 py-3 text-left">
                                    Receipt
                                </th>

                                <th className="px-4 py-3 text-center">
                                    Date
                                </th>

                                <th className="px-4 py-3 text-right">
                                    Amount
                                </th>

                                <th className="px-4 py-3 text-center">
                                    Method
                                </th>

                            </tr>

                        </thead>
                        <tbody>

                            {details?.paymentHistory?.length === 0 && (

                                <tr>

                                    <td
                                        colSpan={4}
                                        className="py-10 text-center text-slate-500"
                                    >

                                        No Payment History

                                    </td>

                                </tr>

                            )}

                            {details?.paymentHistory?.map((payment: any) => (

                                <tr
                                    key={payment.id}
                                    className="border-t"
                                >

                                    <td className="px-4 py-3">
                                        PAY-{payment.id}
                                    </td>

                                    <td className="px-4 py-3 text-center">

                                        {new Date(
                                            payment.paymentDate
                                        ).toLocaleDateString()}

                                    </td>

                                    <td className="px-4 py-3 text-right font-semibold text-green-700">

                                        ৳ {payment.amount}

                                    </td>

                                    <td className="px-4 py-3 text-center">

                                        {payment.paymentMethod}

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

                {/* Current Due */}

                <div className="rounded-xl border bg-white p-6">

                    <h3 className="mb-4 text-xl font-bold text-red-600">

                        Current Due Invoices

                    </h3>

                    <table className="min-w-full">

                        <thead className="bg-slate-100">

                            <tr>

                                <th className="px-4 py-3 text-left">

                                    Invoice

                                </th>

                                <th className="px-4 py-3 text-center">

                                    Date

                                </th>

                                <th className="px-4 py-3 text-right">

                                    Total

                                </th>

                                <th className="px-4 py-3 text-right">

                                    Paid

                                </th>

                                <th className="px-4 py-3 text-right text-red-600">

                                    Due

                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {details?.dueInvoices?.length === 0 && (

                                <tr>

                                    <td
                                        colSpan={5}
                                        className="py-10 text-center text-slate-500"
                                    >

                                        No Due Invoice

                                    </td>

                                </tr>

                            )}

                            {details?.dueInvoices?.map((sale: any) => (

                                <tr
                                    key={sale.id}
                                    className="border-t"
                                >

                                    <td className="px-4 py-3 font-medium">

                                        {sale.invoiceNo}

                                    </td>

                                    <td className="px-4 py-3 text-center">

                                        {new Date(
                                            sale.saleDate
                                        ).toLocaleDateString()}

                                    </td>

                                    <td className="px-4 py-3 text-right">

                                        ৳ {sale.totalAmount}

                                    </td>

                                    <td className="px-4 py-3 text-right text-green-700">

                                        ৳ {sale.paidAmount}

                                    </td>

                                    <td className="px-4 py-3 text-right font-bold text-red-600">

                                        ৳ {sale.dueAmount}

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>
                {/* Ledger */}

                {/* Ledger */}

                <div className="rounded-xl border bg-white p-6">

                    <h3 className="mb-4 text-xl font-bold">

                        Customer Ledger

                    </h3>

                    <table className="min-w-full">

                        <thead className="bg-slate-100">

                            <tr>

                                <th className="px-4 py-3 text-center">

                                    Date

                                </th>

                                <th className="px-4 py-3 text-left">

                                    Particular

                                </th>

                                <th className="px-4 py-3 text-right">

                                    Debit

                                </th>

                                <th className="px-4 py-3 text-right">

                                    Credit

                                </th>

                                <th className="px-4 py-3 text-right">

                                    Balance

                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {details?.ledger?.length === 0 && (

                                <tr>

                                    <td
                                        colSpan={5}
                                        className="py-10 text-center text-slate-500"
                                    >

                                        No Ledger Found

                                    </td>

                                </tr>

                            )}

                            {details?.ledger?.map((item: any) => (

                                <tr
                                    key={item.id}
                                    className="border-t"
                                >

                                    <td className="px-4 py-3 text-center">

                                        {new Date(item.date).toLocaleDateString()}

                                    </td>

                                    <td className="px-4 py-3">

                                        {item.particular}

                                    </td>

                                    <td className="px-4 py-3 text-right text-red-600 font-semibold">

                                        {item.debit ? `৳ ${item.debit}` : "-"}

                                    </td>

                                    <td className="px-4 py-3 text-right text-green-700 font-semibold">

                                        {item.credit ? `৳ ${item.credit}` : "-"}

                                    </td>

                                    <td className="px-4 py-3 text-right font-bold">

                                        ৳ {item.balance}

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    );

}