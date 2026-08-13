interface Props {
    sale: any;
    officeCopy?: boolean;
}

export default function InvoicePrint({
    sale,
    officeCopy = false,
}: Props) {
    const saleReturns = sale.saleReturns ?? [];

    const totalSaleReturn = saleReturns.reduce(
        (sum: number, item: any) =>
            sum + Number(item.totalAmount ?? 0),
        0
    );

    const totalCashReturned = saleReturns.reduce(
        (sum: number, item: any) =>
            sum + Number(item.cashReturned ?? 0),
        0
    );

    const totalDueAdjusted = saleReturns.reduce(
        (sum: number, item: any) =>
            sum + Number(item.adjustedDue ?? 0),
        0
    );

    const currentSaleTotal = Number(sale.totalAmount ?? 0);
    const currentPaid = Number(sale.paidAmount ?? 0);
    const currentDue = Number(sale.dueAmount ?? 0);

    const originalSaleTotal =
        currentSaleTotal + totalSaleReturn;

    const originalPaid =
        currentPaid + totalCashReturned;

    const originalDue =
        currentDue + totalDueAdjusted;

    return (
        <div
            id="customer-invoice"
            className="mx-auto w-full max-w-[210mm] bg-white p-10 text-black"
        >
            <div className="border-b pb-6">
                <h1 className="text-center text-4xl font-bold">
                    Agro Shop CRM
                </h1>

                <p className="mt-2 text-center text-slate-500">
                    {officeCopy ? "OFFICE COPY" : "CUSTOMER COPY"}
                </p>
            </div>

            <div className="mt-8 flex justify-between">
                <div>
                    <p>
                        <b>Invoice :</b> {sale.invoiceNo}
                    </p>

                    <p>
                        <b>Date :</b>{" "}
                        {new Date(sale.saleDate).toLocaleDateString("en-BD")}
                    </p>
                </div>

                <div className="text-right">
                    <p>
                        <b>Customer :</b> {sale.customer?.name}
                    </p>

                    <p>
                        <b>Phone :</b> {sale.customer?.phone}
                    </p>

                    <p>
                        <b>Address :</b> {sale.customer?.address || "-"}
                    </p>
                </div>
            </div>

            <table className="mt-10 w-full border-collapse border">
                <thead>
                    <tr className="bg-slate-100">
                        <th className="border p-3 text-left">Product</th>
                        <th className="border p-3">Qty</th>

                        {officeCopy && (
                            <th className="border p-3 text-right">Buy</th>
                        )}

                        <th className="border p-3 text-right">Sell</th>

                        {officeCopy && (
                            <th className="border p-3 text-right">Profit</th>
                        )}

                        <th className="border p-3 text-right">Total</th>
                    </tr>
                </thead>

                <tbody>
                    {sale.items?.map((item: any) => {
                        const returnedQty = saleReturns.reduce(
                            (sum: number, saleReturn: any) =>
                                sum +
                                (saleReturn.items ?? [])
                                    .filter(
                                        (returnItem: any) =>
                                            returnItem.saleItemId === item.id
                                    )
                                    .reduce(
                                        (itemSum: number, returnItem: any) =>
                                            itemSum + Number(returnItem.quantity ?? 0),
                                        0
                                    ),
                            0
                        );

                        return (
                            <tr key={item.id}>
                                <td className="border p-3">
                                    {item.batch?.product?.name}
                                </td>

                                <td className="border p-3 text-center">
                                    <div>{item.quantity}</div>

                                    {returnedQty > 0 && (
                                        <div className="mt-1 text-xs font-semibold text-orange-700">
                                            Returned: {returnedQty}
                                        </div>
                                    )}
                                </td>

                                {officeCopy && (
                                    <td className="border p-3 text-right">
                                        ৳ {Number(item.buyPrice ?? 0).toFixed(2)}
                                    </td>
                                )}

                                <td className="border p-3 text-right">
                                    ৳ {Number(item.sellPrice ?? 0).toFixed(2)}
                                </td>

                                {officeCopy && (
                                    <td className="border p-3 text-right font-semibold text-green-600">
                                        ৳ {Number(item.profit ?? 0).toFixed(2)}
                                    </td>
                                )}

                                <td className="border p-3 text-right">
                                    ৳ {Number(item.totalPrice ?? 0).toFixed(2)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="mt-10 flex justify-end">
                <div className="w-96">
                    <div className="flex justify-between border-b py-2">
                        <span>Original Sale Total</span>
                        <span>৳ {originalSaleTotal.toFixed(2)}</span>
                    </div>

                    {totalSaleReturn > 0 && (
                        <div className="flex justify-between border-b py-2 text-orange-700">
                            <span>Total Sale Return</span>
                            <span>- ৳ {totalSaleReturn.toFixed(2)}</span>
                        </div>
                    )}

                    <div className="flex justify-between border-b py-2 font-semibold">
                        <span>Current / Net Sale</span>
                        <span>৳ {currentSaleTotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between border-b py-2">
                        <span>Discount</span>
                        <span>৳ {Number(sale.discount ?? 0).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between border-b py-2">
                        <span>Original Paid</span>
                        <span className="text-green-700">
                            ৳ {originalPaid.toFixed(2)}
                        </span>
                    </div>

                    {totalCashReturned > 0 && (
                        <div className="flex justify-between border-b py-2 text-orange-700">
                            <span>Cash Returned</span>
                            <span>- ৳ {totalCashReturned.toFixed(2)}</span>
                        </div>
                    )}

                    {totalDueAdjusted > 0 && (
                        <div className="flex justify-between border-b py-2 text-blue-700">
                            <span>Due Adjusted</span>
                            <span>- ৳ {totalDueAdjusted.toFixed(2)}</span>
                        </div>
                    )}

                    <div className="flex justify-between border-b py-2 font-semibold">
                        <span>Current Paid</span>
                        <span className="text-green-700">
                            ৳ {currentPaid.toFixed(2)}
                        </span>
                    </div>

                    <div className="flex justify-between py-3 text-xl font-bold">
                        <span>Current Due</span>
                        <span className="text-red-600">
                            ৳ {currentDue.toFixed(2)}
                        </span>
                    </div>

                    {saleReturns.length > 0 && (
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Original Due</span>
                            <span>৳ {originalDue.toFixed(2)}</span>
                        </div>
                    )}
                </div>
            </div>

            {saleReturns.length > 0 && (
                <div className="mt-10">
                    <h3 className="mb-3 text-lg font-bold">
                        Sale Return History
                    </h3>

                    <table className="w-full border-collapse border text-sm">
                        <thead>
                            <tr className="bg-orange-50">
                                <th className="border p-2 text-left">Date</th>
                                <th className="border p-2 text-right">Return Amount</th>
                                <th className="border p-2 text-right">Cash Returned</th>
                                <th className="border p-2 text-right">Due Adjusted</th>
                                <th className="border p-2 text-left">Reason</th>
                            </tr>
                        </thead>

                        <tbody>
                            {saleReturns.map((saleReturn: any) => (
                                <tr key={saleReturn.id}>
                                    <td className="border p-2">
                                        {new Date(
                                            saleReturn.returnDate
                                        ).toLocaleDateString("en-BD")}
                                    </td>

                                    <td className="border p-2 text-right">
                                        ৳ {Number(saleReturn.totalAmount ?? 0).toFixed(2)}
                                    </td>

                                    <td className="border p-2 text-right">
                                        ৳ {Number(saleReturn.cashReturned ?? 0).toFixed(2)}
                                    </td>

                                    <td className="border p-2 text-right">
                                        ৳ {Number(saleReturn.adjustedDue ?? 0).toFixed(2)}
                                    </td>

                                    <td className="border p-2">
                                        {saleReturn.reason || "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-20 flex justify-between">
                <div className="text-center">
                    <div className="w-52 border-t"></div>
                    <p className="mt-2">Customer Signature</p>
                </div>

                <div className="text-center">
                    <div className="w-52 border-t"></div>
                    <p className="mt-2">Authorized Signature</p>
                </div>
            </div>

            <p className="mt-16 text-center text-sm text-slate-500">
                Thank you for your purchase.
            </p>
        </div>
    );
}
