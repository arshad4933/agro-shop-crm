"use client";

interface Props {
    customers: any[];
    onEdit: (customer: any) => void;
    onDelete: (customer: any) => void;
}

export default function CustomerTable({
    customers,
    onEdit,
    onDelete,
}: Props) {

    return (

        <div className="overflow-hidden rounded-xl bg-white shadow">

            <div className="overflow-x-auto">

                <table className="min-w-full">

                    <thead className="bg-slate-100">

                        <tr>

                            <th className="px-5 py-4 text-left">
                                Customer
                            </th>

                            <th className="px-5 py-4 text-left">
                                Phone
                            </th>

                            <th className="px-5 py-4 text-left">
                                Address
                            </th>

                            <th className="px-5 py-4 text-right">
                                Opening Due
                            </th>

                            <th className="px-5 py-4 text-center">
                                Action
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            customers.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan={5}
                                        className="py-8 text-center text-slate-500"
                                    >
                                        No Customers Found
                                    </td>

                                </tr>

                            ) : (

                                customers.map((customer) => (

                                    <tr
                                        key={customer.id}
                                        className="border-b hover:bg-slate-50"
                                    >

                                        <td className="px-5 py-4 font-semibold text-blue-600">

                                            {customer.name}

                                        </td>

                                        <td className="px-5 py-4">

                                            {customer.phone}

                                        </td>

                                        <td className="px-5 py-4">

                                            {customer.address || "-"}

                                        </td>

                                        <td className="px-5 py-4 text-right text-red-600 font-semibold">

                                            ৳ {Number(
                                                customer.openingDue
                                            ).toLocaleString()}

                                        </td>

                                        <td className="px-5 py-4">

                                            <div className="flex justify-center gap-2">

                                                <button
                                                    onClick={() => onEdit(customer)}
                                                    className="rounded-lg bg-yellow-500 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-600"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() => onDelete(customer)}
                                                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
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

        </div>

    );

}