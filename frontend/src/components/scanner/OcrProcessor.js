import axios from 'axios';
import { apiBase } from '@/utils/request';

// Removed local Tesseract worker logic
// export async function initWorker() { ... }

export async function procesarImagen(canvas) {
    try {
        // Pre-process image locally to assume load off backend and ensure consistency
        // Upscale 2x for better character recognition
        const scale = 2;
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = canvas.width * scale;
        scaledCanvas.height = canvas.height * scale;
        const ctx = scaledCanvas.getContext('2d');

        // Manual Binarization (Thresholding) - This effectively "erases" the background
        ctx.filter = 'grayscale(100%)';
        ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);

        const imageData = ctx.getImageData(0, 0, scaledCanvas.width, scaledCanvas.height);
        const data = imageData.data;
        // Threshold level (0-255). 128 is a good starting point for black text on white tags
        const threshold = 110;

        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const value = avg < threshold ? 0 : 255; // Strict Black or White
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
        }
        ctx.putImageData(imageData, 0, 0);

        // Convert processed canvas to Blob
        const blob = await new Promise(resolve => scaledCanvas.toBlob(resolve, 'image/jpeg', 0.95));
        const formData = new FormData();
        formData.append('image', blob, 'scan.jpg');

        // Check for token in localStorage (standard for this app)
        const token = localStorage.getItem('token');

        // Send to backend using Axios directly to handle Multipart/Form-Data correctly
        // (The custom request.js utility forces JSON, which breaks file uploads)
        const response = await axios.post(`${apiBase}/api/ocr/scan`, formData, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
            },
        });

        // Backend response expected: { text: "12345", confidence: 80 }
        const { text, confidence } = response.data;

        // Basic cleaning just in case backend didn't perfect it
        const cleaned = text ? text.replace(/\D/g, '').trim() : "";

        return cleaned.length >= 1 ? { text: cleaned, confidence } : null;

    } catch (e) {
        console.error("Backend OCR Error:", e);
        return { error: e.response?.data || e.message || "Error de conexión" };
    }
}
