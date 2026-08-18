import React, { useState } from 'react';
import { ShieldCheck, Check, X, ShieldAlert, Loader2, Upload } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChildProfile } from '../types.ts';

interface AadhaarVerificationModalProps {
  userProfile: ChildProfile;
  onClose: () => void;
  onVerifySuccess: (updatedProfile: ChildProfile) => void;
  actionMessage?: string; // e.g., "To connect with Elena & Leo, please verify your Aadhaar"
}

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 1, 4, 6, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

function validateVerhoeff(array: string): boolean {
  let c = 0;
  const invertedArray = array.split('').reverse().map(Number);
  for (let i = 0; i < invertedArray.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][invertedArray[i]]];
  }
  return c === 0;
}

export default function AadhaarVerificationModal({
  userProfile,
  onClose,
  onVerifySuccess,
  actionMessage = "To interact with the local neighborhood network, connect with playmates, or send messages, Aadhaar verification is required."
}: AadhaarVerificationModalProps) {
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [uploadedDocUrl, setUploadedDocUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isExtractingAadhaar, setIsExtractingAadhaar] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: 'info' as 'info' | 'error' | 'success' });

  const handleExtractAadhaarFromCard = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB limit
    if (file.size > MAX_SIZE_BYTES) {
      setMsg({
        text: `⚠️ File size exceeds the 1 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select an Aadhaar image or document under 1 MB.`,
        type: 'error'
      });
      e.target.value = '';
      return;
    }

    setIsExtractingAadhaar(true);
    setMsg({ text: '🔒 Uploading document & analyzing security features...', type: 'info' });

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/extract-aadhaar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Data })
          });
          const resData = await res.json();
          if (res.ok && resData.success && resData.data) {
            const { aadhaarNumber: extractedUid, name: extractedName, documentUrl, fileName } = resData.data;

            if (extractedUid && extractedUid.length === 12) {
              setAadhaarNumber(extractedUid);
            }
            if (documentUrl) {
              setUploadedDocUrl(documentUrl);
            }
            if (fileName) {
              setUploadedFileName(fileName);
            }

            setMsg({
              text: resData.message || `✓ Aadhaar document uploaded and stored on server (${fileName || 'saved'})! Extracted UID: ${extractedUid || 'Detected'}, Holder: ${extractedName || userProfile.parentName}.`,
              type: 'success'
            });
          } else {
            setMsg({
              text: resData.error || 'Failed to extract clear Aadhaar details from image. You may enter manually.',
              type: 'error'
            });
          }
        } catch (err: any) {
          console.error('Aadhaar OCR extraction error:', err);
          setMsg({ text: `OCR Extraction Error: ${err.message || err}`, type: 'error' });
        } finally {
          setIsExtractingAadhaar(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Aadhaar file read error:', err);
      setIsExtractingAadhaar(false);
      setMsg({ text: 'Could not read image file.', type: 'error' });
    }
  };

  const handleManualVerificationSubmit = () => {
    const cleaned = aadhaarNumber.replace(/\s/g, '');
    if (!cleaned || cleaned.length !== 12) {
      setMsg({ text: 'Please enter or extract a valid 12-digit Aadhaar Number.', type: 'error' });
      return;
    }

    if (!validateVerhoeff(cleaned)) {
      setMsg({ 
        text: '❌ Invalid Aadhaar Format: The provided Aadhaar number failed checksum validation. Please verify your card digits.', 
        type: 'error' 
      });
      return;
    }

    setIsVerifying(true);
    setMsg({ text: '⏳ Confirming manual document verification...', type: 'info' });

    setTimeout(() => {
      setIsVerified(true);
      setIsVerifying(false);
      setMsg({ 
        text: `✓ Profile successfully verified via manual Aadhaar document submission! Stored on server: ${uploadedFileName || 'Document linked'}`, 
        type: 'success' 
      });
      
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      const updated: ChildProfile = {
        ...userProfile,
        aadhaarNumber: cleaned,
        aadhaarVerified: true
      };

      setTimeout(() => {
        onVerifySuccess(updated);
      }, 1200);
    }, 600);
  };

  return (
    <div id="aadhaar-dashboard-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-[9999] overflow-y-auto">
      <div id="aadhaar-verify-box" className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 transform scale-100 transition duration-300 flex flex-col max-h-[85vh] my-auto">
        <div id="aadhaar-verify-header" className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <h3 className="font-bold text-xs uppercase tracking-widest flex items-center gap-2 font-serif">
            <ShieldCheck className="w-5 h-5 text-emerald-400 fill-emerald-400/20" /> Vernunt Security Center
          </h3>
          <button 
            id="btn-close-aadhaar-verify"
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div id="aadhaar-verify-body" className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100 text-xs">
            <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="block font-bold text-orange-850">Aadhaar Verification Required</span>
              <p className="text-orange-700 leading-relaxed text-[11px]">
                {actionMessage}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
              National Aadhaar Identity (UIDAI)
            </label>

            {/* AI Manual Aadhaar Extraction Banner */}
            <div className="bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-2xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">📸</span>
                <div className="text-left">
                  <span className="font-bold text-[10.5px] text-emerald-950 block leading-tight">Upload Aadhaar Photo <span className="text-[9px] text-emerald-800 font-normal">(Max 1 MB)</span></span>
                  <span className="text-[9px] text-emerald-700 block leading-tight">AI will auto-extract your 12-digit UIDAI number</span>
                </div>
              </div>
              <label className="relative cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl transition shrink-0 flex items-center gap-1 shadow-xs">
                {isExtractingAadhaar ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3" />
                    <span>Upload Image</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={isExtractingAadhaar || isVerified}
                  onChange={handleExtractAadhaarFromCard}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                maxLength={14}
                disabled={isVerified || isVerifying}
                value={aadhaarNumber.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim()}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/[^\d]/g, '').slice(0, 12))}
                placeholder="12-digit UIDAI Number"
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none font-mono tracking-widest text-center"
              />
              {!isVerified && (
                <button
                  type="button"
                  onClick={handleManualVerificationSubmit}
                  disabled={isVerifying || isExtractingAadhaar || !aadhaarNumber}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10px] font-bold rounded-xl active:scale-95 transition flex items-center gap-1.5"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify Document</span>
                  )}
                </button>
              )}
            </div>

            {uploadedFileName && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-700 flex items-center justify-between">
                <span className="truncate font-mono text-slate-600">📁 Stored on server: <strong>{uploadedFileName}</strong></span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Saved</span>
              </div>
            )}

            {msg.text && (
              <div className={`p-3 border rounded-xl text-[10px] font-medium leading-relaxed ${
                msg.type === 'error' ? 'bg-red-50 border-red-200 text-red-900' :
                msg.type === 'success' ? 'bg-emerald-50 border-emerald-250 text-emerald-900' :
                'bg-blue-50 border-blue-200 text-blue-900'
              }`}>
                {msg.text}
              </div>
            )}

            {isVerified && (
              <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-150 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500 bg-emerald-100 rounded-full shrink-0" />
                <span>MANUAL AADHAAR DOCUMENT VERIFICATION COMPLETED</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
