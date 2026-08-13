"use client";

import { useEffect, useState } from "react";

import axios from "axios";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import { toast } from "react-hot-toast";
import InvoicePrint from "@/components/sale/InvoicePrint";
import SaleHeader from "@/components/sale/SaleHeader";
import SaleForm from "@/components/sale/SaleForm";
import SaleTable from "@/components/sale/SaleTable";
import SaleList from "@/components/sale/SaleList";
import SaleReturnModal from "@/components/sale/SaleReturnModal";


export default function SalePage() {


    const [customerInvoice, setCustomerInvoice] = useState(false);
    const [open, setOpen] = useState(false);

    const [loading, setLoading] = useState(false);

    const [sales, setSales] = useState<any[]>([]);

    const [search, setSearch] = useState("");

    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [viewSale, setViewSale] = useState<any>(null);
    const [returnSale, setReturnSale] = useState<any>(null);
    const customerInvoiceRef = useRef<HTMLDivElement>(null);
    const [officeInvoice, setOfficeInvoice] = useState(false);
    const handleCustomerPrint = useReactToPrint({
        contentRef: customerInvoiceRef,
        documentTitle: `Invoice-${viewSale?.invoiceNo}`,
    });

    const officeInvoiceRef = useRef<HTMLDivElement>(null);

    const handleOfficePrint = useReactToPrint({
        contentRef: officeInvoiceRef,
        documentTitle: `Office-${viewSale?.invoiceNo}`,
    });


    async function loadSales() {

        try {

            const response = await axios.get("/api/sale");

            setSales(response.data);

        } catch (error) {

            console.error(error);

            toast.error("Failed to load sales");

        }

    }

    useEffect(() => {

        loadSales();

    }, []);

    async function deleteSale(sale: any) {

        const ok = confirm(

            `Delete Invoice ${sale.invoiceNo}?`

        );

        if (!ok) return;

        try {

            await axios.delete(

                `/api/sale/${sale.id}`

            );

            toast.success(

                "Sale deleted successfully"

            );

            loadSales();

        } catch (error) {

            console.error(error);

            toast.error(

                "Failed to delete sale"

            );

        }

    }


    const saleReturns = viewSale?.saleReturns ?? [];

    const totalSaleReturn = saleReturns.reduce(
        (sum: number, item: any) =>
            sum + Number(item.totalAmount ?? 0),
        0
    );

    const totalCashReturned = saleReturns.reduce(
        (sum: number, item: any) =>
            sum + Number(item.cashReturned ?? 0),
        0
    );

    const totalDueAdjusted = saleReturns.reduce(
        (sum: number, item: any) =>
            sum + Number(item.adjustedDue ?? 0),
        0
    );

    const currentSaleTotal = Number(
        viewSale?.totalAmount ?? 0
    );

    const currentPaidAmount = Number(
        viewSale?.paidAmount ?? 0
    );

    const currentDueAmount = Number(
        viewSale?.dueAmount ?? 0
    );

    const originalSaleTotal =
        currentSaleTotal + totalSaleReturn;

    const originalPaidAmount =
        currentPaidAmount + totalCashReturned;

    const originalDueAmount =
        currentDueAmount + totalDueAdjusted;

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

            <SaleList
                sales={sales}

                onView={async (sale) => {
                    try {
                        const response = await axios.get(
                            `/api/sale/${sale.id}`
                        );

                        setViewSale(response.data);
                    } catch (error) {
                        console.error(error);
                        toast.error(
                            "Failed to load invoice details"
                        );
                    }
                }}

                onReturn={(sale) => {
                    setReturnSale(sale);
                }}

                onDelete={deleteSale}
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

            {viewSale && (

                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-6">

                    <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">

                        <div className="mb-6 flex items-center justify-between">

                            <h2 className="text-2xl font-bold">

                                Invoice Details

                            </h2>

                            <div className="flex gap-3">

                                <button
                                    onClick={() => setOfficeInvoice(true)}
                                    className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                                >
                                    🖨 OFFICE COPY
                                </button>

                                <button
                                    onClick={() => setCustomerInvoice(true)}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                                >
                                    🧾 Customer Invoice
                                </button>

                                <button
                                    onClick={() => setViewSale(null)}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                                >
                                    Close
                                </button>

                            </div>




                        </div>

                        <div className="rounded-xl border bg-slate-50 p-6">

                            <div className="flex items-start justify-between">

                                <div>

                                    <h1 className="text-3xl font-bold text-green-700">

                                        Agro Shop CRM

                                    </h1>

                                    <p className="mt-1 text-slate-500">

                                        Sales Invoice

                                    </p>

                                </div>

                                <div className="text-right">

                                    <h2 className="text-xl font-bold">

                                        {viewSale.invoiceNo}

                                    </h2>

                                    <p className="text-slate-500">

                                        {new Date(

                                            viewSale.saleDate

                                        ).toLocaleDateString()}

                                    </p>

                                </div>

                            </div>

                            <hr className="my-5" />

                            <div className="grid grid-cols-2 gap-8">

                                <div>

                                    <p>

                                        <span className="font-semibold">

                                            Customer :

                                        </span>

                                        {" "}

                                        {viewSale.customer?.name}

                                    </p>

                                    <p className="mt-2">

                                        <span className="font-semibold">

                                            Phone :

                                        </span>

                                        {" "}

                                        {viewSale.customer?.phone}

                                    </p>

                                    <p className="mt-2">

                                        <span className="font-semibold">

                                            Address :

                                        </span>

                                        {" "}

                                        {viewSale.customer?.address || "-"}

                                    </p>

                                </div>

                                <div className="text-right">

                                    <p>

                                        <span className="font-semibold">

                                            Total Items :

                                        </span>

                                        {" "}

                                        {viewSale.items.length}

                                    </p>

                                    <p className="mt-2">

                                        <span className="font-semibold">

                                            Due :

                                        </span>

                                        <span className="ml-2 text-red-600 font-bold">

                                            ৳ {viewSale.dueAmount}

                                        </span>

                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="mt-8 overflow-hidden rounded-xl border">

                            <table className="min-w-full">

                                <thead className="bg-slate-100">

                                    <tr>

                                        <th className="px-4 py-3 text-left">

                                            Product

                                        </th>

                                        <th className="px-4 py-3 text-center">

                                            Qty

                                        </th>

                                        <th className="px-4 py-3 text-right">

                                            Buy

                                        </th>

                                        <th className="px-4 py-3 text-right">

                                            Sell

                                        </th>

                                        <th className="px-4 py-3 text-right">

                                            Profit

                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {

                                        viewSale.items?.map((item: any) => (

                                            <tr

                                                key={item.id}

                                                className="border-t"

                                            >

                                                <td className="px-4 py-3">

                                                    {

                                                        item.batch?.product?.name

                                                    }

                                                </td>

                                                <td className="px-4 py-3 text-center">

                                                    {item.quantity}

                                                </td>

                                                <td className="px-4 py-3 text-right">

                                                    ৳ {item.buyPrice}

                                                </td>

                                                <td className="px-4 py-3 text-right">

                                                    ৳ {item.sellPrice}

                                                </td>

                                                <td className="px-4 py-3 text-right font-semibold text-green-600">

                                                    ৳ {item.profit}

                                                </td>

                                            </tr>

                                        ))

                                    }

                                </tbody>

                            </table>

                        </div>


                        <div className="mt-6 flex justify-end">

                            <div className="w-96 rounded-xl border bg-slate-50 p-5">

                                <div className="mb-2 flex justify-between">
                                    <span>Original Sale Total</span>
                                    <span className="font-semibold">
                                        ৳ {originalSaleTotal.toFixed(2)}
                                    </span>
                                </div>

                                {totalSaleReturn > 0 && (
                                    <div className="mb-2 flex justify-between text-orange-700">
                                        <span>Total Sale Return</span>
                                        <span className="font-semibold">
                                            - ৳ {totalSaleReturn.toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                <div className="mb-2 flex justify-between">
                                    <span>Current / Net Sale</span>
                                    <span className="font-semibold">
                                        ৳ {currentSaleTotal.toFixed(2)}
                                    </span>
                                </div>

                                <div className="mb-2 flex justify-between">
                                    <span>Discount</span>
                                    <span>
                                        ৳ {Number(viewSale.discount ?? 0).toFixed(2)}
                                    </span>
                                </div>

                                <div className="mb-2 flex justify-between">
                                    <span>Original Paid</span>
                                    <span className="font-semibold text-green-600">
                                        ৳ {originalPaidAmount.toFixed(2)}
                                    </span>
                                </div>

                                {totalCashReturned > 0 && (
                                    <div className="mb-2 flex justify-between text-orange-700">
                                        <span>Cash Returned</span>
                                        <span>
                                            - ৳ {totalCashReturned.toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                {totalDueAdjusted > 0 && (
                                    <div className="mb-2 flex justify-between text-blue-700">
                                        <span>Due Adjusted</span>
                                        <span>
                                            - ৳ {totalDueAdjusted.toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                <div className="mb-2 flex justify-between">
                                    <span>Current Paid</span>
                                    <span className="font-semibold text-green-600">
                                        ৳ {currentPaidAmount.toFixed(2)}
                                    </span>
                                </div>

                                <hr className="my-3" />

                                <div className="flex justify-between text-lg font-bold text-red-600">
                                    <span>Current Due</span>
                                    <span>
                                        ৳ {currentDueAmount.toFixed(2)}
                                    </span>
                                </div>

                                {saleReturns.length > 0 && (
                                    <div className="mt-2 flex justify-between text-sm text-slate-500">
                                        <span>Original Due</span>
                                        <span>
                                            ৳ {originalDueAmount.toFixed(2)}
                                        </span>
                                    </div>
                                )}

                            </div>

                        </div>

                        {/* ================================= */}
                        {/* SALE RETURN HISTORY */}
                        {/* ================================= */}

                        <div className="mt-8 rounded-xl border bg-white p-6">
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-slate-800">
                                    🔄 Sale Return History
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    এই invoice থেকে করা সব return এখানে দেখা যাবে।
                                </p>
                            </div>

                            {saleReturns.length === 0 ? (
                                <div className="rounded-xl border border-dashed bg-slate-50 p-6 text-center text-slate-500">
                                    এই sale থেকে এখনো কোনো return করা হয়নি।
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border">
                                    <table className="min-w-full">
                                        <thead className="bg-orange-50">
                                            <tr>
                                                <th className="border-b px-4 py-3 text-left">Date</th>
                                                <th className="border-b px-4 py-3 text-right">Return Amount</th>
                                                <th className="border-b px-4 py-3 text-right">Cash Returned</th>
                                                <th className="border-b px-4 py-3 text-right">Due Adjusted</th>
                                                <th className="border-b px-4 py-3 text-left">Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {saleReturns.map((saleReturn: any) => (
                                                <tr key={saleReturn.id} className="border-t">
                                                    <td className="px-4 py-3">
                                                        {new Date(saleReturn.returnDate).toLocaleDateString("en-BD")}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-orange-700">
                                                        ৳ {Number(saleReturn.totalAmount ?? 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-green-700">
                                                        ৳ {Number(saleReturn.cashReturned ?? 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-blue-700">
                                                        ৳ {Number(saleReturn.adjustedDue ?? 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {saleReturn.reason || "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                    </div>

                </div>

            )}

            {customerInvoice && viewSale && (

                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6">

                    <div className="max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">

                        <div ref={customerInvoiceRef}>
                            <InvoicePrint sale={viewSale} />
                        </div>

                        <div className="flex justify-end gap-3 border-t p-5">

                            <button
                                onClick={handleCustomerPrint}
                            >
                                🖨 Print
                            </button>

                            <button
                                onClick={() => setCustomerInvoice(false)}
                                className="rounded-lg bg-red-600 px-5 py-2 text-white"
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {officeInvoice && viewSale && (

                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6">

                    <div className="max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">

                        <div ref={officeInvoiceRef}>

                            <InvoicePrint
                                sale={viewSale}
                                officeCopy={true}
                            />

                        </div>

                        <div className="flex justify-end gap-3 border-t p-5">

                            <button
                                onClick={handleOfficePrint}
                                className="rounded-lg bg-green-600 px-5 py-2 text-white"
                            >
                                🖨 Print
                            </button>

                            <button
                                onClick={() => setOfficeInvoice(false)}
                                className="rounded-lg bg-red-600 px-5 py-2 text-white"
                            >

                                Close

                            </button>

                        </div>

                    </div>

                </div>

            )}


            {returnSale && (
                <SaleReturnModal
                    sale={returnSale}

                    onClose={() => {
                        setReturnSale(null);
                    }}

                    onSuccess={async () => {
                        setReturnSale(null);

                        await loadSales();

                        if (viewSale?.id) {
                            try {
                                const response = await axios.get(
                                    `/api/sale/${viewSale.id}`
                                );

                                setViewSale(response.data);
                            } catch (error) {
                                console.error(error);
                            }
                        }
                    }}
                />
            )}


        </div>

    );

}