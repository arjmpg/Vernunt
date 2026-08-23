import React, { useRef } from 'react';
import { ShieldCheck, Upload, FileText, Trash2, AlertTriangle, Lock } from 'lucide-react';

export interface DocUploadData {
  docName: string;
  docPreview: string;
  docSize?: number;
  docUrl?: string;
}

export interface AadhaarUploadFieldProps {
  label?: string;
  labelPrefix?: string;
  required?: boolean;
  maxSizeMb?: number;

  uploadedDocName?: string;
  aadhaarDocName?: string;
  uploadedDocPreview?: string;
  aadhaarDocPreview?: string;
  uploadedDocSize?: number;
  aadhaarDocSize?: number;

  onDocUploaded?: (docData: DocUploadData) => void;
  onDocRemoved?: () => void;
  onDocChange?: (name: string, previewUrl: string, size?: number) => void;

  aadhaarNumber?: string;
  onNumberChange?: (num: string) => void;
  error?: string;
  className?: string;
  id?: string;
}

const DEFAULT_MAX_MB = 3;

export default function AadhaarUploadField({
  label,
  labelPrefix = '',
  required = true,
  maxSizeMb = DEFAULT_MAX_MB,
  uploadedDocName,
  aadhaarDocName,
  uploadedDocPreview,
  aadhaarDocPreview,
  uploadedDocSize,
  aadhaarDocSize,
  onDocUploaded,
  onDocRemoved,
  onDocChange,
  aadhaarNumber,
  onNumberChange,
  error,
  className = '',
  id
}: AadhaarUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = React.useState<string>('');

  const activeDocName = uploadedDocName ?? aadhaarDocName ?? '';
  const activeDocPreview = uploadedDocPreview ?? aadhaarDocPreview ?? '';
  const activeDocSize = uploadedDocSize ?? aadhaarDocSize;
  const maxBytes = maxSizeMb * 1024 * 1024;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict validation
    if (file.size > maxBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setLocalError(`File size (${sizeMb} MB) exceeds the mandatory ${maxSizeMb} MB limit. Please select an image or PDF under ${maxSizeMb} MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      
      // Notify parent listeners safely
      if (typeof onDocUploaded === 'function') {
        onDocUploaded({
          docName: file.name,
          docPreview: base64,
          docSize: file.size,
          docUrl: base64
        });
      }
      if (typeof onDocChange === 'function') {
        onDocChange(file.name, base64, file.size);
      }

      // Attempt background upload to local server if available
      try {
        const resp = await fetch('/api/upload-aadhaar-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64,
            fileName: file.name,
            mimeType: file.type
          })
        });
        if (resp.ok) {
          const resJson = await resp.json();
          if (resJson.documentUrl) {
            if (typeof onDocUploaded === 'function') {
              onDocUploaded({
                docName: file.name,
                docPreview: base64,
                docSize: file.size,
                docUrl: resJson.documentUrl
              });
            }
            if (typeof onDocChange === 'function') {
              onDocChange(file.name, resJson.documentUrl, file.size);
            }
          }
        }
      } catch {
        // base64 fallback is preserved
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setLocalError('');
    if (typeof onDocRemoved === 'function') {
      onDocRemoved();
    }
    if (typeof onDocChange === 'function') {
      onDocChange('', '', undefined);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayError = localError || error;
  const inputId = id || `aadhaar-upload-${labelPrefix || 'default'}-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div className={`bg-slate-50/80 p-4.5 rounded-2xl border ${displayError ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'} space-y-3.5 shadow-2xs ${className}`}>
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          {label || (labelPrefix ? `${labelPrefix} Aadhaar Card` : 'Aadhaar Card Document')}
        </label>
        {required && (
          <span className="text-[9.5px] bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
            Mandatory (Max {maxSizeMb} MB)
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-500 leading-snug">
        Upload your government-issued Aadhaar card image or e-Aadhaar PDF for identity assurance.
      </p>

      {displayError && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs font-bold text-rose-700">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{displayError}</span>
        </div>
      )}

      {/* Upload Zone */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFile}
        className="hidden"
        id={inputId}
      />

      {!activeDocName ? (
        <label
          htmlFor={inputId}
          className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl bg-white hover:bg-indigo-50/30 transition cursor-pointer group text-center"
        >
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-150 flex items-center justify-center mb-2.5 group-hover:scale-105 transition">
            <Upload className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-700">
            Click to upload Aadhaar Card (Photo or PDF)
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            Strict {maxSizeMb} MB file size limit • JPG, PNG, WEBP, or PDF
          </span>
        </label>
      ) : (
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-slate-900 truncate">{activeDocName}</p>
                <p className="text-[10px] text-emerald-700 font-semibold">
                  {activeDocSize ? `${(activeDocSize / (1024 * 1024)).toFixed(2)} MB • ` : ''}✓ Attached within {maxSizeMb} MB limit
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition cursor-pointer"
              title="Remove file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {activeDocPreview && !activeDocPreview.endsWith('.pdf') && !activeDocName.endsWith('.pdf') && (
            <div className="w-full h-24 rounded-xl overflow-hidden border border-emerald-200 bg-white">
              <img 
                src={activeDocPreview} 
                alt="Aadhaar Preview" 
                className="w-full h-full object-contain" 
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>
      )}

      {/* Optional Aadhaar Number */}
      {onNumberChange && (
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
            <span>12-Digit Aadhaar Number (Optional)</span>
            <span className="text-[9.5px] text-slate-400 font-normal">Stored securely</span>
          </label>
          <input
            type="text"
            maxLength={14}
            placeholder="XXXX XXXX 1234"
            value={aadhaarNumber ? aadhaarNumber.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim() : ''}
            onChange={(e) => onNumberChange(e.target.value.replace(/\D/g, '').slice(0, 12))}
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 font-mono tracking-widest"
          />
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-0.5">
        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
        <span>Document and location are securely audited only by platform administrators.</span>
      </div>

    </div>
  );
}
