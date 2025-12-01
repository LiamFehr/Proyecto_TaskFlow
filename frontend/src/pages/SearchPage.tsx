import { useState } from "react";
import { useProductSearch } from "../hooks/useProductSearch";
import SearchBar from "../components/SearchBar";
import ProductList from "../components/ProductList";
import { useCartStore } from "../store/cartStore";
import { Link } from "react-router-dom";
import { ShoppingCart, Search } from "lucide-react";

export default function SearchPage() {
    const [text, setText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);

    const { data: productsData, isLoading } = useProductSearch(searchQuery, page);

    const addItem = useCartStore((s) => s.addItem);
    const cartItems = useCartStore((s) => s.items);
    const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

    const handleSearch = () => {
        setSearchQuery(text);
        setPage(0); // Reset page on new search
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex justify-between items-center">
                        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <img src="/vhp-logo.jpg" alt="VHP Logo" className="h-20 w-auto object-contain" />
                        </Link>

                        <Link
                            to="/cart"
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg hover:shadow-lg transition-all duration-200 font-semibold"
                            title="Ver Carrito"
                        >
                            <ShoppingCart size={24} />
                            {cartCount > 0 && (
                                <span className="bg-white text-blue-600 px-2 py-1 rounded-full text-sm font-bold">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="w-full">
                    {/* Logo Space - Centered */}
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                            TaskFlow
                        </h1>
                        <p className="text-gray-500 font-medium">Sistema de Punto de Venta</p>
                    </div>

                    {/* Search Section - Centered */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1">
                                <SearchBar
                                    value={text}
                                    onChange={setText}
                                    onKeyPress={handleKeyPress}
                                />
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

                    {/* Products Section - Only show when searching */}
                    {searchQuery && (
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h2 key={searchQuery} className="text-xl font-bold text-gray-800 mb-4">
                                Resultados para "{searchQuery}"
                            </h2>

                            {isLoading && (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>
                            )}

                            {!isLoading && productsData && (
                                <ProductList
                                    products={productsData.content ?? []}
                                    onSelect={addItem}
                                />
                            )}

                            {!isLoading && productsData && productsData.content.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">No se encontraron productos</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
