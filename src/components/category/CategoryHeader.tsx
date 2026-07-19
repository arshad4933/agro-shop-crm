import { Plus } from "lucide-react";

type CategoryHeaderProps = {
    onAdd: () => void;
};

export default function CategoryHeader({
    onAdd,
}: CategoryHeaderProps) {

    return (

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

                <h1 className="text-3xl font-bold text-slate-800">

                    Category

                </h1>

                <p className="mt-1 text-slate-500">

                    Manage all product categories

                </p>

            </div>

            <button
                onClick={onAdd}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-3 text-white transition hover:bg-green-700"
            >

                <Plus size={20} />

                Add Category

            </button>

        </div>

    );

}