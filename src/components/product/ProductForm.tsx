"use client";

import { useEffect, useState } from "react";
import axios from "axios";

type ProductFormProps = {
    loading: boolean;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    initialData?: any;
};

type Category = {
    id: number;
    name: string;
};


export default function ProductForm({
    loading,
    onSubmit,
    onCancel,
    initialData,
}: ProductFormProps) {

    const [categories, setCategories] = useState<Category[]>([]);


    useEffect(() => {
        loadCategories();
    }, []);



    async function loadCategories() {

        try {

            const response = await axios.get(
                "/api/category",
                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            console.log("Categories API:", response.data);

            setCategories(response.data);

        } catch (error) {

            console.error(error);

        }

    }


    function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ) {

        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        onSubmit({

            name: formData.get("name"),

            categoryId: formData.get("categoryId"),

            brand: formData.get("brand"),

            unit: formData.get("unit"),

            minimumStock: formData.get("minimumStock"),

            description: formData.get("description"),

            isActive:
                formData.get("isActive") === "on",

        });

    }

    return (

        <form
            onSubmit={handleSubmit}
            className="space-y-8"
        >

            {/* ========================= */}
            {/* BASIC INFORMATION */}
            {/* ========================= */}

            <div className="rounded-xl border bg-slate-50 p-6">

                <h2 className="mb-6 text-xl font-bold text-slate-800">

                    📦 Basic Information

                </h2>

                <div className="grid gap-5 md:grid-cols-2">

                    <div>

                        <label className="mb-2 block text-sm font-semibold">

                            Product Name *

                        </label>

                        <input
                            name="name"
                            defaultValue={initialData?.name}
                            required
                            placeholder="Example: Urea Fertilizer"
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-green-600"
                        />

                    </div>

                    <div>

                        <label className="mb-2 block text-sm font-semibold">

                            Brand

                        </label>

                        <input
                            name="brand"
                            defaultValue={initialData?.brand}
                            placeholder="ACI / Square / Local"
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-green-600"
                        />

                    </div>

                    <div>

                        <label className="mb-2 block text-sm font-semibold">

                            Category *

                        </label>

                        <select
                            name="categoryId"
                            defaultValue={initialData?.categoryId}
                            required
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-green-600"
                        >

                            <option value="">

                                Select Category

                            </option>

                            {

                                categories.map((category) => (

                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >

                                        {category.name}

                                    </option>

                                ))

                            }

                        </select>

                    </div>

                </div>

            </div>



            {/* ========================= */}
            {/* INVENTORY */}
            {/* ========================= */}

            <div className="rounded-xl border bg-slate-50 p-6">

                <h2 className="mb-6 text-xl font-bold text-slate-800">

                    📊 Inventory

                </h2>

                <div className="grid gap-5 md:grid-cols-2">



                    <div>

                        <label className="mb-2 block text-sm font-semibold">

                            Minimum Stock Alert

                        </label>

                        <input
                            type="number"
                            name="minimumStock"
                            defaultValue={initialData?.minimumStock ?? 10}
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-green-600"
                        />

                    </div>

                    <div>

                        <label className="mb-2 block text-sm font-semibold">

                            Unit *

                        </label>

                        <select
                            name="unit"
                            defaultValue={initialData?.unit}
                            required
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-green-600"
                        >

                            <option value="">Select Unit</option>
                            <option value="Bag">Bag</option>
                            <option value="Kg">Kg</option>
                            <option value="Gram">Gram</option>
                            <option value="Litre">Litre</option>
                            <option value="Piece">Piece</option>
                            <option value="Packet">Packet</option>
                            <option value="Bottle">Bottle</option>
                            <option value="Box">Box</option>

                        </select>

                    </div>

                    <div>

                        <label className="mb-2 block text-sm font-semibold">

                            Status

                        </label>

                        <label className="flex items-center gap-3">

                            <input
                                type="checkbox"
                                name="isActive"
                                defaultChecked={initialData?.isActive ?? true}
                            />

                            Active Product

                        </label>

                    </div>

                </div>

            </div>

            {/* ========================= */}
            {/* DESCRIPTION */}
            {/* ========================= */}

            <div className="rounded-xl border bg-slate-50 p-6">

                <h2 className="mb-6 text-xl font-bold text-slate-800">

                    📝 Description

                </h2>

                <textarea
                    name="description"
                    rows={4}
                    placeholder="Write product description..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-green-600"
                />

            </div>

            {/* ========================= */}
            {/* ACTION BUTTONS */}
            {/* ========================= */}

            <div className="flex justify-end gap-4">

                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-slate-300 px-8 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-green-600 px-8 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                >

                    {loading ? "Saving..." : "💾 Save Product"}

                </button>

            </div>

        </form>

    );

}