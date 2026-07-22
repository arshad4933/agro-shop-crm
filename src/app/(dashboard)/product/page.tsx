"use client";

import { useState } from "react";


import ProductHeader from "@/components/product/ProductHeader";
import ProductForm from "@/components/product/ProductForm";

import axios from "axios";
import { toast } from "react-hot-toast";



import { useEffect } from "react";


import ProductTable from "@/components/product/ProductTable";

export default function ProductPage() {

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [search, setSearch] = useState("");





    useEffect(() => {

        loadProducts();

    }, []);



    async function loadProducts() {

        try {

            const response = await axios.get(

                "/api/product",

                {

                    headers: {

                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`,

                    },

                }

            );

            setProducts(response.data);

        } catch (error) {

            console.error(error);

        }

    }










    const filteredProducts = products.filter((product) => {

        const keyword = search.toLowerCase();

        return (

            product.name.toLowerCase().includes(keyword) ||

            (product.brand ?? "")
                .toLowerCase()
                .includes(keyword) ||

            product.category.name
                .toLowerCase()
                .includes(keyword)

        );

    });






    async function createProduct(data: any) {

        try {

            setLoading(true);

            if (selectedProduct) {

                await axios.put(

                    `/api/product/${selectedProduct.id}`,

                    data,

                    {

                        headers: {

                            Authorization:
                                `Bearer ${localStorage.getItem("token")}`,

                        },

                    }

                );

                toast.success("Product updated successfully");

            } else {

                await axios.post(

                    "/api/product",

                    data,

                    {

                        headers: {

                            Authorization:
                                `Bearer ${localStorage.getItem("token")}`,

                        },

                    }

                );

                toast.success("Product added successfully");

            }


            await loadProducts();
            setSelectedProduct(null);


            setOpen(false);

        } catch (error: any) {

            toast.error(

                error?.response?.data?.message ??

                "Failed to create product"

            );

        } finally {

            setLoading(false);

        }

    }




    async function deleteProduct(product: any) {

        const confirmDelete = window.confirm(

            `Are you sure you want to delete "${product.name}"?`

        );

        if (!confirmDelete) return;

        try {

            await axios.delete(

                `/api/product/${product.id}`,

                {

                    headers: {

                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`,

                    },

                }

            );

            toast.success("Product deleted successfully");

            await loadProducts();

        } catch (error: any) {

            toast.error(

                error?.response?.data?.message ??

                "Failed to delete product"

            );

        }

    }






    return (

        <div className="space-y-6">

            <ProductHeader
                onAdd={() => {

                    setSelectedProduct(null);

                    setOpen(true);

                }}
            />

            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-16 text-center">

                <div className="text-6xl">

                    📦

                </div>

                <h2 className="mt-4 text-2xl font-bold text-slate-700">

                    Product Module

                </h2>

                <div className="rounded-xl bg-white p-5 shadow-sm">

                    <input
                        type="text"
                        placeholder="🔍 Search by Product, Brand or Category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600"
                    />

                </div>


                <div className="mt-3 flex items-center justify-between">

                    <p className="text-sm text-slate-500">

                        Showing

                        <span className="mx-1 font-semibold">

                            {filteredProducts.length}

                        </span>

                        product(s)

                    </p>

                </div>


                {
                    filteredProducts.length > 0 ? (

                        <ProductTable
                            products={filteredProducts}
                            onEdit={(product) => {

                                setSelectedProduct(product);

                                setOpen(true);

                            }}
                            onDelete={deleteProduct}
                        />

                    ) : (

                        <div className="rounded-xl bg-white py-20 text-center shadow-sm">

                            <div className="text-6xl">

                                🔍

                            </div>

                            <h2 className="mt-4 text-2xl font-bold text-slate-700">

                                No Product Found

                            </h2>

                            <p className="mt-2 text-slate-500">

                                Try another product name, brand or category.

                            </p>

                        </div>

                    )
                }
                <button
                    onClick={() => {

                        setSelectedProduct(null);

                        setOpen(true);

                    }}
                >
                    + Add Product
                </button>

            </div>

            {open && (

                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-6">

                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">

                        <div className="mb-6 flex items-center justify-between">

                            <div>

                                <h2 className="text-2xl font-bold">

                                    Add Product

                                </h2>

                                <p className="text-slate-500">

                                    Create a new product

                                </p>

                            </div>

                            <button

                                onClick={() => setOpen(false)}

                                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"

                            >

                                Close

                            </button>

                        </div>

                        <ProductForm
                            loading={loading}
                            initialData={selectedProduct}
                            onSubmit={createProduct}
                            onCancel={() => {

                                setSelectedProduct(null);

                                setOpen(false);

                            }}
                        />

                    </div>

                </div>

            )}

        </div>

    );

}