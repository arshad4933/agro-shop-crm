type Product = {
    id: number;
    name: string;
    brand: string | null;
    unit: string;
    minimumStock: number;
    isActive: boolean;

    category: {
        id: number;
        name: string;
    };
};

type ProductTableProps = {
    products: Product[];
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
};



export default function ProductTable({
    products,
    onEdit,
    onDelete,
}: ProductTableProps) {

    return (

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">

            <table className="w-full">

                <thead className="bg-slate-100">

                    <tr>

                        <th className="px-6 py-4 text-left">
                            Product
                        </th>

                        <th className="px-6 py-4 text-left">
                            Category
                        </th>

                        <th className="px-6 py-4 text-left">
                            Brand
                        </th>

                        <th className="px-6 py-4 text-left">
                            Unit
                        </th>

                        <th className="px-6 py-4 text-left">
                            Min Stock
                        </th>

                        <th className="px-6 py-4 text-left">
                            Status
                        </th>

                        <th className="px-6 py-4 text-center">
                            Action
                        </th>

                    </tr>

                </thead>

                <tbody>

                    {products.map((product) => (

                        <tr
                            key={product.id}
                            className="border-t hover:bg-slate-50"
                        >

                            <td className="px-6 py-4 font-semibold">

                                {product.name}

                            </td>

                            <td className="px-6 py-4">

                                {product.category.name}

                            </td>

                            <td className="px-6 py-4">

                                {product.brand || "-"}

                            </td>

                            <td className="px-6 py-4">

                                {product.unit}

                            </td>

                            <td className="px-6 py-4">

                                {product.minimumStock}

                            </td>

                            <td className="px-6 py-4">

                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${product.isActive
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {product.isActive ? "Active" : "Inactive"}
                                </span>

                            </td>

                            <td className="px-6 py-4 text-center">

                                <button
                                    onClick={() => onEdit(product)}
                                    className="mr-3 rounded-lg p-2 transition hover:bg-blue-100"
                                >
                                    ✏️
                                </button>

                                <button
                                    onClick={() => onDelete(product)}
                                    className="rounded-lg p-2 transition hover:bg-red-100"
                                >
                                    🗑️
                                </button>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}