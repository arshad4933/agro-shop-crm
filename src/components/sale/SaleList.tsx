interface Props {

    sales: any[];

    onView: (sale: any) => void;

    onDelete: (sale: any) => void;

}

export default function SaleList({

    sales,

    onView,

    onDelete,

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

                    {

                        sales.length === 0 ? (

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

                                        ৳ {sale.totalAmount}

                                    </td>

                                    <td className="px-4 py-3 text-right">

                                        ৳ {sale.paidAmount}

                                    </td>

                                    <td className="px-4 py-3 text-right text-red-600 font-semibold">

                                        ৳ {sale.dueAmount}

                                    </td>

                                    <td className="px-4 py-3">

                                        <div className="flex justify-center gap-2">

                                            <button

                                                onClick={() => onView(sale)}

                                                className="rounded bg-blue-600 px-3 py-1 text-sm text-white"

                                            >

                                                View

                                            </button>

                                            <button

                                                onClick={() => onDelete(sale)}

                                                className="rounded bg-red-600 px-3 py-1 text-sm text-white"

                                            >

                                                Delete

                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            ))

                        )

                    }

                </tbody>

            </table>

        </div>

    );

}