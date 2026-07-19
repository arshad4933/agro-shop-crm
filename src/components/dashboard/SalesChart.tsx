"use client";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

type SalesChartProps = {
    data: {
        month: string;
        sales: number;
    }[];
};

export default function SalesChart({
    data,
}: SalesChartProps) {

    return (

        <div className="rounded-xl bg-white p-6 shadow">

            <h2 className="mb-6 text-xl font-semibold">

                Sales Overview

            </h2>

            <ResponsiveContainer
                width="100%"
                height={350}
            >

                <LineChart
                    data={data}
                >

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="month" />

                    <YAxis />

                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#16a34a"
                        strokeWidth={3}
                        dot={{
                            r: 5,
                        }}
                        activeDot={{
                            r: 8,
                        }}
                    />

                </LineChart>

            </ResponsiveContainer>

        </div>

    );

}