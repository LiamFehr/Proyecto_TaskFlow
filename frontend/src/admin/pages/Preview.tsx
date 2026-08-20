import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Preview = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Vista Previa de Impacto</h1>
                    <p className="text-slate-500 mt-1">Revisa los cambios antes de confirmar. Esta acción es irreversible.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/admin/documents')}
                        className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/20">
                        <CheckCircle size={18} />
                        Confirmar y Aplicar
                    </button>
                </div>
            </header>

            {/* Impact Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                    <p className="text-slate-500 text-xs uppercase tracking-wider">Líneas Afectadas</p>
                    <p className="text-2xl font-bold text-slate-200 mt-1">142</p>
                </div>
                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                    <p className="text-slate-500 text-xs uppercase tracking-wider">Stock Neto</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">+1,204</p>
                </div>
                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider">Alertas</p>
                        <p className="text-2xl font-bold text-amber-500 mt-1">3 Outliers</p>
                    </div>
                    <AlertTriangle className="text-amber-500/50" size={32} />
                </div>
            </div>

            {/* Detailed Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Código</th>
                            <th className="px-6 py-4">Descripción</th>
                            <th className="px-6 py-4 text-right">Stock Actual</th>
                            <th className="px-6 py-4 text-right">Cambio</th>
                            <th className="px-6 py-4 text-right">Stock Final</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        <tr className="bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
                            <td className="px-6 py-4 font-mono text-slate-300">10234</td>
                            <td className="px-6 py-4 text-slate-300">Tuerca Gigante</td>
                            <td className="px-6 py-4 text-right text-slate-500">10</td>
                            <td className="px-6 py-4 text-right text-emerald-400 font-bold">+500</td>
                            <td className="px-6 py-4 text-right text-slate-200 font-bold">510</td>
                            <td className="px-6 py-4 text-center">
                                <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-500 rounded border border-amber-500/20">OUTLIER</span>
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-mono text-slate-300">5521</td>
                            <td className="px-6 py-4 text-slate-300">Arandela Plana</td>
                            <td className="px-6 py-4 text-right text-slate-500">1,200</td>
                            <td className="px-6 py-4 text-right text-emerald-400 font-bold">+100</td>
                            <td className="px-6 py-4 text-right text-slate-200">1,300</td>
                            <td className="px-6 py-4 text-center">
                                <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded">OK</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Preview;
