type SupplierHeaderProps = {

    onAdd?: () => void;

};

export default function SupplierHeader({

    onAdd,

}: SupplierHeaderProps) {

    return (

        <div className="flex items-center justify-between rounded-xl bg-white p-6 shadow-sm">

            <div>

                <h1 className="text-3xl font-bold text-slate-800">

                    🚚 Suppliers

                </h1>

                <p className="mt-1 text-slate-500">

                    Manage all suppliers

                </p>

            </div>

            <button

                onClick={onAdd}

                className="rounded-lg bg-green-600 px-5 py-3 font-medium text-white transition hover:bg-green-700"

            >

                + Add Supplier

            </button>

        </div>

    );

}