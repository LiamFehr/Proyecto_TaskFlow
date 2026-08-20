import { useState, useEffect } from 'react';
import { Search, Calendar, Download, ArrowUp, Filter } from 'lucide-react';
import { apiBase } from '../utils/request';
import { useAuthStore } from '../store/authStore';

const RegistrosPage = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // Date Filtering State
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const token = useAuthStore((state) => state.token);
    const [ventas, setVentas] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchVentas();
    }, []);

    const fetchVentas = async () => {
        try {
            const res = await fetch(`${apiBase}/pedidos/historial`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const mapped = data.map((p: any) => ({
                    ...p,
                    idString: p.id.toString(),
                    fechaFormateada: new Date(p.fechaCreacion).toLocaleString(),
                    rawDate: p.fechaCreacion, // For filtering
                    cajero: p.vendedorNombre || "N/A",
                    cliente: p.clienteNombre || "Consumidor Final",
                    itemsCount: p.items ? p.items.length : 0
                }));
                setVentas(mapped);
            }
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter Logic
    const filteredVentas = ventas.filter(venta => {
        // Search Term (ID, Cajero)
        const matchesSearch =
            searchTerm === '' ||
            venta.idString.includes(searchTerm) ||
            venta.cajero.toLowerCase().includes(searchTerm.toLowerCase());

        // Date Range
        let matchesDate = true;
        if (startDate && endDate) {
            const vDate = new Date(venta.rawDate).toISOString().split('T')[0];
            matchesDate = vDate >= startDate && vDate <= endDate;
        }

        return matchesSearch && matchesDate;
    });

    const [selectedVenta, setSelectedVenta] = useState<any>(null);

    const handlePrintPdf = async (venta: any) => {
        try {
            const token = localStorage.getItem("token");
            const dto = {
                clienteNombre: venta.clienteNombre || "Consumidor Final",
                clienteTelefono: "",
                observaciones: "Detalle de Venta #" + venta.id,
                dniCuit: "",
                condicionIva: "Consumidor Final",
                ciudad: "",
                provincia: "",
                items: venta.items.map((i: any) => ({
                    productId: i.productoId,
                    description: i.descripcion,
                    price: i.precioUnitario || i.precio,
                    quantity: i.cantidad
                }))
            };

            const response = await fetch(`${apiBase}/presupuestos/pdf`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dto),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Venta_${venta.id}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (err) {
            console.error("Error generating PDF", err);
            alert("Error al generar PDF");
        }
    };

    const totalVentas = filteredVentas.reduce((acc, curr) => acc + curr.total, 0);

    return (
        <div className="space-y-6 min-h-[85vh] text-slate-100">
            {isLoading ? (
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
            ) : (
                <>
                    {/* Header with Title and Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h1 className="text-2xl font-bold text-white tracking-tight">Historial de Transacciones</h1>
                        <div className="flex gap-3">
                            {/* Buttons removed as per request */}
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <ArrowUp size={40} className="text-emerald-500" />
                            </div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Ventas del Día</p>
                            <p className="text-3xl font-black text-white">${totalVentas.toLocaleString()}</p>
                            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-400">
                                <ArrowUp size={12} />
                                <span>+12% vs ayer</span>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Tickets Emitidos</p>
                            <p className="text-3xl font-black text-white">{filteredVentas.length}</p>
                        </div>

                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Ticket Promedio</p>
                            <p className="text-3xl font-black text-white">
                                ${filteredVentas.length > 0 ? Math.round(totalVentas / filteredVentas.length).toLocaleString() : 0}
                            </p>
                        </div>

                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Cierre Caja (Est.)</p>
                            <p className="text-3xl font-black text-indigo-400">${(totalVentas * 0.8).toLocaleString()}</p> {/* Simulated Cash */}
                            <div className="mt-2 text-xs text-slate-500">Solo Efectivo</div>
                        </div>
                    </div>

                    {/* Filter & Search Toolbar */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/30 p-2 rounded-xl border border-slate-800/50">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por ID, Cliente o Cajero..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <button
                                onClick={() => setShowDateFilter(!showDateFilter)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors border font-medium text-sm whitespace-nowrap ${showDateFilter ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'}`}
                            >
                                <Calendar size={16} />
                                <span>{showDateFilter ? 'Ocultar Fechas' : 'Hoy'}</span>
                            </button>

                            <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-600 hover:text-slate-200 rounded-lg transition-colors font-medium text-sm whitespace-nowrap">
                                <Filter size={16} />
                                <span>Filtros</span>
                            </button>

                            <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white rounded-lg transition-colors font-bold text-sm shadow-lg shadow-indigo-500/20 whitespace-nowrap">
                                <Download size={16} />
                                <span>Exportar</span>
                            </button>
                        </div>
                    </div>

                    {/* Date Filter Panel */}
                    {showDateFilter && (
                        <div className="pt-4 border-t border-slate-800 animate-in slide-in-from-top-2">
                            <div className="flex flex-wrap items-end gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Desde</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        max={endDate || undefined} // Prevent > End
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Hasta</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        min={startDate || undefined} // Prevent < Start
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={() => { setStartDate(''); setEndDate(''); }}
                                    className="px-3 py-2 text-sm text-slate-400 hover:text-white underline decoration-slate-600 hover:decoration-white underline-offset-4"
                                >
                                    Limpiar Fechas
                                </button>
                                {startDate && endDate && startDate > endDate && (
                                    <p className="text-red-400 text-xs mt-2 font-bold">⚠️ La fecha 'Desde' no puede ser mayor que 'Hasta'.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                                    <th className="p-4 font-bold">ID</th>
                                    <th className="p-4 font-bold">Fecha / Hora</th>
                                    {/* <th className="p-4 font-bold">Cliente</th> Removed as per redesign request */}
                                    <th className="p-4 font-bold">Cajero</th>
                                    <th className="p-4 font-bold">Método</th>
                                    <th className="p-4 font-bold">Items</th>
                                    <th className="p-4 font-bold text-right">Total</th>
                                    <th className="p-4 font-bold text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredVentas.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                                            No se encontraron registros con los filtros actuales.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVentas.map((venta) => (
                                        <tr 
                                            key={venta.id} 
                                            onDoubleClick={() => setSelectedVenta(venta)}
                                            className="hover:bg-slate-800/30 transition-colors text-sm cursor-pointer"
                                        >
                                            <td className="p-4 font-mono text-indigo-400 font-bold">#{venta.id}</td>
                                            <td className="p-4 text-slate-300">{venta.fechaFormateada}</td>
                                            {/* <td className="p-4 text-slate-300">{venta.cliente}</td> */}
                                            <td className="p-4 text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold border border-slate-700">
                                                        {venta.cajero[0]}
                                                    </div>
                                                    {venta.cajero}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold border ${/** @type {string} */(venta.metodoPago) === 'EFECTIVO' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                    {venta.metodoPago}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-400 text-center">{venta.itemsCount}</td>
                                            <td className="p-4 text-right font-mono font-bold text-slate-200">
                                                ${venta.total.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-bold">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    Completo
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Sale Detail Modal */}
                    {selectedVenta && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Detalle de Venta #{selectedVenta.id}</h2>
                                        <p className="text-slate-400 text-sm mt-1">{selectedVenta.fechaFormateada} - {selectedVenta.cajero}</p>
                                    </div>
                                    <button onClick={() => setSelectedVenta(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                            <p className="text-slate-500 text-xs font-bold uppercase mb-1">Cliente</p>
                                            <p className="text-white font-medium">{selectedVenta.clienteNombre || "Consumidor Final"}</p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                            <p className="text-slate-500 text-xs font-bold uppercase mb-1">Método de Pago</p>
                                            <p className="text-white font-medium">{selectedVenta.metodoPago}</p>
                                        </div>
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                            <p className="text-slate-500 text-xs font-bold uppercase mb-1">Total</p>
                                            <p className="text-2xl font-black text-indigo-400">${selectedVenta.total.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-900 text-slate-500 text-xs uppercase font-bold border-b border-slate-800">
                                                <tr>
                                                    <th className="p-4">Cód</th>
                                                    <th className="p-4">Descripción</th>
                                                    <th className="p-4 text-center">Cant</th>
                                                    <th className="p-4 text-right">Unitario</th>
                                                    <th className="p-4 text-right">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/50">
                                                {selectedVenta.items && selectedVenta.items.map((item: any, idx: number) => (
                                                    <tr key={idx} className="text-sm">
                                                        <td className="p-4 font-mono text-slate-500">{item.codigo}</td>
                                                        <td className="p-4 text-slate-200">{item.descripcion}</td>
                                                        <td className="p-4 text-center text-slate-300">{item.cantidad}</td>
                                                        <td className="p-4 text-right text-slate-300">${(item.precioUnitario || item.precio).toLocaleString()}</td>
                                                        <td className="p-4 text-right font-bold text-white">${((item.precioUnitario || item.precio) * item.cantidad).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex gap-4">
                                    <button 
                                        onClick={() => handlePrintPdf(selectedVenta)}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                        Descargar Detalle (PDF)
                                    </button>
                                    <button 
                                        onClick={() => setSelectedVenta(null)}
                                        className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RegistrosPage;
