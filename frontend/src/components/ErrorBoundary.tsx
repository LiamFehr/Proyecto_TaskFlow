import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 m-4 text-red-400 bg-red-900/20 rounded-xl border border-red-500/20 min-h-[200px] flex flex-col justify-center">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        ⚠️ Error de Renderizado
                    </h2>
                    <p className="mb-4 text-slate-300">Ocurrió un error inesperado al cargar esta página.</p>
                    <div className="bg-slate-950 p-6 rounded-lg border border-red-500/20 shadow-inner">
                        <code className="text-sm font-mono text-red-300 break-words whitespace-pre-wrap">
                            {this.state.error?.toString() || "Error desconocido"}
                        </code>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold w-fit transition-colors"
                    >
                        Recargar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
