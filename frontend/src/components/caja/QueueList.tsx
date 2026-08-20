
import { Clock, User, CheckCircle, XCircle } from 'lucide-react';

interface QueueListProps {
    queue: any[];
    onSelectOrder: (order: any) => void;
}

export const QueueList = ({ queue, onSelectOrder }: QueueListProps) => {
    return (
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100">
                    <Clock className="text-indigo-400" />
                    Cola de Espera
                </h2>
                <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full text-xs font-mono">
                    {queue.length}
                </span>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                {queue.length === 0 ? (
                    <div className="text-slate-500 text-center py-10 italic">
                        No hay clientes en espera
                    </div>
                ) : (
                    queue.map((order) => (
                        <div
                            key={order.id}
                            onClick={() => {
                                // Only allow click if NO cajero is attending
                                if (!order.cajeroAtendiendo) {
                                    onSelectOrder(order);
                                }
                            }}
                            className={`p-4 rounded-lg border transition-all group relative ${order.cajeroAtendiendo
                                ? 'bg-slate-900 border-slate-800 opacity-60 cursor-not-allowed grayscale-[0.5]'
                                : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700 hover:border-indigo-500/50 cursor-pointer'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-mono text-indigo-400 font-bold text-lg">
                                    #{order.numeroOrden || order.id.toString().slice(-4)}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {new Date(order.fechaCreacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                                <User size={14} />
                                <span className="font-medium">{order.clienteNombre || order.cliente || "Cliente"}</span>
                            </div>

                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">{order.vendedorNombre || "Vendedor"}</span>
                                <div className="flex items-center gap-1">
                                    {order.cajeroAtendiendo ? (
                                        <span className="flex items-center gap-1 text-red-400 bg-red-900/10 px-2 py-0.5 rounded font-bold">
                                            <XCircle size={12} /> Ocupado
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded">
                                            <CheckCircle size={12} /> Libre
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
