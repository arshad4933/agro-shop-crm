interface Props {
    onAdd: () => void;
}

export default function CustomerHeader({
    onAdd,
}: Props) {

    return (

        <div className="flex items-center justify-between rounded-xl bg-white p-6 shadow">

            <div>

                <h1 className="text-3xl font-bold">

                    Customers

                </h1>

                <p className="mt-1 text-slate-500">

                    Manage all customers

                </p>

            </div>

            <button
                onClick={onAdd}
                className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
            >
                + Add Customer
            </button>

        </div>

    );

}