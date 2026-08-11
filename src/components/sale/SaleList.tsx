interface Props {
    sales: any[];

    onView: (sale: any) => void;

    onDelete: (sale: any) => void;

    onReturn: (sale: any) => void;
}

export default function SaleList({
    sales,
    onView,
    onDelete,
    onReturn,
}: Props) {
    return (
        <div className="overflow-hidden rounded-xl bg-white shadow">
            <table className="min-w-full">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="px-4 py-3 text-left">
                            Invoice
                        </th>

                        <th className="px-4 py-3 text-left">
                            Customer
                        </th>

                        <th className="px-4 py-3 text-right">
                            Total
                        </th>

                        <th className="px-4 py-3 text-right">
                            Paid
                        </th>

                        <th className="px-4 py-3 text-right">
                            Due
                        </th>

                        <th className="px-4 py-3 text-center">
                            Action
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {sales.length === 0 ? (
                        <tr>
                            <td
                                colSpan={6}
                                className="py-10 text-center text-slate-500"
                            >
                                No Sales Found
                            </td>
                        </tr>
                    ) : (
                        sales.map((sale) => (
                            <tr
                                key={sale.id}
                                className="border-t"
                            >
                                <td className="px-4 py-3">
                                    {sale.invoiceNo}
                                </td>

                                <td className="px-4 py-3">
                                    {sale.customer?.name}
                                </td>

                                <td className="px-4 py-3 text-right">
                                    ৳{" "}
                                    {Number(
                                        sale.totalAmount
                                    ).toFixed(2)}
                                </td>

                                <td className="px-4 py-3 text-right">
                                    ৳{" "}
                                    {Number(
                                        sale.paidAmount
                                    ).toFixed(2)}
                                </td>

                                <td className="px-4 py-3 text-right font-semibold text-red-600">
                                    ৳{" "}
                                    {Number(
                                        sale.dueAmount
                                    ).toFixed(2)}
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() =>
                                                onView(
                                                    sale
                                                )
                                            }
                                            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                                        >
                                            View
                                        </button>

                                        <button
                                            onClick={() =>
                                                onReturn(
                                                    sale
                                                )
                                            }
                                            className="rounded bg-orange-600 px-3 py-1 text-sm text-white hover:bg-orange-700"
                                        >
                                            Return
                                        </button>

                                        <button
                                            onClick={() =>
                                                onDelete(
                                                    sale
                                                )
                                            }
                                            className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}