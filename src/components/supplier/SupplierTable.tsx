type Supplier = {
    id: number;
    name: string;
    company?: string;
    phone: string;
    openingDue: number;
    isActive: boolean;
};

type SupplierTableProps = {
    suppliers: Supplier[];
    onEdit: (supplier: Supplier) => void;
};

export default function SupplierTable({
    suppliers,
    onEdit,
}: SupplierTableProps) {

    return (

        <div className="overflow-hidden rounded-xl bg-white shadow">

            <table className="w-full">

                <thead className="bg-slate-100">

                    <tr>

                        <th className="px-5 py-3 text-left">Supplier</th>

                        <th className="px-5 py-3 text-left">Company</th>

                        <th className="px-5 py-3 text-left">Phone</th>

                        <th className="px-5 py-3 text-left">Opening Due</th>

                        <th className="px-5 py-3 text-center">Status</th>

                        <th className="px-5 py-3 text-center">Action</th>

                    </tr>

                </thead>

                <tbody>

                    {suppliers.map((supplier) => (

                        <tr
                            key={supplier.id}
                            className="border-t"
                        >

                            <td className="px-5 py-4 font-medium">

                                {supplier.name}

                            </td>

                            <td className="px-5 py-4">

                                {supplier.company || "-"}

                            </td>

                            <td className="px-5 py-4">

                                {supplier.phone}

                            </td>

                            <td className="px-5 py-4">

                                ৳ {parseFloat(String(supplier.openingDue)).toLocaleString()}

                            </td>

                            <td className="px-5 py-4 text-center">

                                {supplier.isActive ? "🟢" : "🔴"}

                            </td>

                            <td className="px-5 py-4 text-center">

                                <button
                                    onClick={() => onEdit(supplier)}
                                    className="mr-3 text-xl"
                                >
                                    ✏️
                                </button>

                                <button
                                    className="text-xl"
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