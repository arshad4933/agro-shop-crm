interface Props {
    sale: any;
    officeCopy?: boolean;
}

export default function InvoicePrint({
    sale,
    officeCopy = false,
}: Props) {

    return (

        <div
            id="customer-invoice"
            className="mx-auto w-full max-w-[210mm] bg-white p-10 text-black"
        >

            <div className="border-b pb-6">

                <h1 className="text-4xl font-bold text-center">

                    Agro Shop CRM

                </h1>

                <p className="mt-2 text-center text-slate-500">
                    {officeCopy ? "OFFICE COPY" : "CUSTOMER COPY"}
                </p>

            </div>

            <div className="mt-8 flex justify-between">

                <div>

                    <p>

                        <b>Invoice :</b>

                        {" "}

                        {sale.invoiceNo}

                    </p>

                    <p>

                        <b>Date :</b>

                        {" "}

                        {new Date(

                            sale.saleDate

                        ).toLocaleDateString()}

                    </p>

                </div>

                <div className="text-right">

                    <p>

                        <b>Customer :</b>

                        {" "}

                        {sale.customer?.name}

                    </p>

                    <p>

                        <b>Phone :</b>

                        {" "}

                        {sale.customer?.phone}

                    </p>

                    <p>

                        <b>Address :</b>

                        {" "}

                        {sale.customer?.address || "-"}

                    </p>

                </div>

            </div>
            <table className="mt-10 w-full border-collapse border">

                <thead>

                    <tr className="bg-slate-100">

                        <th className="border p-3 text-left">
                            Product
                        </th>

                        <th className="border p-3">
                            Qty
                        </th>

                        {officeCopy && (
                            <th className="border p-3 text-right">
                                Buy
                            </th>
                        )}

                        <th className="border p-3 text-right">
                            Sell
                        </th>

                        {officeCopy && (
                            <th className="border p-3 text-right">
                                Profit
                            </th>
                        )}

                        <th className="border p-3 text-right">
                            Total
                        </th>

                    </tr>

                </thead>

                <tbody>

                    {

                        sale.items?.map((item: any) => (


                            <tr key={item.id}>

                                <td className="border p-3">
                                    {item.batch?.product?.name}
                                </td>

                                <td className="border p-3 text-center">
                                    {item.quantity}
                                </td>

                                {officeCopy && (
                                    <td className="border p-3 text-right">
                                        ৳ {item.buyPrice}
                                    </td>
                                )}

                                <td className="border p-3 text-right">
                                    ৳ {item.sellPrice}
                                </td>

                                {officeCopy && (
                                    <td className="border p-3 text-right text-green-600 font-semibold">
                                        ৳ {item.profit}
                                    </td>
                                )}

                                <td className="border p-3 text-right">
                                    ৳ {item.totalPrice}
                                </td>

                            </tr>
                        ))

                    }

                </tbody>

            </table>

            <div className="mt-10 flex justify-end">

                <div className="w-80">

                    <div className="flex justify-between border-b py-2">

                        <span>Grand Total</span>

                        <span>

                            ৳ {sale.totalAmount}

                        </span>

                    </div>

                    <div className="flex justify-between border-b py-2">

                        <span>Discount</span>

                        <span>

                            ৳ {sale.discount}

                        </span>

                    </div>

                    <div className="flex justify-between border-b py-2">

                        <span>Paid</span>

                        <span>

                            ৳ {sale.paidAmount}

                        </span>

                    </div>

                    <div className="flex justify-between py-3 text-xl font-bold">

                        <span>Due</span>

                        <span className="text-red-600">

                            ৳ {sale.dueAmount}

                        </span>

                    </div>

                </div>

            </div>

            <div className="mt-20 flex justify-between">

                <div className="text-center">

                    <div className="w-52 border-t"></div>

                    <p className="mt-2">

                        Customer Signature

                    </p>

                </div>

                <div className="text-center">

                    <div className="w-52 border-t"></div>

                    <p className="mt-2">

                        Authorized Signature

                    </p>

                </div>

            </div>

            <p className="mt-16 text-center text-sm text-slate-500">

                Thank you for your purchase.

            </p>
        </div>


    );



}