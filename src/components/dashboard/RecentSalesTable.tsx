"use client";

type Sale = {

    id: number;

    invoiceNo: string;

    saleDate: string;

    totalAmount: string;

    dueAmount: string;

    customer: {

        name: string;

    };

};

type RecentSalesTableProps = {

    sales: Sale[];

};

export default function RecentSalesTable({

    sales,

}: RecentSalesTableProps) {
    return (

        <div className="rounded-xl bg-white shadow">

            <div className="border-b px-6 py-4">

                <h2 className="text-xl font-semibold">

                    Recent Sales

                </h2>

            </div>

            <div className="overflow-x-auto">

                <table className="min-w-full">

                    <thead className="bg-slate-100">

                        <tr>

                            <th className="px-4 py-3 text-left">
                                Invoice
                            </th>

                            <th className="px-4 py-3 text-left">
                                Customer
                            </th>

                            <th className="px-4 py-3 text-left">
                                Date
                            </th>

                            <th className="px-4 py-3 text-right">
                                Total
                            </th>

                            <th className="px-4 py-3 text-right">
                                Due
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            sales.map((sale) => (

                                <tr
                                    key={sale.id}
                                    className="border-b hover:bg-slate-50"
                                >

                                    <td className="px-4 py-3">

                                        {sale.invoiceNo}

                                    </td>

                                    <td className="px-4 py-3">

                                        {sale.customer.name}

                                    </td>

                                    <td className="px-4 py-3">

                                        {new Date(
                                            sale.saleDate
                                        ).toLocaleDateString()}

                                    </td>

                                    <td className="px-4 py-3 text-right font-semibold">

                                        ৳ {Number(
                                            sale.totalAmount
                                        ).toLocaleString()}

                                    </td>

                                    <td className="px-4 py-3 text-right text-red-600 font-semibold">

                                        ৳ {Number(
                                            sale.dueAmount
                                        ).toLocaleString()}

                                    </td>

                                </tr>

                            ))

                        }

                    </tbody>

                </table>

            </div>

        </div>

    );

}