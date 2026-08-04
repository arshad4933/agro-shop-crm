"use client";

interface Props {
    customer: any;
    details: any;
}

export default function CustomerStatementPrint({
    customer,
    details,
}: Props) {

    if (!details) return null;

    return (

        <div className="mx-auto w-full max-w-[210mm] bg-white p-10 text-black">

            {/* Header */}

            <div className="border-b pb-5 text-center">

                <h1 className="text-4xl font-bold text-green-700">
                    AGRO SHOP CRM
                </h1>

                <p className="mt-2 text-xl font-semibold">
                    Customer Account Statement
                </p>

            </div>

            {/* Customer Info */}

            <div className="mt-8 flex justify-between">

                <div>

                    <p>
                        <b>Customer :</b> {customer.name}
                    </p>

                    <p>
                        <b>Phone :</b> {customer.phone}
                    </p>

                </div>

                <div className="text-right">

                    <p>
                        <b>Print Date :</b>{" "}
                        {new Date().toLocaleDateString()}
                    </p>

                    <p>
                        <b>Total Invoice :</b>{" "}
                        {details.summary.invoiceCount}
                    </p>

                </div>

            </div>

            {/* Summary */}

            <div className="mt-8 grid grid-cols-4 gap-4">

                <div className="rounded-lg border p-4 text-center">

                    <p className="text-sm text-slate-500">
                        Total Purchase
                    </p>

                    <h3 className="mt-2 text-xl font-bold">

                        ৳ {details.summary.totalPurchase}

                    </h3>

                </div>

                <div className="rounded-lg border p-4 text-center">

                    <p className="text-sm text-slate-500">
                        Total Paid
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-green-700">

                        ৳ {details.summary.totalPaid}

                    </h3>

                </div>

                <div className="rounded-lg border p-4 text-center">

                    <p className="text-sm text-slate-500">
                        Current Due
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-red-600">

                        ৳ {details.summary.currentDue}

                    </h3>

                </div>

                <div className="rounded-lg border p-4 text-center">

                    <p className="text-sm text-slate-500">
                        Opening Due
                    </p>

                    <h3 className="mt-2 text-xl font-bold">

                        ৳ {customer.openingDue}

                    </h3>

                </div>

            </div>

            {/* Ledger */}

            <div className="mt-10">

                <h2 className="mb-4 text-xl font-bold">
                    Customer Ledger
                </h2>

                <table className="w-full border-collapse border">

                    <thead>

                        <tr className="bg-slate-200">

                            <th className="border p-2">
                                Date
                            </th>

                            <th className="border p-2">
                                Particular
                            </th>

                            <th className="border p-2">
                                Debit
                            </th>

                            <th className="border p-2">
                                Credit
                            </th>

                            <th className="border p-2">
                                Balance
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {details.ledger.map((item: any) => (

                            <tr key={item.id}>

                                <td className="border p-2">

                                    {new Date(item.date).toLocaleDateString()}

                                </td>

                                <td className="border p-2">

                                    {item.particular}

                                </td>

                                <td className="border p-2 text-right">

                                    {item.debit > 0
                                        ? `৳ ${item.debit}`
                                        : "-"}

                                </td>

                                <td className="border p-2 text-right">

                                    {item.credit > 0
                                        ? `৳ ${item.credit}`
                                        : "-"}

                                </td>

                                <td className="border p-2 text-right font-semibold">

                                    ৳ {item.balance}

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            {/* Due Invoice */}

            <div className="mt-10">

                <h2 className="mb-4 text-xl font-bold">
                    Current Due Invoices
                </h2>

                <table className="w-full border-collapse border">

                    <thead>

                        <tr className="bg-slate-200">

                            <th className="border p-2">
                                Invoice
                            </th>

                            <th className="border p-2">
                                Date
                            </th>

                            <th className="border p-2">
                                Total
                            </th>

                            <th className="border p-2">
                                Due
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {details.dueInvoices.length === 0 ? (

                            <tr>

                                <td
                                    colSpan={4}
                                    className="border p-4 text-center"
                                >

                                    No Due Invoice

                                </td>

                            </tr>

                        ) : (

                            details.dueInvoices.map((sale: any) => (

                                <tr key={sale.id}>

                                    <td className="border p-2">

                                        {sale.invoiceNo}

                                    </td>

                                    <td className="border p-2">

                                        {new Date(
                                            sale.saleDate
                                        ).toLocaleDateString()}

                                    </td>

                                    <td className="border p-2 text-right">

                                        ৳ {sale.totalAmount}

                                    </td>

                                    <td className="border p-2 text-right text-red-600 font-semibold">

                                        ৳ {sale.dueAmount}

                                    </td>

                                </tr>

                            ))

                        )}

                    </tbody>

                </table>

            </div>

            {/* Footer */}

            <div className="mt-20 flex justify-between">

                <div className="text-center">

                    <div className="w-56 border-t"></div>

                    <p className="mt-2">
                        Customer Signature
                    </p>

                </div>

                <div className="text-center">

                    <div className="w-56 border-t"></div>

                    <p className="mt-2">
                        Authorized Signature
                    </p>

                </div>

            </div>

        </div>

    );

}