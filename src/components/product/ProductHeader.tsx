
"use client";

type ProductHeaderProps = {

    onAdd: () => void;

};

export default function ProductHeader({

    onAdd,

}: ProductHeaderProps) {

    return (

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

                <h1 className="text-4xl font-bold text-slate-800">

                    Products

                </h1>

                <p className="mt-2 text-slate-500">

                    Manage all products in your inventory

                </p>

            </div>

            <button

                onClick={onAdd}

                className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition hover:bg-green-700"

            >

                + Add Product

            </button>

        </div>

    );

}