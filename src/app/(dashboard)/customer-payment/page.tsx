"use client";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";


import PaymentReceiptPrint from "@/components/customer-payment/PaymentReceiptPrint";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";

import CustomerPaymentHeader from "@/components/customer-payment/CustomerPaymentHeader";
import CustomerPaymentTable from "@/components/customer-payment/CustomerPaymentTable";
import CustomerPaymentForm from "@/components/customer-payment/CustomerPaymentForm";

export default function CustomerPaymentPage() {

    const [open, setOpen] = useState(false);

    const [loading, setLoading] = useState(false);

    const [payments, setPayments] = useState<any[]>([]);

    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [receiptOpen, setReceiptOpen] = useState(false);

    const receiptRef = useRef<HTMLDivElement>(null);

    const handleReceiptPrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Payment-${selectedPayment?.id}`,
    });
    async function loadPayments() {

        try {

            const response = await axios.get("/api/customer-payment");

            setPayments(response.data);

        } catch (error) {

            console.error(error);

            toast.error("Failed to load payments");

        }

    }

    useEffect(() => {

        loadPayments();

    }, []);

    async function savePayment(data: any) {

        try {

            setLoading(true);

            await axios.post("/api/customer-payment", data);

            toast.success("Payment Received Successfully");

            await loadPayments();

            setSelectedPayment(null);

            setOpen(false);

        } catch (error: any) {

            toast.error(

                error?.response?.data?.message ||

                "Failed to save payment"

            );

        } finally {

            setLoading(false);

        }

    }


    async function deletePayment(payment: any) {

        const ok = confirm(
            "Delete this payment?"
        );

        if (!ok) return;

        try {

            await axios.delete(
                `/api/customer-payment/${payment.id}`
            );

            toast.success(
                "Payment deleted successfully"
            );

            await loadPayments();

        } catch (error: any) {

            toast.error(

                error?.response?.data?.message ||

                "Failed to delete payment"

            );

        }

    }







    return (

        <div className="space-y-6">

            <CustomerPaymentHeader

                onAdd={() => {

                    setSelectedPayment(null);

                    setOpen(true);

                }}

            />

            <CustomerPaymentTable
                payments={payments}
                onEdit={(payment) => {
                    setSelectedPayment(payment);
                    setOpen(true);
                }}
                onDelete={deletePayment}
                onReceipt={(payment) => {
                    setSelectedPayment(payment);
                    setReceiptOpen(true);
                }}
            />

            {

                open && (

                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">

                        <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">

                            <div className="mb-6 flex items-center justify-between">

                                <div>

                                    <h2 className="text-2xl font-bold">

                                        Receive Customer Payment

                                    </h2>

                                    <p className="text-slate-500">

                                        Record Due Collection

                                    </p>

                                </div>

                                <button

                                    onClick={() => {

                                        setSelectedPayment(null);

                                        setOpen(false);

                                    }}

                                    className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"

                                >

                                    Close

                                </button>

                            </div>

                            <CustomerPaymentForm

                                loading={loading}

                                initialData={selectedPayment}

                                onSubmit={savePayment}

                                onCancel={() => {

                                    setSelectedPayment(null);

                                    setOpen(false);

                                }}

                            />

                        </div>

                    </div>

                )

            }

            {receiptOpen && selectedPayment && (

                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6">

                    <div className="max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">

                        <div ref={receiptRef}>

                            <PaymentReceiptPrint
                                payment={selectedPayment}
                            />

                        </div>

                        <div className="flex justify-end gap-3 border-t p-5">

                            <button
                                onClick={handleReceiptPrint}
                                className="rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700"
                            >
                                🖨 Print
                            </button>

                            <button
                                onClick={() => setReceiptOpen(false)}
                                className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700"
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}