"use client";

import { useEffect, useState } from "react";

import axios from "axios";

import { toast } from "react-hot-toast";

import SaleHeader from "@/components/sale/SaleHeader";
import SaleForm from "@/components/sale/SaleForm";
import SaleTable from "@/components/sale/SaleTable";

export default function SalePage() {

    const [open, setOpen] = useState(false);

    const [loading, setLoading] = useState(false);

    const [sales, setSales] = useState<any[]>([]);

    const [search, setSearch] = useState("");

    const [selectedSale, setSelectedSale] = useState<any>(null);

    return (

        <div className="space-y-6">

            <SaleHeader

                onAdd={() => {

                    setSelectedSale(null);

                    setOpen(true);

                }}

            />

            <div className="rounded-xl bg-white p-5 shadow">

                <input

                    value={search}

                    onChange={(e) => setSearch(e.target.value)}

                    placeholder="🔍 Search Invoice / Customer..."

                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"

                />

            </div>

            <SaleTable

                sales={sales}

                onEdit={() => { }}

                onDelete={() => { }}

            />

            {open && (

                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-6">

                    <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">

                        <div className="mb-6 flex items-center justify-between">

                            <div>

                                <h2 className="text-2xl font-bold">

                                    {selectedSale ? "Edit Sale" : "New Sale"}

                                </h2>

                                <p className="text-slate-500">

                                    Create Sales Invoice

                                </p>

                            </div>

                            <button

                                onClick={() => {

                                    setSelectedSale(null);

                                    setOpen(false);

                                }}

                                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"

                            >

                                Close

                            </button>

                        </div>

                        <SaleForm

                            loading={loading}

                            initialData={selectedSale}

                            onSubmit={() => { }}

                            onCancel={() => {

                                setSelectedSale(null);

                                setOpen(false);

                            }}

                        />

                    </div>

                </div>

            )}

        </div>

    );

}