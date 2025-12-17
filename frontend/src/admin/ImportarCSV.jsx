import { useState, useEffect, useRef } from "react";
import { adminApi } from "../api/adminApi";
import { useAuthStore } from "../store/authStore";
import { Upload, X, Save, Edit2, Check, AlertCircle, FileText, Search, RefreshCw, Trash2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ImportarCSV() {
    const token = useAuthStore().token;
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dragActive, setDragActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Inline Edit State
    const [editId, setEditId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const [searchTerm, setSearchTerm] = useState("");

    // Import Preview State (New)
    const [previewData, setPreviewData] = useState([]);
    const [previewFile, setPreviewFile] = useState(null);

    // Log for import results
    const [importLog, setImportLog] = useState(null);

    const fileInputRef = useRef(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getProductos(token);
            if (Array.isArray(res)) {
                // Deduplicate by ID to prevent key collisions
                const unique = [];
                const ids = new Set();
                res.forEach(item => {
                    if (item && item.id && !ids.has(item.id)) {
                        ids.add(item.id);
                        unique.push(item);
                    }
                });
                setProducts(unique);
            }
            else setProducts([]);
        } catch (error) {
            console.error("Error cargando productos", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    // --- Drag & Drop ---
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
    };

    const processFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const parsed = parse8ColumnCSV(text);
            if (parsed.length > 0) {
                setPreviewData(parsed);
                setPreviewFile(file);
                setImportLog(null); // Clear previous logs
            } else {
                alert("No se encontraron productos válidos o el formato es incorrecto.\nEsperado: id,legacy_id,code,barcode,description,price,hidden,searchable");
            }
        };
        reader.readAsText(file);
    };

    const parse8ColumnCSV = (text) => {
        // Format: id,legacy_id,code,barcode,description,price,hidden,searchable
        // User sample: 145,1128,1128,1128,"PORTA CAFE,AZUCAR...",960,false,true

        const lines = text.split(/\r?\n/);
        const data = [];
        lines.forEach((line, index) => {
            if (!line.trim()) return;

            // Removing BOM if present on first line
            let cleanLine = line;
            if (index === 0) {
                cleanLine = line.replace(/^\uFEFF/, '');
                if (cleanLine.toLowerCase().includes("legacy_id")) return;
            }

            // Regex split respecting quotes
            const parts = cleanLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

            // Fallback for semicolon
            if (parts.length < 3 && cleanLine.includes(";")) {
                return parse8ColumnCSV(text.replace(/;/g, ',')); // Retry/Simpler logic or just handle split
            }

            if (parts.length >= 6) {
                // Mapping based on user file: 0=id, 1=legacy, 2=code, 3=barcode, 4=desc, 5=price
                const code = parts[2]?.trim();
                let description = parts[4]?.trim();
                let priceStr = parts[5]?.trim();

                // Handle 3 column fallback (if user uploads a different simple format)
                // But considering the error was strict validation, we focus on the 8-col one.
                if (parts.length < 8 && parts.length === 3) {
                    // code, desc, price ?
                }

                // Cleanup Description (remove quotes)
                if (description?.startsWith('"') && description?.endsWith('"')) {
                    description = description.slice(1, -1);
                }
                if (description) description = description.replace(/""/g, '"');

                // Cleanup Price
                if (priceStr?.startsWith('"') && priceStr?.endsWith('"')) {
                    priceStr = priceStr.slice(1, -1);
                }
                if (priceStr) {
                    priceStr = priceStr.replace("$", "").replace(",", ".").trim();
                }

                const price = parseFloat(priceStr);

                if (code && !isNaN(price)) {
                    data.push({
                        code,
                        description: description || "",
                        price: price,
                        hidden: parts[6]?.trim() === 'true',
                        searchable: parts[7]?.trim() !== 'false'
                    });
                }
            }
        });
        return data;
    };

    const confirmImport = async () => {
        if (!previewData.length) return;
        setIsProcessing(true);
        try {
            const res = await adminApi.importarJSON(previewData, previewFile?.name || "import.csv", token);
            setImportLog(res);
            setPreviewData([]); // Clear preview
            setPreviewFile(null);
            loadProducts(); // Refresh main list
        } catch (error) {
            console.error(error);
            alert("Error al importar: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const cancelImport = () => {
        setPreviewData([]);
        setPreviewFile(null);
    };

    // --- Actions ---
    const handleEditClick = (product) => {
        setEditId(product.id);
        setEditForm({ ...product });
    };

    const handleSaveEdit = async () => {
        try {
            await adminApi.updateProducto(editId, editForm, token);
            setProducts(prev => prev.map(p => p.id === editId ? { ...p, ...editForm } : p));
            setEditId(null);
        } catch (error) {
            console.error(error);
            alert("Error al guardar cambios");
        }
    };

    const handleDeleteClick = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
        try {
            await adminApi.deleteProducto(id, token);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error(error);
            alert("Error al eliminar producto");
        }
    };

    const sortedProducts = products
        .filter(p =>
            p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.code?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => b.id - a.id);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Administrar Productos
                    </h1>
                    <p className="text-slate-400 text-sm">Gestiona el inventario o importa nuevos registros</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadProducts}
                        className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
                        title="Recargar"
                    >
                        <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-sm rounded-lg pl-9 pr-4 py-2 focus:ring-blue-500 focus:border-blue-500 w-64 text-slate-200"
                        />
                    </div>
                </div>
            </div>

            {/* Import Result Feedback */}
            {importLog && (
                <div className="bg-slate-900/80 border border-green-500/30 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <Check className="w-5 h-5 text-green-400 mt-1" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-green-400">Importación Exitosa</h3>
                        <p className="text-sm text-slate-300">
                            Nuevos: {importLog.productosInsertados} | Actualizados: {importLog.productosActualizados}
                        </p>
                        {importLog.errores && (
                            <pre className="mt-2 text-xs text-red-300 bg-red-900/20 p-2 rounded overflow-auto max-h-32">
                                {importLog.errores}
                            </pre>
                        )}
                        <button onClick={() => setImportLog(null)} className="text-xs text-slate-500 underline mt-1">Cerrar</button>
                    </div>
                </div>
            )}

            {/* Import Preview Modal / Section */}
            {previewData.length > 0 && (
                <div className="bg-slate-800/50 border border-blue-500/30 rounded-lg p-4 mb-4 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Previsualización de Importación</h3>
                                <p className="text-sm text-slate-400">
                                    Archivo: {previewFile?.name} ({previewData.length} registros)
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={cancelImport}
                                className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmImport}
                                disabled={isProcessing}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isProcessing ? "Procesando..." : "Guardar Importación"}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    {/* Tiny preview list */}
                    <div className="bg-slate-950 rounded border border-slate-700 p-2 max-h-40 overflow-auto text-xs font-mono text-slate-400">
                        {previewData.slice(0, 5).map((p, i) => (
                            <div key={i} className="truncate border-b border-slate-800 last:border-0 py-1">
                                {p.code} - {p.description} (${p.price})
                            </div>
                        ))}
                        {previewData.length > 5 && <div className="py-1 text-center italic">... y {previewData.length - 5} más</div>}
                    </div>
                </div>
            )}

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Left: Drag & Drop Import */}
                <div className="lg:col-span-1">
                    <div
                        className={cn(
                            "relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 bg-slate-900/30",
                            dragActive ? "border-blue-500 bg-blue-500/10" : "border-slate-700 hover:border-slate-600 hover:bg-slate-900/50"
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".csv,.txt"
                            onChange={handleChange}
                        />
                        <Upload className="w-8 h-8 text-slate-500 mb-2" />
                        <span className="text-xs text-slate-400 font-medium text-center px-4">
                            Arrastra CSV para importar
                        </span>
                    </div>

                    <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Estadísticas</h4>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Total Productos</span>
                            <span className="text-slate-200 font-mono">{products.length}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Product Table */}
                <div className="lg:col-span-3">
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden flex flex-col h-[600px]">
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-900 text-xs uppercase text-slate-400 font-medium sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 bg-slate-900">Código</th>
                                        <th className="px-4 py-3 bg-slate-900">Descripción</th>
                                        <th className="px-4 py-3 bg-slate-900">Precio</th>
                                        <th className="px-4 py-3 bg-slate-900">Visibilidad</th>
                                        <th className="px-4 py-3 bg-slate-900 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {sortedProducts.map((product) => {
                                        const isEditing = editId === product.id;
                                        if (isEditing) {
                                            return (
                                                <tr key={`${product.id}-edit`} className="bg-slate-800/80">
                                                    <td className="px-4 py-2">
                                                        <input
                                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                                                            value={editForm.code}
                                                            onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                                                            value={editForm.description}
                                                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200"
                                                            value={editForm.price}
                                                            onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex gap-2">
                                                            <label className="flex items-center gap-1 text-xs text-slate-400">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!editForm.hidden}
                                                                    onChange={e => setEditForm({ ...editForm, hidden: !e.target.checked })}
                                                                /> Visible
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <button onClick={handleSaveEdit} className="p-1 hover:bg-green-500/20 text-green-400 rounded"><Check className="w-4 h-4" /></button>
                                                            <button onClick={() => setEditId(null)} className="p-1 hover:bg-red-500/20 text-red-400 rounded"><X className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        } else {
                                            return (
                                                <tr key={`${product.id}-view`} className="group hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-4 py-3 font-mono font-bold text-white">{product.code}</td>
                                                    <td className="px-4 py-3 text-slate-300">{product.description}</td>
                                                    <td className="px-4 py-3 text-emerald-400 font-medium">${product.price}</td>
                                                    <td className="px-4 py-3">
                                                        {product.hidden ? (
                                                            <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded">Oculto</span>
                                                        ) : (
                                                            <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded">Visible</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleEditClick(product)}
                                                                className="text-slate-500 hover:text-blue-400 transition-colors p-1"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(product.id)}
                                                                className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    })}
                                    {sortedProducts.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-12 text-slate-500">
                                                No se encontraron productos
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
