import { useState } from "react";
import { useProductByCode } from "../hooks/useProductByCode";
import SearchBar from "../components/SearchBar";
import ProductList from "../components/ProductList";
import { useCartStore } from "../store/cartStore";
import { Search } from "lucide-react";

export default function SearchPage() {
    const [text, setText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [validationError, setValidationError] = useState(false);
    const { data: product, isLoading, error } = useProductByCode(searchQuery);

    const addItem = useCartStore((s) => s.addItem);

    const handleSearch = () => {
        if (!text.trim()) {
            setValidationError(true);
            // Clear error after 3 seconds
            setTimeout(() => setValidationError(false), 3000);
            return;
        }
        setValidationError(false);
        setSearchQuery(text);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 flex flex-col items-center">
                <div className="w-full max-w-4xl mt-32 md:mt-40">

                    {/* Search Section */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 relative overflow-hidden">
                        <div className="flex flex-col md:flex-row gap-4 relative z-10">
                            <div className="flex-1">
                                <SearchBar
                                    value={text}
                                    onChange={(val) => { setText(val); if (validationError) setValidationError(false); }}
                                    onKeyPress={handleKeyPress}
                                    hasError={validationError}
                                />
                                {validationError && (
                                    <div className="absolute -bottom-6 left-0 text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-200 flex items-center gap-1">
                                        <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                        Por favor, ingresa un código válido
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleSearch}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-lg transition-all duration-200 font-semibold"
                            >
                                <Search size={20} />
                                Buscar
                            </button>
                        </div>
                    </div>

                    {/* Products Section */}
                    {searchQuery && (
                        <div className="bg-white rounded-2xl shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">
                                Resultados para "{product ? product.code : searchQuery}"
                            </h2>

                            {isLoading && (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>
                            )}

                            {!isLoading && product && (
                                <ProductList
                                    products={[product]}
                                    onSelect={addItem}
                                />
                            )}

                            {!isLoading && !product && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">
                                        {error ? "Producto no encontrado" : "No se encontraron productos"}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
