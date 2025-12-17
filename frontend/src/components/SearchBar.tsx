import { Search } from "lucide-react";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onKeyPress?: (e: React.KeyboardEvent) => void;
    hasError?: boolean;
}

export default function SearchBar({ value, onChange, onKeyPress, hasError }: SearchBarProps) {
    return (
        <div className="relative">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${hasError ? 'text-red-400' : 'text-gray-400'}`} size={20} />
            <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Buscar por código o código de barras..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={onKeyPress}
                className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl transition-all duration-200 text-lg outline-none
                    ${hasError
                        ? 'border-red-500 ring-4 ring-red-100 placeholder-red-300 text-red-600 animate-shake'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                    }`}
            />

        </div>
    );
}
