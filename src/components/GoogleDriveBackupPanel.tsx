import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Cloud, 
  CheckCircle, 
  AlertTriangle, 
  RotateCw, 
  Trash2, 
  Download, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Calendar, 
  Clock, 
  Database, 
  Users, 
  ExternalLink, 
  Check, 
  X, 
  Layers, 
  RefreshCcw, 
  Zap, 
  FolderOpen, 
  Code, 
  FileCode, 
  Archive, 
  Search, 
  Copy, 
  Terminal, 
  PackageCheck,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  getDriveAccountInfo, 
  getValidDriveAccessToken, 
  createManualPermanentBackup, 
  createDailyRollingBackup, 
  listDriveBackups, 
  fetchDriveBackupContent, 
  deleteDriveBackupFile, 
  restoreFullAppFromSnapshot, 
  downloadBackupLocally, 
  fetchCodebaseBundle,
  exportCodebaseToGoogleDrive,
  exportMasterArchiveToGoogleDrive,
  downloadCodebaseLocally,
  downloadMasterArchiveLocally,
  DriveBackupFile, 
  FullAppBackupSnapshot,
  CodebaseBundle,
  CodebaseFileEntry
} from '../services/googleDriveBackup.ts';
import { getGoogleAccessToken, setGoogleAccessToken, triggerGoogleSignIn } from '../utils/firebase.ts';

interface GoogleDriveBackupPanelProps {
  isSuperAdmin?: boolean;
}

export default function GoogleDriveBackupPanel({ isSuperAdmin = true }: GoogleDriveBackupPanelProps) {
  // Connection state
  const [driveAccount, setDriveAccount] = useState<{ email: string; name: string; photo?: string } | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Backup files list state
  const [backupFiles, setBackupFiles] = useState<DriveBackupFile[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState<boolean>(false);

  // Action states
  const [isCreatingManual, setIsCreatingManual] = useState<boolean>(false);
  const [manualNote, setManualNote] = useState<string>('');
  const [isCreatingDaily, setIsCreatingDaily] = useState<boolean>(false);
  const [isExportingCodebase, setIsExportingCodebase] = useState<boolean>(false);
  const [isExportingMaster, setIsExportingMaster] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Codebase Inspector Modal state
  const [isCodebaseModalOpen, setIsCodebaseModalOpen] = useState<boolean>(false);
  const [isLoadingCodebase, setIsLoadingCodebase] = useState<boolean>(false);
  const [codebaseBundle, setCodebaseBundle] = useState<CodebaseBundle | null>(null);
  const [selectedFile, setSelectedFile] = useState<CodebaseFileEntry | null>(null);
  const [searchCodeQuery, setSearchCodeQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [copiedFilePath, setCopiedFilePath] = useState<string | null>(null);

  // Auto-backup configuration state
  const [autoDailyEnabled, setAutoDailyEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vernunt_auto_daily_drive_backup') !== 'false';
    } catch (_) {
      return true;
    }
  });
  const [lastDailyDate, setLastDailyDate] = useState<string | null>(() => {
    try {
      return localStorage.getItem('vernunt_last_daily_drive_backup_date');
    } catch (_) {
      return null;
    }
  });
  const [lastDailyTime, setLastDailyTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem('vernunt_last_daily_drive_backup_time');
    } catch (_) {
      return null;
    }
  });

  // Restore Modal State
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<DriveBackupFile | null>(null);
  const [restoreSnapshotData, setRestoreSnapshotData] = useState<FullAppBackupSnapshot | null>(null);
  const [isFetchingRestoreDetails, setIsFetchingRestoreDetails] = useState<boolean>(false);
  const [isExecutingRestore, setIsExecutingRestore] = useState<boolean>(false);
  const [restoreSuccessStats, setRestoreSuccessStats] = useState<{ count: number; errors: string[] } | null>(null);

  // Delete Confirmation State
  const [fileToDelete, setFileToDelete] = useState<DriveBackupFile | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState<boolean>(false);

  // Initial Load: Check token & load backups if connected
  useEffect(() => {
    checkConnectionAndLoad();
  }, []);

  const checkConnectionAndLoad = async () => {
    setIsLoadingBackups(true);
    try {
      const account = await getDriveAccountInfo();
      setDriveAccount(account);
      if (account) {
        const files = await listDriveBackups();
        setBackupFiles(files);
      }
    } catch (err: any) {
      console.warn('Google Drive Backup load note:', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  // Connect Google Drive
  const handleConnectDrive = async () => {
    setIsConnecting(true);
    setAuthError(null);
    try {
      const token = await getValidDriveAccessToken(true);
      if (token) {
        const account = await getDriveAccountInfo();
        setDriveAccount(account);
        const files = await listDriveBackups();
        setBackupFiles(files);
        showSuccess('Google Drive connected successfully! You can now create and manage backups.');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to authenticate with Google Drive. Please check permissions.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Google Drive
  const handleDisconnectDrive = () => {
    setGoogleAccessToken(null);
    setDriveAccount(null);
    setBackupFiles([]);
    showSuccess('Google Drive disconnected.');
  };

  const showSuccess = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  // 1. Trigger Manual Permanent Backup
  const handleCreateManualBackup = async () => {
    setIsCreatingManual(true);
    setAuthError(null);
    try {
      const { file, snapshot } = await createManualPermanentBackup(manualNote);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      showSuccess(`Permanent Backup "${file.name}" successfully uploaded to Google Drive! (${snapshot.metadata.stats.totalDocuments} total records preserved).`);
      setManualNote('');
      // Reload backups
      const files = await listDriveBackups();
      setBackupFiles(files);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to create manual backup in Google Drive');
    } finally {
      setIsCreatingManual(false);
    }
  };

  // 2. Trigger Daily Rolling Backup (Delete Yesterday, Update Today)
  const handleCreateDailyBackup = async () => {
    setIsCreatingDaily(true);
    setAuthError(null);
    try {
      const { file, snapshot, purgedFiles } = await createDailyRollingBackup();
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      
      const purgeMsg = purgedFiles.length > 0 
        ? ` (Automatically deleted ${purgedFiles.length} yesterday/older daily backup)` 
        : '';

      showSuccess(`Today's Daily Rolling Backup "${file.name}" saved to Google Drive!${purgeMsg}`);
      
      setLastDailyDate(snapshot.metadata.backupDate);
      setLastDailyTime(snapshot.metadata.createdAt);
      
      // Reload backups
      const files = await listDriveBackups();
      setBackupFiles(files);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to run daily rolling backup');
    } finally {
      setIsCreatingDaily(false);
    }
  };

  // Open Restore Modal and preview snapshot contents
  const handleOpenRestoreModal = async (file: DriveBackupFile) => {
    setSelectedBackupForRestore(file);
    setIsFetchingRestoreDetails(true);
    setRestoreSuccessStats(null);
    try {
      const snapshot = await fetchDriveBackupContent(file.id);
      setRestoreSnapshotData(snapshot);
    } catch (err: any) {
      setAuthError(`Failed to load backup details: ${err?.message || err}`);
      setSelectedBackupForRestore(null);
    } finally {
      setIsFetchingRestoreDetails(false);
    }
  };

  // Execute Restore
  const handleExecuteRestore = async () => {
    if (!restoreSnapshotData) return;
    setIsExecutingRestore(true);
    try {
      const result = await restoreFullAppFromSnapshot(restoreSnapshotData);
      setRestoreSuccessStats(result);
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
      showSuccess(`Successfully restored ${result.restoredCount} database records from Google Drive backup!`);
    } catch (err: any) {
      setAuthError(`Restore failed: ${err?.message || err}`);
    } finally {
      setIsExecutingRestore(false);
    }
  };

  // Delete Backup File
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeletingFile(true);
    try {
      await deleteDriveBackupFile(fileToDelete.id);
      showSuccess(`Backup "${fileToDelete.name}" permanently deleted from Google Drive.`);
      setFileToDelete(null);
      // Refresh list
      const files = await listDriveBackups();
      setBackupFiles(files);
    } catch (err: any) {
      setAuthError(`Failed to delete backup: ${err?.message || err}`);
    } finally {
      setIsDeletingFile(false);
    }
  };

  // Toggle Auto Daily Backup
  const handleToggleAutoDaily = () => {
    const nextVal = !autoDailyEnabled;
    setAutoDailyEnabled(nextVal);
    try {
      localStorage.setItem('vernunt_auto_daily_drive_backup', String(nextVal));
    } catch (e) {
      console.debug('Auto backup pref write note:', e);
    }
    showSuccess(`Automated Daily Backup ${nextVal ? 'Enabled' : 'Disabled'}.`);
  };

  // 3. Export Full Codebase directly to Google Drive
  const handleExportCodebaseToDrive = async () => {
    setIsExportingCodebase(true);
    setAuthError(null);
    try {
      const { file, bundle } = await exportCodebaseToGoogleDrive(true, manualNote || 'Manual Full Codebase Snapshot');
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      showSuccess(`✓ Full Codebase (${bundle.manifest.totalFiles} files, ${bundle.manifest.totalLinesOfCode} lines of code) successfully uploaded to Google Drive as "${file.name}"!`);
      // Refresh list
      const files = await listDriveBackups();
      setBackupFiles(files);
    } catch (err: any) {
      setAuthError(`Codebase export failed: ${err?.message || err}`);
    } finally {
      setIsExportingCodebase(false);
    }
  };

  // 4. Export Master Archive (Codebase + Full Database) to Google Drive
  const handleExportMasterArchiveToDrive = async () => {
    setIsExportingMaster(true);
    setAuthError(null);
    try {
      const { file, masterSnapshot } = await exportMasterArchiveToGoogleDrive(manualNote || 'Master Monolithic Recovery Snapshot');
      confetti({ particleCount: 140, spread: 100, origin: { y: 0.5 } });
      showSuccess(`✓ Master Snapshot (${masterSnapshot.summary.totalFiles} code files + ${masterSnapshot.summary.totalDocuments} database records) saved to Google Drive as "${file.name}"!`);
      // Refresh list
      const files = await listDriveBackups();
      setBackupFiles(files);
    } catch (err: any) {
      setAuthError(`Master export failed: ${err?.message || err}`);
    } finally {
      setIsExportingMaster(false);
    }
  };

  // Open Live Codebase Inspector
  const handleOpenCodebaseInspector = async () => {
    setIsCodebaseModalOpen(true);
    setIsLoadingCodebase(true);
    try {
      const bundle = await fetchCodebaseBundle();
      setCodebaseBundle(bundle);
      if (bundle.files.length > 0) {
        setSelectedFile(bundle.files[0]);
      }
    } catch (err: any) {
      setAuthError(`Failed to load codebase structure: ${err?.message || err}`);
      setIsCodebaseModalOpen(false);
    } finally {
      setIsLoadingCodebase(false);
    }
  };

  // Download codebase JSON locally
  const handleDownloadCodebaseDirect = async () => {
    try {
      const bundle = await fetchCodebaseBundle();
      downloadCodebaseLocally(bundle);
      showSuccess(`✓ Codebase bundle (${bundle.manifest.totalFiles} files) downloaded to your computer!`);
    } catch (err: any) {
      setAuthError(`Download failed: ${err?.message || err}`);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = (file: CodebaseFileEntry) => {
    try {
      navigator.clipboard.writeText(file.content);
      setCopiedFilePath(file.path);
      setTimeout(() => setCopiedFilePath(null), 2000);
    } catch (e) {
      console.debug('Copy note:', e);
    }
  };

  return (
    <div id="google-drive-backup-panel" className="space-y-6 text-left">
      
      {/* Top Banner & Status Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
                <HardDrive className="w-6 h-6 text-indigo-400" />
              </span>
              <div>
                <h3 className="text-xl font-bold font-serif text-white flex items-center gap-2">
                  <span>Google Drive Cloud Backup & Disaster Recovery</span>
                </h3>
                <p className="text-xs text-indigo-200/80">
                  Full Firestore database collections, user profiles, events, and platform state backup
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              Supports <strong className="text-white">Permanent Manual Snapshots</strong> (preserved indefinitely in your Drive) and <strong className="text-white">Automated Daily Rolling Backups</strong> (which purge yesterday's copy and update with today's snapshot).
            </p>
          </div>

          {/* Connection Status & Account Info */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 min-w-[280px] shrink-0 space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-indigo-300" />
                <span>Drive Status</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                driveAccount ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40' : 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${driveAccount ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                {driveAccount ? 'Connected' : 'Not Connected'}
              </span>
            </div>

            {driveAccount ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  {driveAccount.photo ? (
                    <img src={driveAccount.photo} alt="Avatar" className="w-7 h-7 rounded-full border border-white/30" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs">
                      {driveAccount.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="font-bold text-white truncate text-[11.5px]">{driveAccount.name}</p>
                    <p className="text-[10px] text-slate-300 truncate">{driveAccount.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={checkConnectionAndLoad}
                    disabled={isLoadingBackups}
                    className="flex-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RefreshCcw className={`w-3 h-3 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                    <span>Sync Drive</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectDrive}
                    className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/30 rounded-xl text-[11px] font-bold transition cursor-pointer"
                  >
                    Unlink
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-300">
                  Connect your Google Account to enable automatic Drive backups.
                </p>
                <button
                  type="button"
                  id="btn-connect-google-drive"
                  onClick={handleConnectDrive}
                  disabled={isConnecting}
                  className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isConnecting ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Authorizing Drive...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4" />
                      <span>Authorize Google Drive</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success / Error Banners */}
      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button type="button" onClick={() => setActionSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {authError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{authError}</span>
          </div>
          <button type="button" onClick={() => setAuthError(null)} className="text-rose-600 hover:text-rose-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* The Primary Backup & Codebase Strategy Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* CARD 1: Manual Permanent Full Database Backup */}
        <div className="bg-white rounded-3xl p-6 border-2 border-indigo-100 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-700">
                <Lock className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1 border border-indigo-200">
                <ShieldCheck className="w-3 h-3 text-indigo-600" />
                Permanent Snapshot
              </span>
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-800 font-serif">1. Manual Database Backup</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Creates an immutable snapshot of all Firestore database collections, user profiles, chat history, and system settings.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Protected Retention Policy:
                </span>
                <span className="text-indigo-700 font-extrabold">Permanent (No Auto-Delete)</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                This backup will <strong className="text-slate-700">never</strong> be deleted by automated routines. It remains in Google Drive indefinitely until you manually delete it.
              </p>
            </div>

            {/* Optional Note Field */}
            <div className="space-y-1">
              <label htmlFor="manual-backup-note" className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Backup Label / Milestone Note (Optional)
              </label>
              <input
                id="manual-backup-note"
                type="text"
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder="e.g. Pre-Upgrade Full Milestone Snapshot"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="button"
            id="btn-create-manual-backup"
            onClick={handleCreateManualBackup}
            disabled={isCreatingManual || !driveAccount}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              !driveAccount
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white shadow-indigo-200'
            }`}
          >
            {isCreatingManual ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-white" />
                <span>Capturing Snapshot & Uploading to Drive...</span>
              </>
            ) : (
              <>
                <HardDrive className="w-4 h-4 text-white" />
                <span>Create Permanent Database Backup</span>
              </>
            )}
          </button>
        </div>

        {/* CARD 2: Daily Automated Rolling Backup (Delete Yesterday, Update Today) */}
        <div className="bg-white rounded-3xl p-6 border-2 border-emerald-100 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700">
                <RefreshCcw className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1 border border-emerald-200">
                <Zap className="w-3 h-3 text-emerald-600" />
                Daily Rolling Mode
              </span>
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-800 font-serif">2. Daily Rolling Auto-Backup</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Executes every day. Saves today's full database snapshot and <strong className="text-slate-700">automatically purges yesterday's backup file</strong> to keep your cloud storage clean.
              </p>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1 text-emerald-900">
                  <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
                  Rolling Retention Logic:
                </span>
                <span className="text-emerald-800 font-extrabold">Delete Yesterday & Save Today</span>
              </div>
              
              <div className="text-[10px] text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Last Daily Backup Run:</span>
                  <strong className="text-slate-800">
                    {lastDailyDate ? `${lastDailyDate} (${new Date(lastDailyTime || '').toLocaleTimeString()})` : 'Not run today'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Daily Scheduler:</span>
                  <span className="font-extrabold text-emerald-700">Active (Checks on boot & daily)</span>
                </div>
              </div>
            </div>

            {/* Auto Schedule Switch */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">Automated Daily Sync</p>
                <p className="text-[10px] text-slate-500">Run automatically once per calendar day</p>
              </div>
              <button
                type="button"
                onClick={handleToggleAutoDaily}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${
                  autoDailyEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition"></div>
              </button>
            </div>
          </div>

          <button
            type="button"
            id="btn-run-daily-backup-now"
            onClick={handleCreateDailyBackup}
            disabled={isCreatingDaily || !driveAccount}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              !driveAccount
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-emerald-200'
            }`}
          >
            {isCreatingDaily ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-white" />
                <span>Running Daily Backup & Purging Yesterday's File...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-white" />
                <span>Run Today's Daily Backup Now</span>
              </>
            )}
          </button>
        </div>

        {/* CARD 3: FULL CODEBASE EXPORT TO GOOGLE DRIVE */}
        <div className="bg-white rounded-3xl p-6 border-2 border-violet-100 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="p-2.5 bg-violet-50 border border-violet-200 rounded-2xl text-violet-700">
                <Code className="w-5 h-5 text-violet-600" />
              </div>
              <span className="px-2.5 py-1 bg-violet-100 text-violet-800 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1 border border-violet-200">
                <FileCode className="w-3 h-3 text-violet-600" />
                Full Source Code
              </span>
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-800 font-serif">3. Export Full Codebase to Google Drive</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Bundles every source code file, React components, Express server, styling, and configuration manifests into a structured snapshot and exports directly to your Google Drive.
              </p>
            </div>

            <div className="p-3 bg-violet-50/70 rounded-2xl border border-violet-200/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-violet-900">
                <span className="flex items-center gap-1">
                  <PackageCheck className="w-3.5 h-3.5 text-violet-600" />
                  Code Tree Coverage:
                </span>
                <span className="text-violet-800 font-extrabold">100% Full Project Source</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Includes all <code className="text-violet-700 font-mono">src/**/*</code>, backend <code className="text-violet-700 font-mono">server.ts</code>, <code className="text-violet-700 font-mono">package.json</code>, and Firestore security rules.
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenCodebaseInspector}
                className="flex-1 py-2 px-3 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl font-bold text-[11px] transition flex items-center justify-center gap-1.5 border border-violet-200 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Explore Code Files</span>
              </button>
              <a
                id="btn-download-tar-archive-direct"
                href="/api/codebase/download-archive"
                download="vernunt-codebase.tar.gz"
                className="py-2 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-[11px] transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                title="Download complete .tar.gz source archive for Cloud Run / Cloud Shell"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Download Archive (.tar.gz)</span>
              </a>
              <button
                type="button"
                onClick={handleDownloadCodebaseDirect}
                className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] transition flex items-center justify-center gap-1 border border-slate-200 cursor-pointer"
                title="Download JSON code bundle to local disk"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.JSON</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            id="btn-export-codebase-to-drive"
            onClick={handleExportCodebaseToDrive}
            disabled={isExportingCodebase || !driveAccount}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              !driveAccount
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-700 active:scale-98 text-white shadow-violet-200'
            }`}
          >
            {isExportingCodebase ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-white" />
                <span>Bundling Codebase & Uploading to Google Drive...</span>
              </>
            ) : (
              <>
                <Code className="w-4 h-4 text-white" />
                <span>Export Full Codebase to Google Drive Now</span>
              </>
            )}
          </button>
        </div>

        {/* CARD 4: MASTER FULL APP & CODEBASE MONOLITHIC ARCHIVE */}
        <div className="bg-white rounded-3xl p-6 border-2 border-amber-100 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700">
                <Archive className="w-5 h-5 text-amber-600" />
              </div>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1 border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Code + Database Master
              </span>
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-800 font-serif">4. Master Monolithic Snapshot (Code + Data)</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Combines both your entire source codebase repository and complete live Firestore database state into one master disaster recovery package saved in Google Drive.
              </p>
            </div>

            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  Dual-Tier Preservation:
                </span>
                <span className="text-amber-800 font-extrabold">All Source Files + Database Docs</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                The ultimate one-click disaster recovery package to restore everything from scratch at any future point in time.
              </p>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Saved permanently to Google Drive under <code className="text-slate-700 font-mono text-[10px]">Vernunt_MASTER_FULL_APP_AND_CODE_*.json</code>.
            </p>
          </div>

          <button
            type="button"
            id="btn-export-master-archive-to-drive"
            onClick={handleExportMasterArchiveToDrive}
            disabled={isExportingMaster || !driveAccount}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              !driveAccount
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 active:scale-98 text-white shadow-amber-200'
            }`}
          >
            {isExportingMaster ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-white" />
                <span>Creating Master Code & Data Archive in Drive...</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 text-white" />
                <span>Export Master Snapshot (Code + Database)</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Google Drive Archive Files Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-base font-bold text-slate-800 font-serif flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-amber-500" />
              <span>Google Drive Backup Archive Directory</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Live repository in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-[10px]">Vernunt Playdates App Backups - Official</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={checkConnectionAndLoad}
              disabled={isLoadingBackups || !driveAccount}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${isLoadingBackups ? 'animate-spin' : ''}`} />
              <span>Refresh List</span>
            </button>
          </div>
        </div>

        {/* Files List */}
        {!driveAccount ? (
          <div className="py-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Cloud className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Google Drive is not connected</p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Authorize Google Drive using the button above to view and manage existing cloud backups.
            </p>
          </div>
        ) : isLoadingBackups ? (
          <div className="py-12 text-center space-y-3">
            <RotateCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Querying Google Drive files...</p>
          </div>
        ) : backupFiles.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <HardDrive className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">No backup files found in Google Drive yet</p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Click "Create Permanent Manual Backup" or "Run Today's Daily Backup" to create your first cloud snapshot.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                  <th className="py-3 px-3 rounded-l-xl">Backup File & Type</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Size</th>
                  <th className="py-3 px-3">Retention Policy</th>
                  <th className="py-3 px-3">Contents</th>
                  <th className="py-3 px-3 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backupFiles.map((file) => {
                  const isPermanent = file.isPermanent;
                  const isCodebase = file.backupType === 'FULL_CODEBASE';
                  const isMaster = file.backupType === 'MASTER_FULL_ARCHIVE';
                  const isRolling = file.backupType === 'DAILY_ROLLING';

                  return (
                    <tr key={file.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* File Name & Type Badge */}
                      <td className="py-3 px-3">
                        <div className="space-y-1 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            {isCodebase ? (
                              <span className="p-1 bg-violet-100 text-violet-700 rounded-md">
                                <Code className="w-3.5 h-3.5" />
                              </span>
                            ) : isMaster ? (
                              <span className="p-1 bg-amber-100 text-amber-700 rounded-md">
                                <Archive className="w-3.5 h-3.5" />
                              </span>
                            ) : isPermanent ? (
                              <span className="p-1 bg-indigo-100 text-indigo-700 rounded-md">
                                <Lock className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="p-1 bg-emerald-100 text-emerald-700 rounded-md">
                                <RefreshCcw className="w-3.5 h-3.5" />
                              </span>
                            )}
                            <span className="font-bold text-slate-800 truncate font-mono text-[11px]" title={file.name}>
                              {file.name}
                            </span>
                          </div>
                          {file.note && (
                            <p className="text-[10px] text-slate-500 italic truncate">{file.note}</p>
                          )}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{new Date(file.createdTime).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(file.createdTime).toLocaleTimeString()}</span>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                        {file.size}
                      </td>

                      {/* Retention Policy Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isCodebase ? (
                          <span className="px-2 py-0.5 bg-violet-50 border border-violet-200 text-violet-700 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit">
                            <FileCode className="w-3 h-3 text-violet-500" />
                            Full Source Code
                          </span>
                        ) : isMaster ? (
                          <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Master Archive
                          </span>
                        ) : isPermanent ? (
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3 text-indigo-500" />
                            Permanent (Protected)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit">
                            <RotateCw className="w-3 h-3 text-emerald-500" />
                            Daily Rolling
                          </span>
                        )}
                      </td>

                      {/* Contents / Stats */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                        {isCodebase ? (
                          <span className="font-bold text-violet-700">Source Tree Archive</span>
                        ) : isMaster ? (
                          <span className="font-bold text-amber-700">Code + DB Bundle</span>
                        ) : (
                          <><span className="font-bold text-slate-800">{file.stats?.totalDocuments || 'Full'}</span> records</>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Restore Button for Database Snapshots */}
                          {!isCodebase && (
                            <button
                              type="button"
                              onClick={() => handleOpenRestoreModal(file)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-[10.5px] transition flex items-center gap-1 cursor-pointer"
                              title="Restore database and application state from this backup"
                            >
                              <Database className="w-3 h-3" />
                              <span>Restore DB</span>
                            </button>
                          )}

                          {/* Code Inspector Button for Codebase Snapshots */}
                          {isCodebase && (
                            <button
                              type="button"
                              onClick={handleOpenCodebaseInspector}
                              className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-lg font-bold text-[10.5px] transition flex items-center gap-1 cursor-pointer"
                              title="Inspect codebase files"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Inspect</span>
                            </button>
                          )}

                          {/* Download JSON Button */}
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const snapshot = await fetchDriveBackupContent(file.id);
                                downloadBackupLocally(snapshot, file.name);
                              } catch (err: any) {
                                setAuthError(`Download failed: ${err?.message || err}`);
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Download JSON to local computer"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* View in Drive */}
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Open in Google Drive"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setFileToDelete(file)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete this backup file from Google Drive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* RESTORE MODAL: Previews backup snapshot and safety checks */}
      {/* ============================================================ */}
      {selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 text-left">
            
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-2xl">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 font-serif">Restore App from Google Drive</h3>
                  <p className="text-xs text-slate-500">File: {selectedBackupForRestore.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedBackupForRestore(null);
                  setRestoreSnapshotData(null);
                  setRestoreSuccessStats(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isFetchingRestoreDetails ? (
              <div className="py-8 text-center space-y-2">
                <RotateCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Fetching backup archive data from Google Drive...</p>
              </div>
            ) : restoreSuccessStats ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>Restore Completed Successfully!</span>
                </div>
                <p className="text-xs text-emerald-700">
                  Successfully restored <strong>{restoreSuccessStats.count}</strong> total records into Firestore and local application state.
                </p>
                {restoreSuccessStats.errors.length > 0 && (
                  <div className="text-[10px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    <p className="font-bold">Warnings/Errors ({restoreSuccessStats.errors.length}):</p>
                    <ul className="list-disc pl-4 mt-1">
                      {restoreSuccessStats.errors.slice(0, 3).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBackupForRestore(null);
                    setRestoreSnapshotData(null);
                    setRestoreSuccessStats(null);
                    window.location.reload();
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-sm"
                >
                  Reload Application to View Restored State
                </button>
              </div>
            ) : restoreSnapshotData ? (
              <div className="space-y-4">
                
                {/* Warning Banner */}
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-800 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Restore Safety Verification</p>
                    <p className="text-[11px] leading-relaxed text-amber-700">
                      Restoring this backup will merge and update your Firestore database documents with the state captured on <strong>{new Date(restoreSnapshotData.metadata.createdAt).toLocaleString()}</strong>.
                    </p>
                  </div>
                </div>

                {/* Breakdown of items to be restored */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payload Breakdown:</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Profiles</span>
                      <strong className="text-slate-800 text-sm font-mono">{restoreSnapshotData.database.childProfiles?.length || 0}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Events</span>
                      <strong className="text-slate-800 text-sm font-mono">{restoreSnapshotData.database.community_events?.length || 0}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Chats</span>
                      <strong className="text-slate-800 text-sm font-mono">{restoreSnapshotData.database.chats?.length || 0}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Referrals</span>
                      <strong className="text-slate-800 text-sm font-mono">{restoreSnapshotData.database.referrals?.length || 0}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Banners</span>
                      <strong className="text-slate-800 text-sm font-mono">{restoreSnapshotData.database.banners?.length || 0}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Docs</span>
                      <strong className="text-indigo-700 text-sm font-mono">{restoreSnapshotData.metadata.stats.totalDocuments}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBackupForRestore(null);
                      setRestoreSnapshotData(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteRestore}
                    disabled={isExecutingRestore}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    {isExecutingRestore ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Restoring Database...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4" />
                        <span>Confirm & Execute Full Restore</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            ) : null}

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-left">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-600 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 font-serif">Delete Cloud Backup?</h4>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200 font-mono text-[11px] truncate">
              {fileToDelete.name}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingFile}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {isDeletingFile ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting from Drive...</span>
                  </>
                ) : (
                  <span>Delete Permanently</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CODEBASE INSPECTOR MODAL */}
      {/* ============================================================ */}
      {isCodebaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-5xl w-full h-[85vh] flex flex-col shadow-2xl border border-slate-200 text-left overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-100 text-violet-700 rounded-2xl">
                  <Code className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 font-serif flex items-center gap-2">
                    <span>Full Source Codebase Inspector</span>
                    {codebaseBundle && (
                      <span className="px-2 py-0.5 bg-violet-100 text-violet-800 text-[10px] font-mono font-bold rounded-full">
                        {codebaseBundle.manifest.totalFiles} Files • {codebaseBundle.manifest.totalLinesOfCode.toLocaleString()} Lines
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Explore all source files, components, services, and backend server before exporting to Google Drive
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCodebaseToDrive}
                  disabled={isExportingCodebase || !driveAccount}
                  className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isExportingCodebase ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5" />
                  )}
                  <span>Export to Google Drive</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCodebaseDirect}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCodebaseModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {isLoadingCodebase ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                <RotateCw className="w-8 h-8 text-violet-600 animate-spin" />
                <p className="text-xs font-bold text-slate-600">Scanning repository file tree and bundling source...</p>
              </div>
            ) : codebaseBundle ? (
              <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                
                {/* Left File Explorer List */}
                <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
                  {/* Search and Filters */}
                  <div className="p-3 border-b border-slate-200 space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search files..."
                        value={searchCodeQuery}
                        onChange={(e) => setSearchCodeQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
                      {['ALL', 'COMPONENTS', 'SERVICES', 'UTILS', 'CONFIGS', 'SERVER'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategoryFilter(cat)}
                          className={`px-2 py-0.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                            selectedCategoryFilter === cat
                              ? 'bg-violet-600 text-white'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Files List */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {codebaseBundle.files
                      .filter((f) => {
                        const matchesSearch = f.path.toLowerCase().includes(searchCodeQuery.toLowerCase());
                        if (!matchesSearch) return false;
                        if (selectedCategoryFilter === 'ALL') return true;
                        if (selectedCategoryFilter === 'COMPONENTS') return f.path.includes('components');
                        if (selectedCategoryFilter === 'SERVICES') return f.path.includes('services') || f.path.includes('api');
                        if (selectedCategoryFilter === 'UTILS') return f.path.includes('utils');
                        if (selectedCategoryFilter === 'CONFIGS') return f.path.endsWith('.json') || f.path.endsWith('.config.ts') || f.path.endsWith('.rules');
                        if (selectedCategoryFilter === 'SERVER') return f.path.includes('server.ts');
                        return true;
                      })
                      .map((f) => {
                        const isSelected = selectedFile?.path === f.path;
                        return (
                          <button
                            key={f.path}
                            type="button"
                            onClick={() => setSelectedFile(f)}
                            className={`w-full text-left p-2 rounded-xl text-xs transition flex items-center justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-violet-100 text-violet-900 font-bold border border-violet-300 shadow-xs'
                                : 'hover:bg-slate-200/70 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-violet-600' : 'text-slate-400'}`} />
                              <span className="truncate font-mono text-[11px]">{f.path}</span>
                            </div>
                            <span className="text-[9.5px] font-mono text-slate-400 shrink-0">
                              {f.lineCount}L
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Right Code Content Viewer */}
                <div className="flex-1 flex flex-col min-h-0 bg-slate-900 text-slate-100">
                  {selectedFile ? (
                    <>
                      {/* Code Viewer Toolbar */}
                      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-violet-400" />
                          <span className="font-mono text-violet-300 font-bold text-[11px]">{selectedFile.path}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({selectedFile.size} • {selectedFile.lineCount} lines)</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyCode(selectedFile)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          {copiedFilePath === selectedFile.path ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy File</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Code Lines Display */}
                      <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed selection:bg-violet-900/60 selection:text-white">
                        <pre className="text-slate-300 whitespace-pre font-mono text-[11px]">
                          {selectedFile.content}
                        </pre>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                      Select a file from the explorer to view its contents
                    </div>
                  )}
                </div>

              </div>
            ) : null}

          </div>
        </div>
      )}

    </div>
  );
}
