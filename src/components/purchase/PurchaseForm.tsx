"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type PurchaseFormProps = {
    loading: boolean;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    initialData?: any;
};

type Supplier = {
    id: number;
    name: string;
};

type Product = {
    id: number;
    name: string;
};

type PurchaseItem = {
    productId: string;
    quantity: number;
    buyPrice: number;
    total: number;
};
export default function PurchaseForm({
    loading,
    onSubmit,
    onCancel,
    initialData,
}: PurchaseFormProps) {

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [items, setItems] = useState<PurchaseItem[]>([
        {
            productId: "",
            quantity: 1,
            buyPrice: 0,
            total: 0,
        },
    ]);

    const grandTotal = items.reduce(

        (sum, item) =>

            sum + item.total,

        0

    );

    const [form, setForm] = useState({

        supplierId: "",

        purchaseDate: new Date().toISOString().split("T")[0],

        paidAmount: 0,

        note: "",

    });

    useEffect(() => {

        loadSuppliers();

        loadProducts();

    }, []);

    async function loadSuppliers() {

        try {

            const response = await axios.get("/api/supplier");

            setSuppliers(response.data);

        } catch (error) {

            console.error(error);

        }

    }



    async function loadProducts() {

        try {

            const response = await axios.get("/api/product");

            setProducts(response.data);

        } catch (error) {

            console.error(error);

        }

    }


    useEffect(() => {

        if (!initialData) return;

        setForm({

            supplierId: String(initialData.supplierId),

            purchaseDate: initialData.purchaseDate.split("T")[0],

            paidAmount: Number(initialData.paidAmount),

            note: initialData.note || "",

        });

        setItems(

            initialData.items.map((item: any) => ({

                productId: String(item.batch.productId),

                quantity: item.quantity,

                buyPrice: Number(item.buyPrice),

                total: Number(item.totalPrice),

            }))

        );

    }, [initialData]);


    function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ) {

        e.preventDefault();

        onSubmit({

            supplierId: Number(form.supplierId),

            purchaseDate: form.purchaseDate,

            paidAmount: form.paidAmount,

            totalAmount: grandTotal,

            dueAmount: grandTotal - form.paidAmount,

            note: form.note,

            items,

        });

    }

    return (

        <form
            onSubmit={handleSubmit}
            className="space-y-8"
        >

            <div className="rounded-xl border bg-slate-50 p-6">

                <h2 className="mb-6 text-xl font-bold">

                    Purchase Information

                </h2>

                <div className="grid gap-5 md:grid-cols-2">

                    <div>

                        <label className="mb-2 block font-semibold">

                            Supplier *

                        </label>

                        <select
                            required
                            value={form.supplierId}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    supplierId: e.target.value,
                                })
                            }
                            className="w-full rounded-lg border border-slate-300 px-4 py-3"
                        >

                            <option value="">

                                Select Supplier

                            </option>

                            {

                                suppliers.map((supplier) => (

                                    <option
                                        key={supplier.id}
                                        value={supplier.id}
                                    >

                                        {supplier.name}

                                    </option>

                                ))

                            }

                        </select>

                    </div>

                    <div>

                        <label className="mb-2 block font-semibold">

                            Purchase Date

                        </label>

                        <input
                            type="date"
                            value={form.purchaseDate}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    purchaseDate: e.target.value,
                                })
                            }
                            className="w-full rounded-lg border border-slate-300 px-4 py-3"
                        />

                    </div>

                </div>

            </div>

            <div className="rounded-xl border bg-slate-50 p-6">

                <h2 className="mb-6 text-xl font-bold">

                    Note

                </h2>

                <textarea
                    rows={4}
                    value={form.note}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            note: e.target.value,
                        })
                    }
                    placeholder="Purchase note..."
                    className="w-full rounded-lg border border-slate-300 px-4 py-3"
                />

            </div>



            <div className="rounded-xl border bg-slate-50 p-6">

                <div className="mb-6 flex items-center justify-between">

                    <h2 className="text-xl font-bold">

                        Purchase Items

                    </h2>

                    <button
                        type="button"
                        onClick={() =>
                            setItems([
                                ...items,
                                {
                                    productId: "",
                                    quantity: 1,
                                    buyPrice: 0,
                                    total: 0,
                                },
                            ])
                        }
                        className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                    >

                        + Add Item

                    </button>

                </div>

                <div className="space-y-4">

                    {

                        items.map((item, index) => (

                            <div
                                key={index}
                                className="grid gap-4 rounded-lg border bg-white p-4 md:grid-cols-5"
                            >

                                <div>

                                    <label className="mb-2 block text-sm font-semibold">

                                        Product

                                    </label>

                                    <select
                                        value={item.productId}
                                        onChange={(e) => {

                                            const copy = [...items];

                                            copy[index].productId = e.target.value;

                                            setItems(copy);

                                        }}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3"
                                    >

                                        <option value="">

                                            Select Product

                                        </option>

                                        {

                                            products.map((product) => (

                                                <option
                                                    key={product.id}
                                                    value={product.id}
                                                >

                                                    {product.name}

                                                </option>

                                            ))

                                        }

                                    </select>

                                </div>

                                <div>

                                    <label className="mb-2 block text-sm font-semibold">

                                        Quantity

                                    </label>

                                    <input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(e) => {

                                            const copy = [...items];

                                            copy[index].quantity = Number(e.target.value);

                                            copy[index].total =
                                                copy[index].quantity *
                                                copy[index].buyPrice;

                                            setItems(copy);

                                        }}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3"
                                    />

                                </div>

                                <div>

                                    <label className="mb-2 block text-sm font-semibold">

                                        Buy Price (৳)

                                    </label>

                                    <input
                                        type="number"
                                        min={0}
                                        value={item.buyPrice}
                                        onChange={(e) => {

                                            const copy = [...items];

                                            copy[index].buyPrice = Number(e.target.value);

                                            copy[index].total =
                                                copy[index].quantity *
                                                copy[index].buyPrice;

                                            setItems(copy);

                                        }}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-3"
                                    />

                                </div>




                                <div>

                                    <label className="mb-2 block text-sm font-semibold">

                                        Total

                                    </label>

                                    <input
                                        readOnly
                                        value={`৳ ${item.total.toLocaleString()}`}
                                        className="w-full rounded-lg border bg-slate-100 px-4 py-3"
                                    />

                                </div>

                                <div className="flex items-end">

                                    <button
                                        type="button"
                                        onClick={() => {

                                            const copy = items.filter(

                                                (_, i) => i !== index

                                            );

                                            setItems(copy);

                                        }}
                                        className="w-full rounded-lg bg-red-600 px-4 py-3 text-white hover:bg-red-700"
                                    >

                                        Remove

                                    </button>

                                </div>

                            </div>

                        ))

                    }

                </div>

            </div>



            <div className="flex justify-end gap-4">


                <div className="rounded-xl border bg-slate-50 p-6">

                    <h2 className="mb-6 text-xl font-bold">

                        Payment Summary

                    </h2>

                    <div className="grid gap-5 md:grid-cols-3">

                        <div>

                            <label className="mb-2 block text-sm font-semibold">

                                Grand Total

                            </label>

                            <input
                                readOnly
                                value={`৳ ${grandTotal.toLocaleString()}`}
                                className="w-full rounded-lg border bg-slate-100 px-4 py-3"
                            />

                        </div>

                        <div>

                            <label className="mb-2 block text-sm font-semibold">

                                Paid Amount

                            </label>

                            <input
                                type="number"
                                min={0}
                                value={form.paidAmount}
                                onChange={(e) =>
                                    setForm({

                                        ...form,

                                        paidAmount: Number(e.target.value),

                                    })
                                }
                                className="w-full rounded-lg border border-slate-300 px-4 py-3"
                            />

                        </div>

                        <div>

                            <label className="mb-2 block text-sm font-semibold">

                                Due Amount

                            </label>

                            <input
                                readOnly
                                value={`৳ ${(grandTotal - form.paidAmount).toLocaleString()}`}
                                className="w-full rounded-lg border bg-slate-100 px-4 py-3"
                            />

                        </div>

                    </div>

                </div>

                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-100"
                >

                    Cancel

                </button>

                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-green-600 px-6 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                >

                    {loading ? "Saving..." : "Next"}

                </button>

            </div>

        </form>

    );

}