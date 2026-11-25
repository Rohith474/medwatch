'use client';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface CameraScannerProps {
  onDetected: (data: { batch?: string; drug?: string; raw: string }) => void;
  onClose: () => void;
}

function parseScannedCode(raw: string): { batch?: string; drug?: string; raw: string } {
  const text = raw.trim();
  // Try JSON QR payload
  if (text.startsWith('{')) {
    try {
      const obj = JSON.parse(text);
      return {
        batch: obj.batch || obj.batch_no || obj.batch_number || '',
        drug: obj.drug || obj.drug_name || obj.brand_name || '',
        raw: text,
      };
    } catch {
      // fall through
    }
  }
  // Try key=value / URL query format (?batch=...&drug=...)
  if (text.includes('batch=') || text.includes('drug=')) {
    try {
      const queryPart = text.includes('?') ? text.split('?')[1] : text;
      const params = new URLSearchParams(queryPart);
      return {
        batch: params.get('batch') || params.get('batch_no') || '',
        drug: params.get('drug') || params.get('drug_name') || '',
        raw: text,
      };
    } catch {
      // fall through
    }
  }
  // Plain barcode or batch string
  return { batch: text, raw: text };
}

export default function CameraScanner({ onDetected, onClose }: CameraScannerProps) {
  const [camError, setCamError] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startedRef = useRef(false);
  const containerId = 'medwatch-qr-reader';

  const stopCamera = async () => {
    if (scannerRef.current && startedRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore if already stopped
      }
      startedRef.current = false;
    }
  };

  useEffect(() => {
    let mounted = true;
    const html5Qr = new Html5Qrcode(containerId);
    scannerRef.current = html5Qr;

    html5Qr
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 160 } },
        async (decodedText) => {
          if (!mounted) return;
          await stopCamera();
          onDetected(parseScannedCode(decodedText));
        },
        () => {
          // ignore per-frame decode misses
        }
      )
      .then(() => {
        startedRef.current = true;
        if (mounted) setScanning(true);
      })
      .catch(() => {
        if (mounted) {
          setCamError('Camera not available or permission denied. You can still upload a barcode/QR image below.');
        }
      });

    return () => {
      mounted = false;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !scannerRef.current) return;
    setCamError('');
    try {
      await stopCamera();
      const decoded = await scannerRef.current.scanFile(file, true);
      onDetected(parseScannedCode(decoded));
    } catch {
      setCamError('Could not read a barcode or QR code from that image. Try a clearer photo.');
    }
  };

  return (
    <div className="bg-black/70 border-2 border-cyan-500/50 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          📷 Live QR &amp; Barcode Scanner
        </div>
        <button
          type="button"
          onClick={async () => {
            await stopCamera();
            onClose();
          }}
          className="text-xs font-bold text-gray-300 hover:text-white bg-white/10 px-3 py-1.5 rounded-lg"
        >
          ✕ Close Camera
        </button>
      </div>

      {/* Camera viewport */}
      <div className="rounded-xl overflow-hidden bg-black border border-cyan-900/60 min-h-[220px] flex items-center justify-center relative">
        <div id={containerId} className="w-full" />
        {!scanning && !camError && (
          <div className="absolute inset-0 flex items-center justify-center text-cyan-300 text-xs font-mono">
            ⏳ Starting camera...
          </div>
        )}
      </div>

      {camError && (
        <div className="bg-amber-900/40 border border-amber-600/50 text-amber-200 rounded-xl px-4 py-2.5 text-xs">
          ⚠️ {camError}
        </div>
      )}

      {/* Image upload fallback */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-white/10">
        <span className="text-xs text-blue-300">No webcam or blurry camera?</span>
        <label className="cursor-pointer bg-white/10 hover:bg-white/20 border border-cyan-500/40 text-cyan-300 px-3.5 py-2 rounded-xl text-xs font-bold transition-all">
          📁 Scan From Image File
          <input type="file" accept="image/*" onChange={handleFileScan} className="hidden" />
        </label>
      </div>
    </div>
  );
}
