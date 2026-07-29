interface Props {
    onAdd: () => void;
}

export default function CustomerPaymentHeader({

    onAdd,

}: Props) {

    return (

        <div className="flex items-center justify-between rounded-xl bg-white p-6 shadow">

            <div>

                <h1 className="text-3xl font-bold">

                    Customer Payment

                </h1>

                <p className="mt-1 text-slate-500">

                    Receive Due Payment From Customers

                </p>

            </div>

            <button

                onClick={onAdd}

                className="rounded-lg bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-700"

            >

                + Receive Payment

            </button>

        </div>

    );

}