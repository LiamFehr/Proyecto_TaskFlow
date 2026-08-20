import { useEffect, useRef, useState } from "react";
import { X, QrCode } from "lucide-react";

interface QRScannerProps {
    onDetect: (code: string) => void;
    onClose: () => void;
}

export default function QRScanner({ onDetect, onClose }: QRScannerProps) {
    const [status, setStatus] = useState<"loading" | "scanning" | "error">("loading");

    const videoRef   = useRef<HTMLVideoElement>(null);
    const streamRef  = useRef<MediaStream | null>(null);
    const loopRef    = useRef<number>(0);
    const detectedRef = useRef(false);
    const onDetectRef = useRef(onDetect);
    onDetectRef.current = onDetect;

    useEffect(() => {
        const video = videoRef.current!;

        const start = async () => {
            try {
                // ── 1. Resolver detector ──────────────────────────────────────────
                // Native BarcodeDetector: Android Chrome + iOS 17+ — OS-level, fastest.
                // ZXing-WASM polyfill:   iOS < 17, Firefox    — near-native robustness.
                let detector: any;
                let usePolyfill = false;

                if ("BarcodeDetector" in window) {
                    detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
                } else {
                    const { BarcodeDetector: Polyfill } = await import("barcode-detector/pure");
                    detector = new Polyfill({ formats: ["qr_code"] });
                    usePolyfill = true;
                }

                // ── 2. Canvas de resize (solo polyfill) ──────────────────────────
                // createImageBitmap({ resizeWidth }) no está soportado en Safari.
                // Usamos un canvas reutilizable para escalar el frame a 720px.
                const resizeCanvas = usePolyfill ? document.createElement("canvas") : null;

                // ── 3. Loop de detección ──────────────────────────────────────────
                // Path nativo (Android Chrome): rAF a ~60fps.
                // Path polyfill (iOS Safari): throttle a ~10fps vía setTimeout(100ms)
                // para no saturar ZXing-WASM en iPhone.
                const tick = async () => {
                    if (detectedRef.current) return;

                    if (video.readyState < video.HAVE_ENOUGH_DATA) {
                        loopRef.current = requestAnimationFrame(tick);
                        return;
                    }

                    try {
                        let source: HTMLVideoElement | HTMLCanvasElement = video;

                        if (usePolyfill && resizeCanvas && video.videoWidth > 0) {
                            // Escalar a 720px de ancho con canvas — compatible con todos los Safari
                            const scale = Math.min(1, 720 / video.videoWidth);
                            const w = Math.round(video.videoWidth * scale);
                            const h = Math.round(video.videoHeight * scale);
                            if (resizeCanvas.width !== w)  resizeCanvas.width  = w;
                            if (resizeCanvas.height !== h) resizeCanvas.height = h;
                            resizeCanvas.getContext("2d")!.drawImage(video, 0, 0, w, h);
                            source = resizeCanvas;
                        }

                        const codes = await detector.detect(source);

                        if (codes.length > 0 && !detectedRef.current) {
                            detectedRef.current = true;
                            navigator.vibrate?.(50);
                            onDetectRef.current(codes[0].rawValue);
                            return; // Detectado — detiene el loop
                        }
                    } catch (_) {
                        // detector.detect puede lanzar si el frame no es procesable — continuar
                    }

                    if (usePolyfill) {
                        // Throttle: ZXing-WASM es pesado en iOS — 10fps es suficiente
                        setTimeout(() => {
                            if (!detectedRef.current) loopRef.current = requestAnimationFrame(tick);
                        }, 100);
                    } else {
                        loopRef.current = requestAnimationFrame(tick);
                    }
                };

                // ── 3. Cámara ──────────────────────────────────────────────────────
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: "environment" },
                        width:  { ideal: 1920 },
                        height: { ideal: 1080 },
                    },
                });
                streamRef.current = stream;
                video.srcObject = stream;
                await video.play();
                setStatus("scanning");
                loopRef.current = requestAnimationFrame(tick);

            } catch {
                setStatus("error");
            }
        };

        start();

        return () => {
            detectedRef.current = true; // Corta el loop en el próximo tick
            cancelAnimationFrame(loopRef.current);
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col h-screen w-screen overflow-hidden">
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
            />

            {/* Overlay UI — pointer-events-none para que los toques lleguen al video */}
            <div className="relative z-10 flex flex-col h-full pointer-events-none">

                {/* Header */}
                <div className="p-6 flex justify-between items-start pointer-events-auto">
                    <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-white flex items-center gap-2">
                        <QrCode size={18} className="text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Lector QR</span>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="p-3 text-white bg-black/40 rounded-full backdrop-blur-xl border border-white/20 active:scale-90 transition-all"
                    >
                        <X size={32} />
                    </button>
                </div>

                {/* Visor con esquinas */}
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-72 h-72 relative flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-14 h-14 border-t-4 border-l-4 border-blue-500/80 rounded-tl-[36px]" />
                        <div className="absolute top-0 right-0 w-14 h-14 border-t-4 border-r-4 border-blue-500/80 rounded-tr-[36px]" />
                        <div className="absolute bottom-0 left-0 w-14 h-14 border-b-4 border-l-4 border-blue-500/80 rounded-bl-[36px]" />
                        <div className="absolute bottom-0 right-0 w-14 h-14 border-b-4 border-r-4 border-blue-500/80 rounded-br-[36px]" />
                        {status === "scanning" && (
                            <span className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em]">
                                Apuntá aquí
                            </span>
                        )}
                    </div>
                </div>

                {/* Pie */}
                <div className="p-10 text-center bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
                        Apuntá el código al cuadro
                    </p>
                </div>
            </div>

            {status === "loading" && (
                <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
            )}

            {status === "error" && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 gap-6 p-8">
                    <QrCode size={48} className="text-white/20" />
                    <p className="text-white/60 text-center text-sm leading-relaxed">
                        No se pudo acceder a la cámara.<br />
                        Verificá los permisos del navegador.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest"
                    >
                        Cerrar
                    </button>
                </div>
            )}
        </div>
    );
}
