"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

type PurchaseChartProps = {
    data: {
        month: string;
        purchase: number;
    }[];
};

export default function PurchaseChart({
    data,
}: PurchaseChartProps) {

    return (

        <div className="rounded-xl bg-white p-6 shadow">

            <h2 className="mb-6 text-xl font-semibold">

                Purchase Overview

            </h2>

            <ResponsiveContainer
                width="100%"
                height={350}
            >

                <BarChart data={data}>

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="month" />

                    <YAxis />

                    <Tooltip />

                    <Bar
                        dataKey="purchase"
                        radius={[6, 6, 0, 0]}
                        fill="#2563eb"
                    />

                </BarChart>

            </ResponsiveContainer>

        </div>

    );

}