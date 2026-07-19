import { ReactNode } from "react";

type DashboardCardProps = {
    title: string;
    value: string | number;
    icon: ReactNode;
    color: string;
};

export default function DashboardCard({
    title,
    value,
    icon,
    color,
}: DashboardCardProps) {
    return (
        <div className="rounded-xl bg-white p-6 shadow-md hover:shadow-lg transition">

            <div className="flex items-center justify-between">

                <div>

                    <p className="text-sm text-slate-500">
                        {title}
                    </p>

                    <h2 className="mt-2 text-3xl font-bold">
                        {value}
                    </h2>

                </div>

                <div
                    className={`h-14 w-14 rounded-xl flex items-center justify-center text-white ${color}`}
                >
                    {icon}
                </div>

            </div>

        </div>
    );
}