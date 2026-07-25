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
    const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [initialData, setInitialData] = useState<any>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    useEffect(() => {

        loadPurchases();

    }, []);




    async function loadPurchases() {

        try {

            const response = await axios.get("/api/purchase");

            setPurchases(response.data);

        } catch (error) {

            console.error(error);

        }

    }



    async function loadPurchaseDetails(id: number) {

        try {

            const response = await axios.get(

                `/api/purchase/${id}`

            );

            setSelectedPurchase(response.data);

            setDetailsOpen(true);

        } catch (error) {

            console.error(error);

            toast.error("Failed to load purchase");

        }

    }



    async function createPurchase(data: any) {

        try {

            setLoading(true);

            if (editingId) {

                const response = await axios.put(
                    `/api/purchase/${editingId}`,
                    data
                );

                toast.success(response.data.message);

                await loadPurchases();

                setOpen(false);

                setEditingId(null);

                setInitialData(null);

                return;

            }

            const response = await axios.post(
                "/api/purchase",
                data
            );

            toast.success(response.data.message);
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




    async function editPurchase(id: number) {

        try {

            const response = await axios.get(`/api/purchase/${id}`);

            setInitialData(response.data);

            setEditingId(id);

            setOpen(true);

        } catch (error) {

            console.error(error);

            toast.error("Failed to load purchase");

        }

    }


    return (

        <div className="space-y-6">

            <PurchaseHeader
                onAdd={() => setOpen(true)}
            />



            <div className="rounded-xl border bg-white shadow-sm">

                <table className="w-full">

                    <thead className="border-b bg-slate-100">

                        <tr>

                            <th className="px-5 py-4 text-left">Purchase No</th>

                            <th className="px-5 py-4 text-left">Supplier</th>

                            <th className="px-5 py-4 text-left">Date</th>

                            <th className="px-5 py-4 text-right">Total</th>

                            <th className="px-5 py-4 text-right">Paid</th>

                            <th className="px-5 py-4 text-right">Due</th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            purchases.map((purchase) => (

                                <tr
                                    key={purchase.id}
                                    className="border-b hover:bg-slate-50"
                                >

                                    <td className="px-5 py-4">

                                        <button

                                            onClick={() =>

                                                loadPurchaseDetails(purchase.id)

                                            }

                                            className="font-semibold text-blue-600 hover:underline"

                                        >

                                            {purchase.purchaseNo}

                                        </button>

                                    </td>

                                    <td className="px-5 py-4">

                                        {purchase.supplier.name}

                                    </td>

                                    <td className="px-5 py-4">

                                        {new Date(
                                            purchase.purchaseDate
                                        ).toLocaleDateString()}

                                    </td>

                                    <td className="px-5 py-4 text-right">

                                        ৳ {Number(
                                            purchase.totalAmount
                                        ).toLocaleString()}

                                    </td>

                                    <td className="px-5 py-4 text-right">

                                        ৳ {Number(
                                            purchase.paidAmount
                                        ).toLocaleString()}

                                    </td>

                                    <td className="px-5 py-4 text-right text-red-600 font-semibold">

                                        ৳ {Number(
                                            purchase.dueAmount
                                        ).toLocaleString()}

                                    </td>

                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => editPurchase(purchase.id)}
                                            className="rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-600"
                                        >
                                            Edit
                                        </button>
                                    </td>

                                </tr>

                            ))

                        }

                    </tbody>

                </table>

            </div>




            {open && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">

                    <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">

                        <div className="mb-6 flex items-center justify-between">

                            <div>

                                <h2 className="text-2xl font-bold">

                                    New Purchase

                                </h2>

                                <p className="text-slate-500">

                                    Create a purchase invoice

                                </p>

                            </div>

                            <button
                                onClick={() => setOpen(false)}
                                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                            >

                                Close

                            </button>

                        </div>

                        <PurchaseForm
                            loading={false}
                            initialData={initialData}
                            onSubmit={createPurchase}
                            onCancel={() => setOpen(false)}
                        />

                    </div>

                </div>

            )}


            {detailsOpen && selectedPurchase && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">

                    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-8">

                        <div className="mb-6 flex items-center justify-between">

                            <h2 className="text-2xl font-bold">

                                Purchase Details

                            </h2>

                            <button
                                onClick={() => setDetailsOpen(false)}
                                className="rounded-lg bg-red-600 px-4 py-2 text-white"
                            >

                                Close

                            </button>

                        </div>

                        <div className="space-y-3">

                            <p>

                                <b>Purchase No:</b> {selectedPurchase.purchaseNo}

                            </p>

                            <p>

                                <b>Supplier:</b> {selectedPurchase.supplier.name}

                            </p>

                            <p>

                                <b>Date:</b>

                                {" "}

                                {new Date(
                                    selectedPurchase.purchaseDate
                                ).toLocaleDateString()}

                            </p>

                        </div>

                        <div className="mt-8">

                            <h3 className="mb-4 text-lg font-bold">

                                Purchase Items

                            </h3>

                            <table className="w-full border">

                                <thead className="bg-slate-100">

                                    <tr>

                                        <th className="border px-4 py-3 text-left">

                                            Product

                                        </th>

                                        <th className="border px-4 py-3 text-center">

                                            Qty

                                        </th>

                                        <th className="border px-4 py-3 text-right">

                                            Buy Price

                                        </th>

                                        <th className="border px-4 py-3 text-right">

                                            Total

                                        </th>

                                        <th className="px-5 py-4 text-center">
                                            Action
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {

                                        selectedPurchase.items.map((item: any) => (

                                            <tr key={item.id}>

                                                <td className="border px-4 py-3">

                                                    {item.batch.product.name}

                                                </td>

                                                <td className="border px-4 py-3 text-center">

                                                    {item.quantity}

                                                </td>

                                                <td className="border px-4 py-3 text-right">

                                                    ৳ {Number(item.buyPrice).toLocaleString()}

                                                </td>

                                                <td className="border px-4 py-3 text-right">

                                                    ৳ {Number(item.totalPrice).toLocaleString()}

                                                </td>

                                            </tr>

                                        ))

                                    }

                                </tbody>

                            </table>

                            <div className="mt-8 flex justify-end">

                                <div className="w-full max-w-md rounded-xl border bg-slate-50 p-6">

                                    <h3 className="mb-5 text-lg font-bold">

                                        Payment Summary

                                    </h3>

                                    <div className="space-y-4">

                                        <div className="flex justify-between">

                                            <span className="font-medium">

                                                Grand Total

                                            </span>

                                            <span className="font-bold">

                                                ৳ {Number(
                                                    selectedPurchase.totalAmount
                                                ).toLocaleString()}

                                            </span>

                                        </div>

                                        <div className="flex justify-between">

                                            <span className="font-medium">

                                                Paid Amount

                                            </span>

                                            <span className="text-green-600 font-semibold">

                                                ৳ {Number(
                                                    selectedPurchase.paidAmount
                                                ).toLocaleString()}

                                            </span>

                                        </div>

                                        <div className="flex justify-between border-t pt-4">

                                            <span className="font-bold">

                                                Due Amount

                                            </span>

                                            <span className="font-bold text-red-600">

                                                ৳ {Number(
                                                    selectedPurchase.dueAmount
                                                ).toLocaleString()}

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