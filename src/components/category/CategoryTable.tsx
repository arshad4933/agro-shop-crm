type Category = {

    id: number;

    name: string;

    description: string | null;

};

type CategoryTableProps = {

    categories: Category[];

};

export default function CategoryTable({

    categories,

}: CategoryTableProps) {
    return (

        <div className="overflow-hidden rounded-xl bg-white shadow">

            <table className="min-w-full">

                <thead className="bg-slate-100">

                    <tr>

                        <th className="px-6 py-4 text-left font-semibold">

                            Name

                        </th>

                        <th className="px-6 py-4 text-left font-semibold">

                            Description

                        </th>

                        <th className="px-6 py-4 text-center font-semibold">

                            Action

                        </th>

                    </tr>

                </thead>

                <tbody>

                    {

                        categories.length === 0 ? (

                            <tr>

                                <td
                                    colSpan={3}
                                    className="py-10 text-center text-slate-500"
                                >

                                    No Categories Found

                                </td>

                            </tr>

                        ) : (

                            categories.map((category) => (

                                <tr
                                    key={category.id}
                                    className="border-t hover:bg-slate-50"
                                >

                                    <td className="px-6 py-4 font-medium">

                                        {category.name}

                                    </td>

                                    <td className="px-6 py-4 text-slate-600">

                                        {category.description || "-"}

                                    </td>

                                    <td className="px-6 py-4">

                                        <div className="flex justify-center gap-3">

                                            <button
                                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                                            >

                                                Edit

                                            </button>

                                            <button
                                                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
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