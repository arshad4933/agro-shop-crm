type CategoryModalProps = {
    open: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
};

export default function CategoryModal({

    open,

    title,

    children,

    onClose,

}: CategoryModalProps) {

    if (!open) return null;

    return (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">

                <div className="flex items-center justify-between border-b px-6 py-4">

                    <h2 className="text-xl font-semibold">

                        {title}

                    </h2>

                    <button
                        onClick={onClose}
                        className="text-2xl text-slate-500 hover:text-red-600"
                    >

                        ×

                    </button>

                </div>

                <div className="p-6">

                    {children}

                </div>

            </div>

        </div>

    );

}