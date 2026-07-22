"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";


import SupplierHeader from "@/components/supplier/SupplierHeader";
import SupplierForm from "@/components/supplier/SupplierForm";
import SupplierTable from "@/components/supplier/SupplierTable";

export default function SupplierPage() {

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);


    async function createSupplier(data: any) {

        try {

            setLoading(true);

            await axios.post(

                "/api/supplier",

                data

            );

            toast.success("Supplier added successfully");
            await loadSuppliers();

            setOpen(false);

        } catch (error: any) {

            toast.error(

                error?.response?.data?.message ??

                "Failed to create supplier"

            );

        } finally {

            setLoading(false);

        }

    }





    async function loadSuppliers() {

        try {

            const response = await axios.get("/api/supplier");

            setSuppliers(response.data);

        } catch (error) {

            console.error(error);

        }

    }



    useEffect(() => {

        loadSuppliers();

    }, []);




    const filteredSuppliers = suppliers.filter((supplier: any) => {

        const keyword = search.toLowerCase();

        return (

            supplier.name?.toLowerCase().includes(keyword) ||

            supplier.company?.toLowerCase().includes(keyword) ||

            supplier.phone?.toLowerCase().includes(keyword)

        );

    });

    return (

        <div className="space-y-6">

            <SupplierHeader

                onAdd={() => setOpen(true)}

            />

            <div className="rounded-xl bg-white p-5 shadow">

                <input

                    value={search}

                    onChange={(e) => setSearch(e.target.value)}

                    placeholder="🔍 Search by Supplier, Company or Phone..."

                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"

                />

            </div>

            <SupplierTable
                suppliers={filteredSuppliers}
                onEdit={(supplier) => {

                    setSelectedSupplier(supplier);

                    setOpen(true);

                }}
            />

            {open && (

                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-6">

                    <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">

                        <div className="mb-6 flex items-center justify-between">

                            <div>

                                <h2 className="text-2xl font-bold">

                                    Add Supplier

                                </h2>

                                <p className="text-slate-500">

                                    Create a new supplier

                                </p>

                            </div>

                            <button

                                onClick={() => setOpen(false)}

                                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"

                            >

                                Close

                            </button>

                        </div>

                        <SupplierForm

                            loading={loading}

                            initialData={selectedSupplier}

                            onSubmit={createSupplier}

                            onCancel={() => {

                                setSelectedSupplier(null);

                                setOpen(false);

                            }}

                        />

                    </div>

                </div>

            )}

        </div>

    );

}