type CategorySearchProps = {

    value: string;

    onChange: (value: string) => void;

};

export default function CategorySearch({

    value,

    onChange,

}: CategorySearchProps) {
    return (

        <div className="mb-6">

            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search category..."
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-600"
            />

        </div>

    );

}