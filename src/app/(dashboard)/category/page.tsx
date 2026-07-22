"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import CategorySkeleton from "@/components/category/CategorySkeleton";

import CategoryHeader from "@/components/category/CategoryHeader";
import CategoryModal from "@/components/category/CategoryModal";
import CategoryForm from "@/components/category/CategoryForm";

import { useEffect } from "react";
import CategoryTable from "@/components/category/CategoryTable";
import CategorySearch from "@/components/category/CategorySearch";

export default function CategoryPage() {

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [categories, setCategories] = useState<

        {
            id: number;
            name: string;
            description: string | null;
        }[]
    >([]);
    const [search, setSearch] = useState("");
    const [editingCategory, setEditingCategory] = useState<{
        id: number;
        name: string;
        description: string | null;
    } | null>(null);

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

            toast.success("Category created successfully");

            setOpen(false);

        } catch (error: any) {

            toast.error(
                error?.response?.data?.message ??
                "Failed to create category"
            );

        } finally {

            setLoading(false);

        }

    }








    async function loadCategories() {
        setLoading(true);
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
        finally {

            setLoading(false);

        }

    }






    async function updateCategory(
        data: {
            name: string;
            description: string;
        }
    ) {

        if (!editingCategory) return;

        try {

            setLoading(true);

            await axios.put(

                `/api/category/${editingCategory.id}`,

                data,

                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`,
                    },
                }

            );

            await loadCategories();

            setEditingCategory(null);

            setOpen(false);


            toast.success("Category updated successfully");

        } catch (error: any) {

            toast.error(
                error?.response?.data?.message ??
                "Failed to update category"
            );

        } finally {

            setLoading(false);

        }

    }



    async function deleteCategory(category: {
        id: number;
        name: string;
    }) {

        const ok = confirm(
            `Delete "${category.name}" ?`
        );

        if (!ok) return;

        try {

            await axios.delete(

                `/api/category/${category.id}`,

                {
                    headers: {
                        Authorization:
                            `Bearer ${localStorage.getItem("token")}`,
                    },
                }

            );

            await loadCategories();

            toast.success("Category deleted successfully");

        } catch (error: any) {

            toast.error(
                error?.response?.data?.message ??
                "Failed to delete category"
            );

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
                title={
                    editingCategory
                        ? "Edit Category"
                        : "Add Category"
                }
                onClose={() => setOpen(false)}
            >

                <CategoryForm

                    initialData={

                        editingCategory

                            ? {

                                name: editingCategory.name,

                                description:
                                    editingCategory.description ?? "",

                            }

                            : undefined

                    }

                    loading={loading}

                    onSubmit={

                        editingCategory

                            ? updateCategory

                            : createCategory

                    }

                />

            </CategoryModal>
            <div className="mt-8">


                <CategorySearch
                    value={search}
                    onChange={setSearch}
                />



                {
                    loading ? (

                        <CategorySkeleton />

                    ) : (

                        <CategoryTable

                            categories={filteredCategories}

                            onEdit={(category) => {

                                setEditingCategory(category);

                                setOpen(true);

                            }}

                            onDelete={deleteCategory}

                            onAddCategory={() => {

                                setEditingCategory(null);

                                setOpen(true);

                            }}

                        />

                    )
                }




            </div>
        </div>

    );

}