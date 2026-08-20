import { useState, useRef, useEffect } from 'react';
import { PlusCircle, MinusCircle, DollarSign, Loader2, Eye } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { apiBase } from '../../utils/request';

const Documentos = () => {
    const token = useAuthStore((state) => state.token);
    const [uploading, setUploading] = useState<string | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' });

    // Refs
    const ingresoRef = useRef<HTMLInputElement>(null);
    const ventaRef = useRef<HTMLInputElement>(null);
    const preciosRef = useRef<HTMLInputElement>(null);

    // Preview / Details State
    const [previewDoc, setPreviewDoc] = useState<any>(null); // { documento, preview }
    const [previewOpen, setPreviewOpen] = useState(false);

    // History State
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${apiBase}/admin/documents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (e) {
            console.error("Error fetching history", e);
        }
    };

    const handleFile = async (file: File, tipo: 'INGRESO' | 'VENTA' | 'PRECIOS') => {
        if (!file) return;

        setUploading(tipo);
        setStatus({ type: null, msg: `Procesando ${tipo}...` });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('tipo', tipo);

        try {
            const res = await fetch(`${apiBase}/admin/documents/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || "Error subiendo documento");
            }

            const data = await res.json();
            setPreviewDoc(data);
            setPreviewOpen(true);
            setStatus({ type: 'success', msg: `Documento procesado. Revisa la vista previa.` });

        } catch (error: any) {
            console.error(error);
            setStatus({ type: 'error', msg: error.message || "Error al subir" });
        } finally {
            setUploading(null);
            if (ingresoRef.current) ingresoRef.current.value = "";
            if (ventaRef.current) ventaRef.current.value = "";
            if (preciosRef.current) preciosRef.current.value = "";
        }
    };

    const confirmApply = async () => {
        if (!previewDoc) return;
        setStatus({ type: null, msg: "Aplicando cambios..." });

        try {
            const res = await fetch(`${apiBase}/admin/documents/${previewDoc.documento.id}/apply`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(previewDoc.preview)
            });

            if (res.ok) {
                setPreviewOpen(false);
                setPreviewDoc(null);
                setStatus({ type: 'success', msg: 'Cambios aplicados correctamente.' });
                fetchHistory(); // Refresh history
            } else {
                if (res.status === 413) {
                    setStatus({ type: 'error', msg: 'Error: Archivo muy grande (413). Reconstruye backend con "docker-compose up --build".' });
                } else {
                    const errorText = await res.text();
                    setStatus({ type: 'error', msg: `Error aplicando: ${errorText}` });
                }
            }
        } catch (e) {
            setStatus({ type: 'error', msg: 'Error de conexión al aplicar cambios.' });
        } finally {
            // Remove Loading msg if not success or explicit error set above? 
            // Actually status state handles it. But we must clear "Aplicando cambios..." if we didn't set success/error?
            // The logic above sets success or error in all paths except maybe the catch?
            // "Aplicando cambios..." is overwritten.
        }
    };

    const cancelDoc = async () => {
        if (!previewDoc) return;
        if (previewDoc?.documento?.estado === 'BORRADOR') {
            try {
                await fetch(`${apiBase}/admin/documents/${previewDoc.documento.id}/cancel`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setStatus({ type: null, msg: "Documento cancelado" });
                fetchHistory();
            } catch (e) { }
        }
        setPreviewOpen(false);
        setPreviewDoc(null);
    };

    const viewDetails = (doc: any) => {
        if (!doc.detallesJson) {
            alert("Este documento antiguo no tiene detalles guardados.");
            return;
        }
        try {
            const parsedDetails = JSON.parse(doc.detallesJson);
            setPreviewDoc({
                documento: doc,
                preview: parsedDetails
            });
            setPreviewOpen(true);
        } catch (e) {
            alert("Error al leer los detalles del documento.");
        }
    };

    const Zone = ({ title, icon, color, type, inputRef }: any) => {
        const isUploading = uploading === type;

        return (
            <div
                className={`flex-1 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${isUploading ? 'opacity-50 pointer-events-none' : ''
                    }`}
                style={{ borderColor: color, backgroundColor: `${color}10` }}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isUploading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleFile(e.dataTransfer.files[0], type);
                    }
                }}
            >
                <div className="p-4 rounded-full mb-4" style={{ backgroundColor: `${color}20`, color: color }}>
                    {isUploading ? <Loader2 className="animate-spin" size={32} /> : icon}
                </div>
                <h3 className="font-bold text-slate-200">{title}</h3>
                <p className="text-xs text-slate-500 mt-2">Arrastra o Click</p>
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => e.target.files && handleFile(e.target.files[0], type)}
                />
            </div>
        );
    };

    return (
        <div className="space-y-8 relative">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Control Documental</h1>
                    <p className="text-slate-500 text-sm">Sube documentos para alterar el inventario.</p>
                </div>
                {status.type && (
                    <div className={`px-4 py-2 rounded-lg text-sm font-medium ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {status.msg}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Zone
                    title="INGRESO DE STOCK"
                    icon={<PlusCircle size={32} />}
                    color="#10b981" // emerald-500
                    type="INGRESO"
                    inputRef={ingresoRef}
                />

                <Zone
                    title="EGRESO / VENTA"
                    icon={<MinusCircle size={32} />}
                    color="#f43f5e" // rose-500
                    type="VENTA"
                    inputRef={ventaRef}
                />

                <Zone
                    title="ACTUALIZAR PRECIOS"
                    icon={<DollarSign size={32} />}
                    color="#3b82f6" // blue-500
                    type="PRECIOS"
                    inputRef={preciosRef}
                />
            </div>

            <div className="mt-8">
                <h3 className="text-slate-400 text-sm mb-4 font-medium uppercase tracking-wider">Historial Reciente</h3>
                {history.length === 0 ? (
                    <div className="p-8 text-center border border-slate-800 rounded-xl text-slate-600 bg-slate-900/30">
                        No hay documentos recientes.
                    </div>
                ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-800/50 text-slate-400">
                                <tr>
                                    <th className="p-4">Fecha</th>
                                    <th className="p-4">Archivo</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Usuario</th>
                                    <th className="p-4 text-center">Estado</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {history.map((doc: any) => (
                                    <tr key={doc.id} className="hover:bg-slate-800/30">
                                        <td className="p-4">{new Date(doc.fecha).toLocaleString()}</td>
                                        <td className="p-4 font-medium">{doc.archivoOriginal}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${doc.tipo === 'INGRESO' ? 'bg-emerald-500/10 text-emerald-400' :
                                                doc.tipo === 'VENTA' ? 'bg-rose-500/10 text-rose-400' :
                                                    'bg-blue-500/10 text-blue-400'
                                                }`}>
                                                {doc.tipo}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500">{doc.usuario}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${doc?.estado === 'APLICADO' ? 'bg-emerald-500/20 text-emerald-400' :
                                                doc?.estado === 'CANCELADO' ? 'bg-red-500/20 text-red-500' :
                                                    'bg-yellow-500/20 text-yellow-500'
                                                }`}>
                                                {doc?.estado}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {doc.detallesJson && (
                                                <button
                                                    onClick={() => viewDetails(doc)}
                                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors"
                                                    title="Ver Detalle"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {previewOpen && previewDoc && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {previewDoc?.documento?.estado === 'BORRADOR' ? 'Vista Previa: ' : 'Detalle: '}
                                    {previewDoc?.documento?.archivoOriginal}
                                </h2>
                                <p className="text-sm text-slate-400">Se listan {previewDoc.preview?.length || 0} filas procesadas.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={cancelDoc}
                                    className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                                >
                                    {previewDoc?.documento?.estado === 'BORRADOR' ? 'Cancelar / Cerrar' : 'Cerrar'}
                                </button>
                                {previewDoc?.documento?.estado === 'BORRADOR' && (
                                    <button
                                        onClick={confirmApply}
                                        disabled={status.msg === "Aplicando cambios..."}
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded shadow transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {status.msg === "Aplicando cambios..." && <Loader2 className="animate-spin" size={16} />}
                                        Confirmar y Aplicar
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-auto p-6 flex-1">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-800 text-slate-400 font-medium">
                                    <tr>
                                        <th className="p-3 rounded-l">Código</th>
                                        <th className="p-3">Marca</th>
                                        <th className="p-3">Descripción</th>
                                        <th className="p-3 text-right">Stock Actual</th>
                                        <th className="p-3 text-right">Nuevo Stock</th>
                                        <th className="p-3 text-right">Precio Actual</th>
                                        <th className="p-3 text-right rounded-r">Nuevo Precio</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {previewDoc.preview?.slice(0, 100).map((row: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-800/30">
                                            <td className="p-3 font-mono text-slate-400">{row.code}</td>
                                            <td className="p-3 text-slate-400">{row.marca || '-'}</td>
                                            <td className="p-3">{row.description}</td>
                                            <td className="p-3 text-right text-slate-500">{row.stockActual}</td>
                                            <td className={`p-3 text-right font-bold ${row.diferenciaStock > 0 ? 'text-emerald-400' : row.diferenciaStock < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                                                {row.stockNuevo}
                                            </td>
                                            <td className="p-3 text-right text-slate-500">$ {row.precioActual}</td>
                                            <td className={`p-3 text-right font-bold ${row.precioNuevo !== row.precioActual ? 'text-blue-400' : 'text-slate-300'}`}>
                                                $ {row.precioNuevo}
                                            </td>
                                        </tr>
                                    ))}
                                    {previewDoc.preview?.length > 100 && (
                                        <tr>
                                            <td colSpan={6} className="p-4 text-center text-slate-500 italic">
                                                ... y {previewDoc.preview.length - 100} más ...
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Documentos;

