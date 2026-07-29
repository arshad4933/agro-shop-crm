interface Props {
    payment: any;
}

export default function PaymentReceiptPrint({
    payment,
}: Props) {
    return (
        <div className="mx-auto w-full max-w-[210mm] bg-white p-10 text-black">

            <div className="border-b pb-6 text-center">

                <h1 className="text-4xl font-bold text-green-700">
                    Agro Shop CRM
                </h1>

                <p className="mt-2 text-xl font-semibold">
                    PAYMENT RECEIPT
                </p>

            </div>

            <div className="mt-8 flex justify-between">

                <div>

                    <p>
                        <b>Receipt No :</b>{" "}
                        PAY-{payment.id}
                    </p>

                    <p>
                        <b>Date :</b>{" "}
                        {new Date(
                            payment.paymentDate
                        ).toLocaleDateString()}
                    </p>

                    <p>
                        <b>Invoice :</b>{" "}
                        {payment.sale?.invoiceNo}
                    </p>

                </div>

                <div className="text-right">

                    <p>
                        <b>Customer :</b>{" "}
                        {payment.customer?.name}
                    </p>

                    <p>
                        <b>Phone :</b>{" "}
                        {payment.customer?.phone}
                    </p>

                </div>

            </div>

            <div className="mt-10 rounded-xl border p-6">

                <div className="flex justify-between py-3">

                    <span>Previous Due</span>

                    <span>
                        ৳ {payment.sale?.dueAmount + payment.amount}
                    </span>

                </div>

                <div className="flex justify-between py-3">

                    <span>Received Amount</span>

                    <span className="font-bold text-green-700">
                        ৳ {payment.amount}
                    </span>

                </div>

                <div className="flex justify-between py-3">

                    <span>Current Due</span>

                    <span className="font-bold text-red-600">
                        ৳ {payment.sale?.dueAmount}
                    </span>

                </div>

                <div className="flex justify-between py-3">

                    <span>Payment Method</span>

                    <span>
                        {payment.paymentMethod}
                    </span>

                </div>

                {payment.note && (

                    <div className="mt-5">

                        <b>Note :</b>

                        <p className="mt-2">
                            {payment.note}
                        </p>

                    </div>

                )}

            </div>

            <div className="mt-24 flex justify-between">

                <div className="text-center">

                    <div className="w-56 border-t"></div>

                    <p className="mt-2">
                        Customer Signature
                    </p>

                </div>

                <div className="text-center">

                    <div className="w-56 border-t"></div>

                    <p className="mt-2">
                        Authorized Signature
                    </p>

                </div>

            </div>

            <p className="mt-16 text-center text-sm text-slate-500">

                Thank you.

            </p>

        </div>
    );
}