type PurchaseHeaderProps = {
    onAdd: () => void;
};

export default function PurchaseHeader({
    onAdd,
}: PurchaseHeaderProps) {

    return (

        <div className="flex items-center justify-between rounded-xl bg-white p-6 shadow">

            <div>

                <h1 className="text-3xl font-bold text-slate-800">

                    Purchase Management

                </h1>

                <p className="mt-1 text-slate-500">

                    Manage product purchases from suppliers

                </p>

            </div>

            <button
                onClick={onAdd}
                className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
            >

                + New Purchase

            </button>

        </div>

    );

}