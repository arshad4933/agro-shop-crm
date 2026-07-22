type Category = {

    id: number;

    name: string;

    description: string | null;

};

type CategoryTableProps = {

    categories: Category[];

    onEdit: (category: Category) => void;

    onDelete: (category: Category) => void;

    onAddCategory: () => void;

};

export default function CategoryTable({

    categories,

    onEdit,

    onDelete,

    onAddCategory,

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

                                <td colSpan={3} className="py-16">

                                    <div className="flex flex-col items-center justify-center">

                                        <div className="mb-4 text-6xl">

                                            📂

                                        </div>

                                        <h3 className="text-xl font-semibold text-slate-700">

                                            No Categories Yet

                                        </h3>

                                        <p className="mt-2 max-w-sm text-center text-slate-500">

                                            You haven't created any category yet.
                                            Click the <strong>Add Category</strong> button
                                            to create your first category.

                                        </p>
                                        <button

                                            onClick={onAddCategory}

                                            className="mt-6 rounded-lg bg-green-600 px-6 py-3 text-white transition hover:bg-green-700"

                                        >

                                            + Add Category

                                        </button>

                                    </div>

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

                                                onClick={() => onEdit(category)}

                                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"

                                            >

                                                Edit

                                            </button>

                                            <button

                                                onClick={() => onDelete(category)}

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