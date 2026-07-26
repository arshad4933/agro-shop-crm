"use client";

import { useEffect, useState } from "react";

interface Props {
    loading: boolean;
    initialData?: any;
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

export default function CustomerForm({
    loading,
    initialData,
    onSubmit,
    onCancel,
}: Props) {

    const [form, setForm] = useState({
        name: "",
        phone: "",
        address: "",
        openingDue: 0,
    });

    useEffect(() => {

        if (initialData) {

            setForm({
                name: initialData.name ?? "",
                phone: initialData.phone ?? "",
                address: initialData.address ?? "",
                openingDue: Number(initialData.openingDue ?? 0),
            });

        }

    }, [initialData]);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) {

        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]:
                name === "openingDue"
                    ? Number(value)
                    : value,
        }));

    }

    function submit(e: React.FormEvent) {

        e.preventDefault();

        onSubmit(form);

    }

    return (

        <form
            onSubmit={submit}
            className="space-y-5"
        >

            <div>

                <label className="mb-2 block font-medium">
                    Customer Name
                </label>

                <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-4 py-3"
                    required
                />

            </div>

            <div>

                <label className="mb-2 block font-medium">
                    Phone
                </label>

                <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-4 py-3"
                    required
                />

            </div>

            <div>

                <label className="mb-2 block font-medium">
                    Address
                </label>

                <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-lg border px-4 py-3"
                />

            </div>

            <div>

                <label className="mb-2 block font-medium">
                    Opening Due
                </label>

                <input
                    type="number"
                    name="openingDue"
                    value={form.openingDue}
                    onChange={handleChange}
                    className="w-full rounded-lg border px-4 py-3"
                />

            </div>

            <div className="flex justify-end gap-3">

                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg bg-gray-500 px-5 py-3 text-white"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-green-600 px-5 py-3 text-white"
                >
                    {loading ? "Saving..." : "Save Customer"}
                </button>

            </div>

        </form>

    );

}