import { useState, useEffect } from 'react';
import { ArrowUpRight, AlertTriangle, PackageCheck, TrendingUp, Loader2 } from 'lucide-react';
import { apiBase } from '../../utils/request';
import { useAuthStore } from '../../store/authStore';

const Dashboard = () => {
    const token = useAuthStore((state) => state.token);
    const [stats, setStats] = useState({
        stockValor: "$ 0",
        stockTrend: "+0%",
        criticos: 0,
        sobreStock: 0,
        ventasMes: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${apiBase}/admin/dashboard/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [token]);

    return (
        <div className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Card 1 */}
                <div className="group relative overflow-hidden p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/40 hover:border-indigo-500/30 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                            <ArrowUpRight size={12} /> {stats.stockTrend}
                        </span>
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium">Valor de Stock</h3>
                    <p className="text-3xl font-bold text-slate-100 mt-1">
                        {loading ? <Loader2 className="animate-spin" /> : stats.stockValor}
                    </p>
                </div>

                {/* Card 2 */}
                <div className="group relative p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/40 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium">Productos Críticos</h3>
                    <p className="text-3xl font-bold text-slate-100 mt-1">
                        {loading ? <Loader2 className="animate-spin" /> : stats.criticos}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Requieren reposición inmediata</p>
                </div>

                {/* Card 3 */}
                <div className="group relative p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/40 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                            <PackageCheck size={24} />
                        </div>
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium">Marcas Sobre-Stock</h3>
                    <p className="text-3xl font-bold text-slate-100 mt-1">
                        {loading ? <Loader2 className="animate-spin" /> : stats.sobreStock}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Acción comercial sugerida</p>
                </div>

                {/* Card 4 */}
                <div className="group relative p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/40 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium">Ventas (Mes)</h3>
                    <p className="text-3xl font-bold text-slate-100 mt-1">
                        {loading ? <Loader2 className="animate-spin" /> : stats.ventasMes}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Unidades movidas</p>
                </div>
            </div>

            {/* Main Chart Area Placeholder */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 min-h-[400px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                    <p className="mb-2 text-lg">Gráfico de Evolución de Stock</p>
                    <p className="text-sm opacity-50">(Funcionalidad Próximamente - Requiere Histórico)</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
