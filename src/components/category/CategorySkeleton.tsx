export default function CategorySkeleton() {

    return (

        <div className="overflow-hidden rounded-xl bg-white shadow">

            <table className="min-w-full">

                <thead className="bg-slate-100">

                    <tr>

                        <th className="px-6 py-4 text-left">

                            Name

                        </th>

                        <th className="px-6 py-4 text-left">

                            Description

                        </th>

                        <th className="px-6 py-4 text-center">

                            Action

                        </th>

                    </tr>

                </thead>

                <tbody>

                    {

                        Array.from({ length: 6 }).map((_, index) => (

                            <tr
                                key={index}
                                className="border-t"
                            >

                                <td className="px-6 py-5">

                                    <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />

                                </td>

                                <td className="px-6 py-5">

                                    <div className="h-5 w-64 animate-pulse rounded bg-slate-200" />

                                </td>

                                <td className="px-6 py-5">

                                    <div className="mx-auto h-9 w-32 animate-pulse rounded bg-slate-200" />

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

        </div>

    );

}