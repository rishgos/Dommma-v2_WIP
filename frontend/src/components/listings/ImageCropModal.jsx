import React, { useState, useRef, useCallback } from 'react';
import { X, Check, Loader2, RectangleHorizontal, Square, RectangleVertical, Maximize2 } from 'lucide-react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Crop modal — full-image crop with aspect-ratio presets, applies to canvas,
 * uploads as a new file, calls onCropped(newUrl) so the parent can replace
 * the original URL in its array.
 *
 * Notes:
 * - Loads the image with crossOrigin='anonymous'. If the host blocks CORS,
 *   the canvas will be tainted and the upload step will throw — handled.
 * - Default aspect is 4:3 (matches our listing card aspect). User can pick
 *   1:1, 16:9, 9:16 (portrait), or Free.
 */
export default function ImageCropModal({ imageUrl, onClose, onCropped }) {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [aspect, setAspect] = useState(4 / 3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const imgRef = useRef(null);

  // When the image first loads, drop a default centered crop on it
  const onImageLoad = useCallback(
    (e) => {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      if (aspect) {
        const c = centerCrop(
          makeAspectCrop({ unit: '%', width: 80 }, aspect, naturalWidth, naturalHeight),
          naturalWidth,
          naturalHeight
        );
        setCrop(c);
      } else {
        setCrop({ unit: '%', x: 10, y: 10, width: 80, height: 80 });
      }
    },
    [aspect]
  );

  const changeAspect = (newAspect) => {
    setAspect(newAspect);
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      if (newAspect) {
        const c = centerCrop(
          makeAspectCrop({ unit: '%', width: 80 }, newAspect, naturalWidth, naturalHeight),
          naturalWidth,
          naturalHeight
        );
        setCrop(c);
      } else {
        setCrop({ unit: '%', x: 10, y: 10, width: 80, height: 80 });
      }
    }
  };

  // Take the completed crop region, draw to a canvas at native resolution, upload
  const apply = async () => {
    if (!completedCrop || !imgRef.current) return;
    setBusy(true);
    setError('');
    try {
      const img = imgRef.current;
      // ReactCrop gives us pixel coords relative to the *displayed* image size.
      // Compute scale to original image dimensions.
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      const cw = Math.round(completedCrop.width * scaleX);
      const ch = Math.round(completedCrop.height * scaleY);
      const cx = Math.round(completedCrop.x * scaleX);
      const cy = Math.round(completedCrop.y * scaleY);

      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);

      const blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('Canvas export failed — image host may block cross-origin'))), 'image/jpeg', 0.92)
      );

      const fd = new FormData();
      fd.append('file', blob, 'cropped.jpg');
      const res = await axios.post(`${API}/upload/image`, fd);
      onCropped(res.data.url);
      onClose();
    } catch (e) {
      console.error('Crop failed:', e);
      setError(
        "Couldn't crop this photo. The image host may block direct edits — try downloading, cropping on your device, and re-uploading."
      );
    } finally {
      setBusy(false);
    }
  };

  // Cache-bust + crossOrigin so canvas can read pixels
  const fetchUrl = imageUrl.includes('?') ? `${imageUrl}&cb=${Date.now()}` : `${imageUrl}?cb=${Date.now()}`;

  return (
    <div className="fixed inset-0 z-[9500] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1A2332] rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-white/10">
          <div>
            <h3 className="font-semibold text-[#1A2F3A] dark:text-white">Crop photo</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Drag the corners to adjust. Pick an aspect ratio below.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Aspect-ratio picker */}
        <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-gray-100 dark:border-white/10">
          {[
            { label: 'Free', value: undefined, icon: Maximize2 },
            { label: '4:3', value: 4 / 3, icon: RectangleHorizontal },
            { label: '1:1', value: 1, icon: Square },
            { label: '16:9', value: 16 / 9, icon: RectangleHorizontal },
            { label: '3:4', value: 3 / 4, icon: RectangleVertical },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => changeAspect(opt.value)}
              disabled={busy}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                aspect === opt.value
                  ? 'bg-[#1A2F3A] text-white'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
              }`}
            >
              <opt.icon size={12} />
              {opt.label}
            </button>
          ))}
        </div>

        {/* Crop area */}
        <div className="flex-1 overflow-auto bg-[#F5F5F0] dark:bg-[#0F1419] flex items-center justify-center p-4 min-h-0">
          <ReactCrop
            crop={crop}
            onChange={(_, c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            keepSelection
          >
            <img
              ref={imgRef}
              src={fetchUrl}
              crossOrigin="anonymous"
              alt="Crop target"
              onLoad={onImageLoad}
              className="max-h-[60vh] max-w-full"
              style={{ display: 'block' }}
            />
          </ReactCrop>
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-2 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-xs border-t border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={busy || !completedCrop || completedCrop.width === 0}
            className="px-4 py-2 rounded-lg text-sm bg-[#1A2F3A] text-white font-medium hover:bg-[#2C4A52] disabled:opacity-50 flex items-center gap-2"
          >
            {busy ? (
              <><Loader2 size={14} className="animate-spin" /> Saving…</>
            ) : (
              <><Check size={14} /> Apply crop</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
