import CameraScanner from "./CameraScanner";

export default function ScannerModal({ open, onClose, onDetect }) {
    if (!open) return null;

    return (
        <div className="modal">
            <CameraScanner onDetect={onDetect} onClose={onClose} />
        </div>
    );
}
