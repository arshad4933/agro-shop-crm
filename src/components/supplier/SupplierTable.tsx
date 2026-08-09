"use client";

import { useRouter } from "next/navigation";

type Supplier = {
    id: number;
    name: string;
    company?: string | null;
    phone: string;
    openingDue: number | string;
    isActive: boolean;
};

type SupplierTableProps = {
    suppliers: Supplier[];
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplier: Supplier) => void;
};

export default function SupplierTable({
    suppliers,
    onEdit,
    onDelete,
}: SupplierTableProps) {
    const router = useRouter();

    function handleView(supplier: Supplier) {
        router.push(`/supplier/${supplier.id}`);
    }

    return (
        <div className="overflow-hidden rounded-xl bg-white shadow">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[850px]">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="px-5 py-3 text-left">
                                Supplier
                            </th>

                            <th className="px-5 py-3 text-left">
                                Company
                            </th>

                            <th className="px-5 py-3 text-left">
                                Phone
                            </th>

                            <th className="px-5 py-3 text-left">
                                Opening Due
                            </th>

                            <th className="px-5 py-3 text-center">
                                Status
                            </th>

                            <th className="px-5 py-3 text-center">
                                Action
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {suppliers.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="py-10 text-center text-slate-400"
                                >
                                    No suppliers found.
                                </td>
                            </tr>
                        ) : (
                            suppliers.map((supplier) => (
                                <tr
                                    key={supplier.id}
                                    className="border-t transition hover:bg-slate-50"
                                >
                                    <td className="px-5 py-4 font-medium text-slate-800">
                                        {supplier.name}
                                    </td>

                                    <td className="px-5 py-4 text-slate-600">
                                        {supplier.company || "-"}
                                    </td>

                                    <td className="px-5 py-4 text-slate-600">
                                        {supplier.phone}
                                    </td>

                                    <td className="px-5 py-4 font-medium">
                                        ৳{" "}
                                        {Number(
                                            supplier.openingDue
                                        ).toLocaleString("en-BD", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </td>

                                    <td className="px-5 py-4 text-center">
                                        {supplier.isActive ? (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                                                🟢 Active
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                                                🔴 Inactive
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-5 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {/* VIEW */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleView(
                                                        supplier
                                                    )
                                                }
                                                className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
                                                title="View Supplier"
                                            >
                                                👁️ View
                                            </button>

                                            {/* EDIT */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onEdit(
                                                        supplier
                                                    )
                                                }
                                                className="rounded-lg bg-yellow-50 px-3 py-2 text-lg transition hover:bg-yellow-100"
                                                title="Edit Supplier"
                                            >
                                                ✏️
                                            </button>

                                            {/* DELETE */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onDelete(
                                                        supplier
                                                    )
                                                }
                                                className="rounded-lg bg-red-50 px-3 py-2 text-lg transition hover:bg-red-100"
                                                title="Delete Supplier"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}