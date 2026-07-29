interface Props {
    payments: any[];
    onEdit: (payment: any) => void;
    onDelete: (payment: any) => void;
    onReceipt: (payment: any) => void;
}

export default function CustomerPaymentTable({
    payments,
    onEdit,
    onDelete,
    onReceipt,
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

                            Amount

                        </th>

                        <th className="px-4 py-3 text-center">

                            Method

                        </th>

                        <th className="px-4 py-3 text-center">

                            Date

                        </th>

                        <th className="px-4 py-3 text-center">

                            Action

                        </th>

                    </tr>

                </thead>

                <tbody>

                    {

                        payments.length === 0 && (

                            <tr>

                                <td
                                    colSpan={6}
                                    className="py-10 text-center text-slate-500"
                                >

                                    No Customer Payment Found

                                </td>

                            </tr>

                        )

                    }

                    {

                        payments.map((payment) => (

                            <tr
                                key={payment.id}
                                className="border-t"
                            >

                                <td className="px-4 py-3">

                                    {payment.sale?.invoiceNo}

                                </td>

                                <td className="px-4 py-3">

                                    {payment.customer?.name}

                                </td>

                                <td className="px-4 py-3 text-right font-semibold">

                                    ৳ {payment.amount}

                                </td>

                                <td className="px-4 py-3 text-center">

                                    {payment.paymentMethod}

                                </td>

                                <td className="px-4 py-3 text-center">

                                    {

                                        new Date(
                                            payment.paymentDate
                                        ).toLocaleDateString()

                                    }

                                </td>

                                <td className="px-4 py-3">

                                    <div className="flex justify-center gap-2">

                                        <button
                                            onClick={() => onEdit(payment)}
                                            className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
                                        >

                                            Edit

                                        </button>
                                        <button
                                            onClick={() => onReceipt(payment)}
                                            className="rounded bg-green-600 px-3 py-1 text-sm text-white"
                                        >
                                            Receipt
                                        </button>
                                        <button
                                            onClick={() => onDelete(payment)}
                                            className="rounded bg-red-600 px-3 py-1 text-sm text-white"
                                        >

                                            Delete

                                        </button>

                                    </div>

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

        </div>

    );

}