"use client";

import { useState } from "react";
import axios from "axios";

import CategoryHeader from "@/components/category/CategoryHeader";
import CategoryModal from "@/components/category/CategoryModal";
import CategoryForm from "@/components/category/CategoryForm";

import { useEffect } from "react";
import CategoryTable from "@/components/category/CategoryTable";
import CategorySearch from "@/components/category/CategorySearch";

export default function CategoryPage() {

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [categories, setCategories] = useState<

        {
            id: number;
            name: string;
            description: string | null;
        }[]
    >([]);
    const [search, setSearch] = useState("");

    async function createCategory(data: {
        name: string;
        description: string;
    }) {

        try {

            setLoading(true);

            await axios.post(
                "/api/category",
                data,
                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            await loadCategories();

            setOpen(false);

        } catch (error: any) {

            alert(
                error?.response?.data?.message ??
                "Failed to create category"
            );

        } finally {

            setLoading(false);

        }

    }
    async function loadCategories() {

        try {

            const response = await axios.get(
                "/api/category",
                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            setCategories(response.data);

        } catch (error) {

            console.error(error);

        }

    }
    useEffect(() => {

        loadCategories();

    }, []);
    const filteredCategories = categories.filter((category) => {

        const keyword = search.toLowerCase();

        return (

            category.name.toLowerCase().includes(keyword) ||

            (category.description ?? "")
                .toLowerCase()
                .includes(keyword)

        );

    });

    return (

        <div>

            <CategoryHeader
                onAdd={() => setOpen(true)}
            />

            <CategoryModal
                open={open}
                title="Add Category"
                onClose={() => setOpen(false)}
            >

                <CategoryForm
                    loading={loading}
                    onSubmit={createCategory}
                />

            </CategoryModal>
            <div className="mt-8">


                <CategorySearch
                    value={search}
                    onChange={setSearch}
                />
                <CategoryTable
                    categories={filteredCategories}
                />

            </div>
        </div>

    );

}