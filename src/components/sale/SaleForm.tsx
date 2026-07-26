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

export default function SaleForm({

    loading,

    initialData,

    onSubmit,

    onCancel,

}: Props) {

    const [customers, setCustomers] = useState<any[]>([]);

    const [selectedCustomer, setSelectedCustomer] = useState("");

    const [products, setProducts] = useState<any[]>([]);

    const [selectedProduct, setSelectedProduct] = useState("");
    const [batches, setBatches] = useState<any[]>([]);

    const [selectedBatch, setSelectedBatch] = useState("");

    const [buyPrice, setBuyPrice] = useState("");

    const [sellingPrice, setSellingPrice] = useState("");

    const [quantity, setQuantity] = useState("");

    const [items, setItems] = useState<any[]>([]);

    async function loadCustomers() {

        try {

            const response = await axios.get("/api/customer");

            setCustomers(response.data);

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

    async function loadBatches(productId: string) {

        try {

            const response = await axios.get(

                `/api/product-batch?productId=${productId}`

            );

            setBatches(response.data);

        } catch (error) {

            console.error(error);

        }

    }
    function addItem() {

        if (

            !selectedProduct ||

            !selectedBatch ||

            !sellingPrice ||

            !quantity

        ) {

            toast.error(

                "Complete all fields"

            );

            return;

        }

        const product = products.find(

            (p) => p.id === Number(selectedProduct)

        );

        const batch = batches.find(

            (b) => b.id === Number(selectedBatch)

        );

        const item = {

            productId: Number(selectedProduct),

            batchId: Number(selectedBatch),

            productName: product.name,

            quantity: Number(quantity),

            buyPrice: Number(buyPrice),

            sellingPrice: Number(sellingPrice),

            total:

                Number(quantity) *

                Number(sellingPrice),

        };

        setItems((prev) => [

            ...prev,

            item,

        ]);

        setSelectedProduct("");

        setSelectedBatch("");

        setBuyPrice("");

        setSellingPrice("");

        setQuantity("");

        setBatches([]);

    }


    function removeItem(index: number) {

        setItems(

            items.filter((_, i) => i !== index)

        );

    }

    useEffect(() => {

        loadCustomers();

        loadProducts();

    }, []);
    return (

        <div className="space-y-6">

            <h2 className="text-2xl font-bold">

                {initialData ? "Edit Sale" : "New Sale"}

            </h2>

            <div className="grid grid-cols-2 gap-5">

                <div>

                    <label className="mb-2 block font-medium">

                        Customer

                    </label>

                    <select

                        value={selectedCustomer}

                        onChange={(e) =>

                            setSelectedCustomer(e.target.value)

                        }

                        className="w-full rounded-lg border border-slate-300 px-4 py-3"

                    >

                        <option value="">

                            Select Customer

                        </option>

                        {

                            customers.map((customer) => (

                                <option

                                    key={customer.id}

                                    value={customer.id}

                                >

                                    {customer.name} ({customer.phone})

                                </option>

                            ))

                        }

                    </select>

                </div>

            </div>


            <div>

                <label className="mb-2 block font-medium">

                    Product

                </label>

                <select

                    value={selectedProduct}

                    onChange={(e) => {

                        const productId = e.target.value;

                        setSelectedProduct(productId);

                        setSelectedBatch("");

                        if (productId) {

                            loadBatches(productId);

                        }

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

                <label className="mb-2 block font-medium">

                    Batch

                </label>


                <select

                    value={selectedBatch}

                    onChange={(e) => {

                        const batchId = e.target.value;

                        setSelectedBatch(batchId);

                        const batch = batches.find(

                            (b) => b.id === Number(batchId)

                        );

                        if (batch) {

                            setBuyPrice(batch.purchasePrice.toString());

                        }

                    }}

                    className="w-full rounded-lg border border-slate-300 px-4 py-3"

                >

                    <option value="">

                        Select Batch

                    </option>


                    {

                        batches.map((batch) => (

                            <option

                                key={batch.id}

                                value={batch.id}

                            >

                                Batch #{batch.id}

                                {" | "}

                                Stock: {batch.quantityRemaining}

                                {" | "}

                                Buy: ৳ {batch.purchasePrice.toString()}

                            </option>
                        ))

                    }


                </select>

            </div>


            <div className="grid grid-cols-3 gap-5">

                <div>

                    <label className="mb-2 block font-medium">

                        Buy Price

                    </label>

                    <input

                        value={buyPrice}

                        readOnly

                        className="w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-3"

                    />

                </div>



                <div>

                    <label className="mb-2 block font-medium">

                        Selling Price

                    </label>

                    <input

                        type="number"

                        value={sellingPrice}

                        onChange={(e) =>

                            setSellingPrice(e.target.value)

                        }

                        className="w-full rounded-lg border border-slate-300 px-4 py-3"

                    />



                </div>

                <div>

                    <label className="mb-2 block font-medium">

                        Quantity

                    </label>

                    <input

                        type="number"

                        value={quantity}

                        onChange={(e) =>

                            setQuantity(e.target.value)

                        }

                        className="w-full rounded-lg border border-slate-300 px-4 py-3"

                    />

                </div>

                <div className="col-span-3">

                    <button

                        type="button"

                        onClick={addItem}

                        className="mt-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"

                    >

                        + Add Item

                    </button>

                </div>


            </div>

            {items.length > 0 && (

                <div className="rounded-xl border border-slate-200">

                    <table className="w-full">

                        <thead className="bg-slate-100">

                            <tr>

                                <th className="p-3 text-left">Product</th>

                                <th className="p-3 text-left">Qty</th>

                                <th className="p-3 text-left">Buy</th>

                                <th className="p-3 text-left">Sell</th>

                                <th className="p-3 text-left">Total</th>

                                <th className="p-3 text-center">

                                    Action

                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {

                                items.map((item, index) => (

                                    <tr

                                        key={index}

                                        className="border-t"

                                    >

                                        <td className="p-3">

                                            {item.productName}

                                        </td>

                                        <td className="p-3">

                                            {item.quantity}

                                        </td>

                                        <td className="p-3">

                                            ৳ {item.buyPrice}

                                        </td>

                                        <td className="p-3">

                                            ৳ {item.sellingPrice}

                                        </td>

                                        <td className="p-3 font-semibold">

                                            ৳ {item.total}

                                        </td>

                                        <td className="p-3 text-center">

                                            <button

                                                type="button"

                                                onClick={() => removeItem(index)}

                                                className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"

                                            >

                                                Remove

                                            </button>

                                        </td>

                                    </tr>

                                ))

                            }

                        </tbody>

                    </table>

                </div>

            )}

            <div className="flex gap-3">

                <button

                    type="button"

                    onClick={onCancel}

                    className="rounded-lg bg-slate-500 px-5 py-3 text-white"

                >

                    Cancel

                </button>

                <button

                    type="button"

                    disabled={loading}

                    className="rounded-lg bg-green-600 px-5 py-3 text-white"

                >

                    {loading ? "Saving..." : "Save"}

                </button>

            </div>

        </div>

    );

}