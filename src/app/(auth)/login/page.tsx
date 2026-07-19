"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(
        e: React.FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            const response = await axios.post(
                "/api/auth/login",
                {
                    username,
                    password,
                }
            );

            localStorage.setItem(
                "token",
                response.data.token
            );

            router.push("/dashboard");
        } catch (err: any) {
            setError(
                err?.response?.data?.message ??
                "Login Failed"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">

                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold">
                        Agro Shop CRM
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Login to continue
                    </p>
                </div>

                {error && (
                    <div className="mb-4 rounded border border-red-300 bg-red-100 px-4 py-3 text-red-700">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleLogin}
                    className="space-y-5"
                >

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Username
                        </label>

                        <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                                setUsername(e.target.value)
                            }
                            placeholder="Enter username"
                            className="w-full rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-green-600"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Password
                        </label>

                        <div className="relative">

                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                placeholder="Enter password"
                                className="w-full rounded-lg border px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-green-600"
                                required
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(!showPassword)
                                }
                                className="absolute right-3 top-3 text-slate-600"
                            >
                                {showPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>

                        </div>

                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3 text-white transition hover:bg-green-700 disabled:opacity-50"
                    >
                        <LogIn size={20} />

                        {loading ? "Logging in..." : "Login"}

                    </button>

                </form>

            </div>

        </div>

    );

}