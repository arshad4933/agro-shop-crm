interface Props {

    sales: any[];

    onEdit: (sale: any) => void;

    onDelete: (sale: any) => void;

}

export default function SaleTable({

    sales,

    onEdit,

    onDelete,

}: Props) {

    return (

        <div className="overflow-hidden rounded-xl bg-white shadow">

            <table className="min-w-full">

                <thead className="bg-slate-100">

                    <tr>

                        <th className="px-5 py-4 text-left">

                            Invoice

                        </th>

                        <th className="px-5 py-4 text-left">

                            Customer

                        </th>

                        <th className="px-5 py-4 text-left">

                            Date

                        </th>

                        <th className="px-5 py-4 text-right">

                            Total

                        </th>

                        <th className="px-5 py-4 text-right">

                            Paid

                        </th>

                        <th className="px-5 py-4 text-right">

                            Due

                        </th>

                        <th className="px-5 py-4 text-center">

                            Action

                        </th>

                    </tr>

                </thead>

                <tbody>

                    {

                        sales.length === 0 && (

                            <tr>

                                <td
                                    colSpan={7}
                                    className="py-10 text-center text-slate-500"
                                >

                                    No Sales Found

                                </td>

                            </tr>

                        )

                    }

                </tbody>

            </table>

        </div>

    );

}