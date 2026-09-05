import React, { useState, useEffect } from 'react';
import { SpecialistClaimRequest } from '../types.ts';
import { 
  X, ShieldCheck, CheckCircle2, XCircle, Eye, 
  Search, FileText, Phone, Mail, Award, Clock, RefreshCw, AlertCircle
} from 'lucide-react';
import { fetchAllSpecialistClaims, approveSpecialistClaim, rejectSpecialistClaim } from '../utils/specialistClaims.ts';

interface SpecialistClaimsAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminEmail: string;
  onClaimApproved?: (specialistId: string, applicantEmail: string) => void;
}

export default function SpecialistClaimsAdminModal({
  isOpen,
  onClose,
  adminEmail,
  onClaimApproved
}: SpecialistClaimsAdminModalProps) {
  const [claims, setClaims] = useState<SpecialistClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<SpecialistClaimRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [previewIdUrl, setPreviewIdUrl] = useState<string | null>(null);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const data = await fetchAllSpecialistClaims();
      setClaims(data);
    } catch (err) {
      console.warn('Error loading claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadClaims();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApprove = async (claim: SpecialistClaimRequest) => {
    setProcessingId(claim.id);
    setActionMessage(null);
    try {
      const res = await approveSpecialistClaim(claim.id, adminEmail);
      if (res.success) {
        setActionMessage(`✓ Claim approved! Portfolio linked to ${claim.applicantEmail}`);
        setClaims(prev => prev.map(c => c.id === claim.id ? { ...c, status: 'approved', reviewedBy: adminEmail, reviewedAt: new Date().toISOString() } : c));
        if (onClaimApproved) {
          onClaimApproved(claim.specialistId, claim.applicantEmail);
        }
      }
    } catch (err) {
      setActionMessage('Failed to approve claim. Please retry.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (claim: SpecialistClaimRequest) => {
    const reason = prompt('Please enter the rejection reason (e.g. ID card mismatch, invalid council registration number):', 'Registration number verification failed');
    if (!reason) return;

    setProcessingId(claim.id);
    setActionMessage(null);
    try {
      const res = await rejectSpecialistClaim(claim.id, adminEmail, reason);
      if (res.success) {
        setActionMessage(`Claim rejected.`);
        setClaims(prev => prev.map(c => c.id === claim.id ? { ...c, status: 'rejected', rejectionReason: reason, reviewedBy: adminEmail, reviewedAt: new Date().toISOString() } : c));
      }
    } catch (err) {
      setActionMessage('Failed to reject claim.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredClaims = claims.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.specialistName.toLowerCase().includes(q) ||
        c.applicantName.toLowerCase().includes(q) ||
        c.applicantEmail.toLowerCase().includes(q) ||
        c.applicantPhone.includes(q) ||
        c.registrationNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = claims.filter(c => c.status === 'pending').length;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Specialist Portfolio Claims Verification Desk</h3>
              <p className="text-xs text-slate-400">
                Verify Medical Council IDs and link doctor profiles to user accounts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadClaims}
              type="button"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Message */}
        {actionMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2 text-xs text-emerald-800 font-bold flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-emerald-600 hover:text-emerald-900">✕</button>
          </div>
        )}

        {/* Filter Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {(['pending', 'approved', 'rejected', 'all'] as const).map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition border cursor-pointer ${
                  filterStatus === status 
                    ? 'bg-slate-900 border-slate-900 text-white' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {status} {status === 'pending' && pendingCount > 0 && `(${pendingCount})`}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by doctor, email, reg no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Claims List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
              Loading specialist claims...
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No {filterStatus !== 'all' ? filterStatus : ''} claim requests found.
            </div>
          ) : (
            filteredClaims.map((claim) => (
              <div 
                key={claim.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900">
                      {claim.specialistName}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100">
                      {claim.specialistCategory}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      claim.status === 'approved' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : claim.status === 'rejected' 
                        ? 'bg-rose-100 text-rose-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      ● {claim.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1 font-bold text-slate-800">
                      Applicant: {claim.applicantName}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Mail className="w-3 h-3 text-slate-400" /> {claim.applicantEmail}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 font-mono">
                      <Phone className="w-3 h-3 text-slate-400" /> {claim.applicantPhone}
                    </span>
                    <span className="flex items-center gap-1 text-slate-700 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                      <Award className="w-3 h-3 text-amber-600" /> Reg: {claim.registrationNumber}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-3">
                    <span>Submitted: {new Date(claim.submittedAt).toLocaleDateString()} at {new Date(claim.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {claim.specialistHospital && <span>• {claim.specialistHospital}</span>}
                  </div>

                  {claim.rejectionReason && (
                    <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                      Rejection Reason: {claim.rejectionReason}
                    </div>
                  )}
                </div>

                {/* ID Card preview and approval action */}
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0">
                  {claim.idCardDocUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewIdUrl(claim.idCardDocUrl)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" /> View ID Card
                    </button>
                  )}

                  {claim.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleReject(claim)}
                        disabled={processingId === claim.id}
                        className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(claim)}
                        disabled={processingId === claim.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve &amp; Link
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Full Image Preview Modal */}
        {previewIdUrl && (
          <div 
            className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewIdUrl(null)}
          >
            <div 
              className="bg-white p-4 rounded-3xl max-w-xl w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewIdUrl(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
              >
                ✕
              </button>
              <h4 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-600" /> Doctor ID / Registration Proof
              </h4>
              <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                {previewIdUrl.startsWith('data:image') ? (
                  <img src={previewIdUrl} alt="Uploaded ID" className="max-w-full h-auto rounded-lg" />
                ) : (
                  <iframe src={previewIdUrl} title="Document" className="w-full h-96" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
