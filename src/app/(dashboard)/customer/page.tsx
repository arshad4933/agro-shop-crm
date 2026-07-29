"use client";
import CustomerView from "@/components/customer/CustomerView";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

import CustomerHeader from "@/components/customer/CustomerHeader";
import CustomerForm from "@/components/customer/CustomerForm";
import CustomerTable from "@/components/customer/CustomerTable";

export default function CustomerPage() {

    const [open, setOpen] = useState(false);

    const [loading, setLoading] = useState(false);

    const [customers, setCustomers] = useState<any[]>([]);

    const [search, setSearch] = useState("");

    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

    const [viewCustomer, setViewCustomer] = useState<any>(null);
    async function loadCustomers() {

        try {

            const response = await axios.get(
                "/api/customer"
            );

            setCustomers(response.data);

        } catch (error) {

            console.error(error);

            toast.error("Failed to load customers");

        }

    }


    async function deleteCustomer(customer: any) {

        const ok = window.confirm(

            `Delete "${customer.name}" ?`

        );

        if (!ok) return;

        try {

            await axios.delete(

                `/api/customer/${customer.id}`

            );

            toast.success("Customer deleted successfully");

            await loadCustomers();

        } catch (error: any) {

            toast.error(

                error?.response?.data?.message ??

                "Failed to delete customer"

            );

        }

    }


    useEffect(() => {

        loadCustomers();

    }, []);


    async function createCustomer(data: any) {

        try {

            setLoading(true);

            if (selectedCustomer) {

                await axios.put(

                    `/api/customer/${selectedCustomer.id}`,

                    data

                );

                toast.success("Customer updated successfully");

            } else {

                await axios.post(

                    "/api/customer",

                    data

                );

                toast.success("Customer added successfully");

            }

            await loadCustomers();

            setSelectedCustomer(null);

            setOpen(false);

        } catch (error: any) {

            toast.error(

                error?.response?.data?.message ??

                "Failed to save customer"

            );

        } finally {

            setLoading(false);

        }

    }


    const filteredCustomers = customers.filter((customer: any) => {

        const keyword = search.toLowerCase();

        return (

            customer.name?.toLowerCase().includes(keyword) ||

            customer.phone?.toLowerCase().includes(keyword) ||

            customer.address?.toLowerCase().includes(keyword)

        );




    });


    return (

        <div className="space-y-6">

            <CustomerHeader
                onAdd={() => {
                    setSelectedCustomer(null);
                    setOpen(true);
                }}
            />

            <div className="rounded-xl bg-white p-5 shadow">

                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔍 Search Customer..."
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
                />

            </div>

            <CustomerTable
                customers={filteredCustomers}

                onView={(customer) => {
                    setViewCustomer(customer);
                }}

                onEdit={(customer) => {

                    setSelectedCustomer(customer);

                    setOpen(true);

                }}

                onDelete={deleteCustomer}
            />
            {open && (

                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-6">

                    <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">

                        <div className="mb-6 flex items-center justify-between">

                            <div>

                                <h2 className="text-2xl font-bold">

                                    {selectedCustomer ? "Edit Customer" : "Add Customer"}

                                </h2>

                                <p className="text-slate-500">

                                    Customer Information

                                </p>

                            </div>

                            <button

                                onClick={() => {

                                    setSelectedCustomer(null);

                                    setOpen(false);

                                }}

                                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"

                            >

                                Close

                            </button>

                        </div>

                        <CustomerForm

                            loading={loading}

                            initialData={selectedCustomer}

                            onSubmit={createCustomer}

                            onCancel={() => {

                                setSelectedCustomer(null);

                                setOpen(false);

                            }}

                        />

                    </div>

                </div>

            )}

            {viewCustomer && (

                <CustomerView

                    customer={viewCustomer}

                    onClose={() => setViewCustomer(null)}

                />

            )}


        </div>

    );

}
