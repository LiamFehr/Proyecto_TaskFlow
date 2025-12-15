import { useEffect, useRef, useState } from "react";
import { procesarImagen } from "./OcrProcessor";

export default function CameraScanner({ onDetect, onClose }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Antigravity: Refs for stability check
    const lastCodeRef = useRef(null);
    const matchesRef = useRef(0);

    const [scanning, setScanning] = useState(true);
    const [status, setStatus] = useState("Iniciando cámara...");

    // Initialize camera and worker
    useEffect(() => {
        let stream = null;

        const startCamera = async () => {
            try {
                // Initialize OCR worker in background
                setStatus("Cargando IA...");
                // await initWorker();

                setStatus("Accediendo a cámara...");
                // Request higher resolution for better OCR detail
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "environment",
                        width: { ideal: 1920 }, // Attempt HD definition
                        height: { ideal: 1080 }
                    }
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                    setStatus("Escaneando...");
                    scanLoop();
                }
            } catch (err) {
                console.error("Camera error:", err);
                setStatus(`Error: ${err.message || "No se pudo acceder a la cámara"}`);
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            setScanning(false);
        };
    }, []);

    const scanLoop = async () => {
        if (!videoRef.current || !canvasRef.current || !scanning) return;

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                // Define ROI (Region of Interest) - Center Rectangle (Tickect Style)
                // "Cuadro interno muy chico" - e.g. 50% width, 25% height of video
                const rw = video.videoWidth * 0.7;
                const rh = video.videoHeight * 0.3;
                const sx = (video.videoWidth - rw) / 2;
                const sy = (video.videoHeight - rh) / 2;

                canvas.width = rw;
                canvas.height = rh;
                const ctx = canvas.getContext("2d");

                // Draw only the center crop to the canvas
                ctx.drawImage(video, sx, sy, rw, rh, 0, 0, rw, rh);

                // Process frame
                const result = await procesarImagen(canvas);

                if (result && result.error) {
                    setStatus(`Error Back: ${JSON.stringify(result.error).slice(0, 30)}`);
                    // Retry slower if error
                    await new Promise(r => setTimeout(r, 1000));
                } else if (result && result.text) {
                    const code = result.text;
                    // Stability check: Only accept if we see the SAME code multiple times
                    if (code === lastCodeRef.current) {
                        matchesRef.current += 1;
                    } else {
                        matchesRef.current = 1;
                        lastCodeRef.current = code;
                    }

                    // Show user what we are seeing (Debug feedback)
                    setStatus(`Viendo: ${code} (${matchesRef.current}/3)`);

                    // Require 3 consecutive matches for stability
                    if (matchesRef.current >= 3) {
                        onDetect(code);
                        return; // Stop scanning
                    }
                } else {
                    matchesRef.current = 0;
                    lastCodeRef.current = null;
                    setStatus("Apunta el código en el recuadro");
                }
            }
        } catch (e) {
            console.error(e);
        }

        // Keep scanning if component is still mounted
        if (scanning) {
            requestAnimationFrame(scanLoop);
            // Note: requesting every frame is heavy for OCR. 
            // Usually valid to throttle, but requestAnimationFrame ensures UI doesn't freeze.
            // Tesseract 'recognize' is async so it effectively throttles itself (won't start next until prev finishes).
        }
    };

    return (
        <div className="relative w-full h-[300px] bg-black rounded-lg overflow-hidden flex flex-col items-center justify-center">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
            {/* Debug View: Show what the AI sees (Cropped Image) */}
            <canvas ref={canvasRef} className="absolute top-2 left-2 w-24 h-24 border border-red-500 z-50 bg-white opacity-80" />

            {/* Overlay UI - Visual Guide (Darken outside) */}
            {/* REMOVED blocking overlay - was darkening the center too! */}
            {/* If we want to darken OUTSIDE only, we need a complex clip-path or huge borders. 
                For now, clear view is better for OCR light. */}

            {/* The Finder Box (Clear center) */}
            <div className="absolute border-2 border-white/70 rounded-lg w-[70%] h-[30%] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] z-10 flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-green-400/50 animate-pulse m-[-2px] rounded-lg"></div>
                {/* Corner Markers */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500 -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500 -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500 -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500 -mb-1 -mr-1"></div>
            </div>

            <div className="absolute bottom-4 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm z-20">
                {status}
            </div>

            <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-30"
            >
                ✕
            </button>
        </div>
    );
}
