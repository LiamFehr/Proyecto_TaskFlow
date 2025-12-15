import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, ScanBarcode } from "lucide-react";

export default function Home() {
    return (
        <div className="space-y-16">
            <section className="text-center space-y-6 pt-12 pb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                    </span>
                    Nueva Versión 2.0 Disponible
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900">
                    Gestión Inteligente para <br />
                    <span className="text-primary-600">Tu Negocio</span>
                </h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                    Optimiza tus pedidos, controla tu inventario y potencia tus ventas con la plataforma más avanzada del mercado.
                </p>

                <div className="max-w-md mx-auto mt-8 bg-white p-2 rounded-xl shadow-md border border-gray-200 flex gap-2">
                    <input
                        type="text"
                        placeholder="Ingresa tu código de pedido..."
                        className="flex-1 px-4 py-2 outline-none text-gray-700 bg-transparent"
                    />
                    <button className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors" title="Escanear Código">
                        <ScanBarcode className="h-6 w-6" />
                    </button>
                    <Link to="/buscar" className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors">
                        <ArrowRight className="h-6 w-6" />
                    </Link>
                </div>

                <div className="flex justify-center gap-4 pt-4">
                    <Link to="/registro" className="px-8 py-3 bg-white text-primary-600 border border-primary-100 rounded-xl font-semibold text-lg hover:bg-primary-50 transition-all shadow-sm hover:shadow-md">
                        Comenzar Gratis
                    </Link>
                    <Link to="/login" className="px-8 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow-md">
                        Iniciar Sesión
                    </Link>
                </div>
            </section>

            <section className="grid md:grid-cols-3 gap-8">
                {[
                    { icon: Zap, title: "Rápido y Eficiente", desc: "Procesa pedidos en segundos con nuestra interfaz optimizada." },
                    { icon: ShieldCheck, title: "Seguro y Confiable", desc: "Tus datos protegidos con encriptación de grado bancario." },
                    { icon: CheckCircle2, title: "Fácil de Usar", desc: "Diseñado para que cualquiera pueda usarlo sin entrenamiento." }
                ].map((feature, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <feature.icon className="h-10 w-10 text-primary-500 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-gray-500">{feature.desc}</p>
                    </div>
                ))}
            </section>
        </div>
    );
}
