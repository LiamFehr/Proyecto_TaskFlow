import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, FileText, LogOut, Tag, Menu, X, ShoppingBag, Database, CreditCard, History, Upload } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { apiBase } from '../../utils/request';

import { ErrorBoundary } from '../../components/ErrorBoundary';

const AdminLayout = () => {
    const location = useLocation();
    const token = useAuthStore((state) => state.token);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500/30 overflow-hidden">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800 bg-slate-900/95 backdrop-blur-xl flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:bg-slate-900/50
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img
                            src="/Logo.png"
                            alt="TaskFlow"
                            className="w-10 h-10 rounded-lg shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200"
                        />
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                                TaskFlow
                            </h1>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Admin Core</p>
                        </div>
                    </Link>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive('/admin')
                            ? 'bg-indigo-500/10 text-indigo-400 shadow-lg shadow-indigo-500/10 border border-indigo-500/20'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                            }`}
                    >
                        <LayoutDashboard size={20} className={isActive('/admin') ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-100'} />
                        <span className="font-medium">Dashboard</span>
                    </Link>

                    <Link
                        to="/admin/stock"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive('/admin/stock')
                            ? 'bg-indigo-500/10 text-indigo-400 shadow-lg shadow-indigo-500/10 border border-indigo-500/20'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                            }`}
                    >
                        <Package size={20} className={isActive('/admin/stock') ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-100'} />
                        <span className="font-medium">Stock</span>
                    </Link>

                    <Link
                        to="/admin/products"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive('/admin/products')
                            ? 'bg-indigo-500/10 text-indigo-400 shadow-lg shadow-indigo-500/10 border border-indigo-500/20'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                            }`}
                    >
                        <Tag size={20} className={isActive('/admin/products') ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-100'} />
                        <span className="font-medium">Productos</span>
                    </Link>

                    <Link
                        to="/admin/documents"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive('/admin/documents')
                            ? 'bg-indigo-500/10 text-indigo-400 shadow-lg shadow-indigo-500/10 border border-indigo-500/20'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                            }`}
                    >
                        <FileText size={20} className={isActive('/admin/documents') ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-100'} />
                        <span className="font-medium">Documentos</span>
                    </Link>

                    {/* NUEVOS MODULOS COMMERCE */}
                    <div className="my-2 border-t border-slate-800/50 mx-4" />
                    <p className="px-6 text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 mt-3">Comercio</p>

                    <Link
                        to="/admin/caja"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive('/admin/caja')
                            ? 'bg-indigo-500/10 text-indigo-400 shadow-lg shadow-indigo-500/10 border border-indigo-500/20'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                            }`}
                    >
                        <CreditCard size={20} className={isActive('/admin/caja') ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-100'} />
                        <span className="font-medium">Caja Central</span>
                    </Link>

                    <Link
                        to="/admin/registros"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive('/admin/registros')
                            ? 'bg-indigo-500/10 text-indigo-400 shadow-lg shadow-indigo-500/10 border border-indigo-500/20'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                            }`}
                    >
                        <History size={20} className={isActive('/admin/registros') ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-100'} />
                        <span className="font-medium">Historial Ventas</span>
                    </Link>


                    <div className="my-4 border-t border-slate-800/50 mx-4" />

                    <Link
                        to="/vendedor"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all duration-200 group border border-emerald-500/20 hover:border-emerald-500/40"
                    >
                        <ShoppingBag size={20} className="text-emerald-500 group-hover:text-emerald-400" />
                        <span className="font-medium">Ir a Ventas</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={() => { useAuthStore.getState().logout(); window.location.href = "/"; }}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Salir</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 overflow-hidden">
                <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/70 border-b border-slate-800/50 px-4 sm:px-8 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleMenu}
                            className="p-2 -ml-2 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-slate-800/50 transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-lg font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-none">
                            {isActive('/admin') && 'Overview'}
                            {isActive('/admin/stock') && 'Gestión de Stock'}
                            {isActive('/admin/documents') && 'Control Documental'}
                            {isActive('/admin/products') && 'Catálogo de Productos'}
                            {isActive('/admin/caja') && 'Punto de Venta - Caja Central'}
                            {isActive('/admin/registros') && 'Historial de Transacciones'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors mr-2 cursor-pointer" title="Restaurar Base de Datos">
                            <Upload size={16} />
                            <span className="text-sm font-medium hidden sm:inline">Importar</span>
                            <input
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={async (e) => {
                                    if (!e.target.files?.[0]) return;
                                    if (!confirm("¿Está seguro de restaurar una copia de seguridad? Esto sobrescribirá los datos actuales.")) return;

                                    const file = e.target.files[0];
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    try {
                                        const res = await fetch(`${apiBase}/admin/backup/restore`, {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${token}` },
                                            body: formData
                                        });
                                        if (res.ok) alert("Backup restaurado con éxito. Por favor recargue la página.");
                                        else alert("Error al restaurar backup.");
                                    } catch (e) { console.error(e); alert("Error de conexión durante la restauración."); }
                                }}
                            />
                        </label>

                        <button
                            onClick={async () => {
                                try {
                                    const res = await fetch(`${apiBase}/admin/backup`, {
                                        headers: {
                                            'Authorization': `Bearer ${token}`
                                        }
                                    });
                                    if (res.ok) {
                                        const blob = await res.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `taskflow_backup_${new Date().toISOString().split('T')[0]}.json`;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        document.body.removeChild(a);
                                    } else {
                                        alert("Error descargando backup");
                                    }
                                } catch (e) {
                                    console.error(e);
                                    alert("Error de conexión");
                                }
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors mr-2"
                            title="Descargar Backup Completo"
                        >
                            <Database size={16} />
                            <span className="text-sm font-medium hidden sm:inline">Backup</span>
                        </button>

                        <button
                            onClick={() => (window as any).openHelpCenter?.()}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Centro de Ayuda"
                            aria-label="Abrir Centro de Ayuda"
                        >
                            ?
                        </button>

                    </div>
                </header>

                <div className="flex-1 overflow-auto p-4 sm:p-8">
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </div>
            </main>
            {/* AI Widget */}

        </div >
    );
};

export default AdminLayout;
