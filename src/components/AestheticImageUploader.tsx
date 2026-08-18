import React, { useState, useRef } from 'react';
import { UploadCloud, Image, Trash2, Sparkles, FileImage } from 'lucide-react';

interface AestheticImageUploaderProps {
  value: string;
  onChange: (newValue: string) => void;
  label?: string;
  presetSuggestions?: { name: string; url: string }[];
  id?: string;
}

export default function AestheticImageUploader({
  value,
  onChange,
  label = "Upload Image Artwork",
  presetSuggestions = [],
  id = "aesthetic-uploader"
}: AestheticImageUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setErrorMsg('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Invalid file type. Please upload a standard image artwork (PNG, JPG, WEBP).');
      return;
    }

    // Maximum 5MB base64 size to fit comfortably in Firestore
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size limit exceeded. Suggest files under 5 megabytes.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        onChange(e.target.result);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to process image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange('');
    setErrorMsg('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div id={`${id}-wrapper`} className="space-y-1.5 text-left">
      {label && (
        <label className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[9px] text-slate-400 normal-case font-medium">Supports JPG, PNG & Drag-drop</span>
        </label>
      )}

      {/* Main Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-4 transition text-center flex flex-col items-center justify-center min-h-[140px] cursor-pointer ${
          isDragActive 
            ? 'border-orange-500 bg-orange-50/20' 
            : value 
              ? 'border-emerald-200 bg-emerald-50/10' 
              : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {value ? (
          <div className="w-full space-y-3 p-1 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="relative mx-auto w-max max-w-full rounded-xl overflow-hidden border border-slate-150 shadow-xs bg-slate-50">
              <img
                src={value}
                alt="File Upload Preview"
                className="max-h-28 object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-1.5 right-1.5 p-1.5 bg-slate-900/95 hover:bg-rose-600 text-white rounded-lg shadow-md transition duration-200"
                title="Remove Media"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-emerald-700 font-bold flex items-center justify-center gap-1">
              <FileImage className="w-3.5 h-3.5" /> File Selected Successfully
            </p>
          </div>
        ) : (
          <div className="space-y-2 pointer-events-none">
            <div className="p-3 bg-orange-50 border border-orange-100 rounded-full w-max mx-auto text-orange-600">
              <UploadCloud className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">Click to upload file or Drag & Drop</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Maximum size limit: 5MB</p>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-100 p-2 rounded-lg text-center mt-1">
          ⚠️ {errorMsg}
        </p>
      )}

      {/* Preset Suggestions Row */}
      {presetSuggestions.length > 0 && !value && (
        <div className="pt-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="text-[9px] text-slate-400 block font-semibold mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> Fast-select background artwork template:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presetSuggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChange(item.url)}
                className="p-1 px-1.5 bg-white border border-slate-200 text-slate-650 rounded text-[9px] hover:border-orange-350 hover:bg-orange-50/20 transition cursor-pointer"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
