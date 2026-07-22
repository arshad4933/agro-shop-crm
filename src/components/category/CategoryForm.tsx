"use client";

import { useState } from "react";

type CategoryFormProps = {

    initialData?: {

        name: string;

        description: string;

    };

    onSubmit: (data: {

        name: string;

        description: string;

    }) => Promise<void>;

    loading?: boolean;

};

export default function CategoryForm({

    initialData,

    onSubmit,

    loading = false,

}: CategoryFormProps) {

    const [name, setName] = useState(
        initialData?.name ?? ""
    );

    const [description, setDescription] = useState(
        initialData?.description ?? ""
    );

    async function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ) {

        e.preventDefault();

        await onSubmit({

            name,

            description,

        });

    }
    return (

        <form
            onSubmit={handleSubmit}
            className="space-y-5"
        >

            <div>

                <label className="mb-2 block text-sm font-medium">

                    Category Name

                </label>

                <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                        setName(e.target.value)
                    }
                    placeholder="Enter category name"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600"
                    required
                />

            </div>

            <div>

                <label className="mb-2 block text-sm font-medium">

                    Description

                </label>

                <textarea
                    rows={4}
                    value={description}
                    onChange={(e) =>
                        setDescription(e.target.value)
                    }
                    placeholder="Enter description"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600"
                />

            </div>

            <div className="flex justify-end">

                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-green-600 px-6 py-3 text-white transition hover:bg-green-700 disabled:opacity-50"
                >

                    {

                        loading
                            ? "Saving..."
                            : "Save Category"

                    }

                </button>

            </div>

        </form>

    );

}