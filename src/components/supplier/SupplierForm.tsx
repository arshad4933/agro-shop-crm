"use client";

type SupplierFormProps = {
    loading: boolean;
    onSubmit: (data: any) => void;
    onCancel: () => void;
};

export default function SupplierForm({
    loading,
    onSubmit,
    onCancel,
}: SupplierFormProps) {

    function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ) {

        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        onSubmit({

            name: formData.get("name"),

            company: formData.get("company"),

            phone: formData.get("phone"),

            email: formData.get("email"),

            address: formData.get("address"),

            openingDue: Number(formData.get("openingDue") || 0),

            isActive: formData.get("isActive") === "on",

        });

    }

    return (

        <form
            onSubmit={handleSubmit}
            className="space-y-8"
        >

            {/* BASIC INFO */}

            <div className="rounded-xl border bg-slate-50 p-6">

                <h2 className="mb-6 text-xl font-bold text-slate-800">

                    🚚 Supplier Information

                </h2>

                <div className="grid gap-5 md:grid-cols-2">

                    <div>

                        <label className="mb-2 block text-sm font-semibold">

                            Supplier Name *

                        </label>

                        <input
                            name="name"
                            required
                            placeholder="Rahim Traders"
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600"
                        />

                    </div>

                    <div>

                        <label className="mb-2 block text-sm font-semibold">

                            Company

                        </label>

                        <input
                            name="company"
                            placeholder="ACI Limited"
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600"
                        />

                    </div>

                    <div>

                        <label className="mb-2 block text-sm font-semibold">

                            Phone *

                        </label>

                        <input
                            name="phone"
                            required
                            placeholder="01XXXXXXXXX"
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600"
                        />

                    </div>

                    <div>

                        <label className="mb-2 block text-sm font-semibold">

                            Email

                        </label>

                        <input
                            type="email"
                            name="email"
                            placeholder="supplier@email.com"
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600"
                        />

                    </div>

                </div>

            </div>

            {/* ADDRESS & DUE */}

            <div className="rounded-xl border bg-slate-50 p-6">

                <h2 className="mb-6 text-xl font-bold text-slate-800">

                    📍 Additional Information

                </h2>

                <div className="grid gap-5 md:grid-cols-2">

                    <div>

                        <label className="mb-2 block text-sm font-semibold">

                            Address

                        </label>

                        <textarea
                            name="address"
                            rows={4}
                            placeholder="Supplier address..."
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-green-600"
                        />

                    </div>

                    <div className="space-y-5">

                        <div>

                            <label className="mb-2 block text-sm font-semibold">

                                Opening Due

                            </label>

                            <input
                                type="number"
                                name="openingDue"
                                defaultValue={0}
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-green-600"
                            />

                        </div>

                        <div>

                            <label className="mb-2 block text-sm font-semibold">

                                Status

                            </label>

                            <label className="flex items-center gap-3">

                                <input
                                    type="checkbox"
                                    name="isActive"
                                    defaultChecked
                                />

                                Active Supplier

                            </label>

                        </div>

                    </div>

                </div>

            </div>

            {/* ACTION BUTTONS */}

            <div className="flex justify-end gap-4">

                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg bg-slate-200 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-300"
                >

                    Cancel

                </button>

                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-green-600 px-8 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                >

                    {loading ? "Saving..." : "💾 Save Supplier"}

                </button>

            </div>

        </form>

    );

}