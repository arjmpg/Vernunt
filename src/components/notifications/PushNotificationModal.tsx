import React, { useState, useEffect } from 'react';
import { 
  Bell, BellRing, CheckCircle2, AlertTriangle, Smartphone, Apple, Laptop, 
  Send, RefreshCw, X, Shield, Sparkles, Copy, Check, Info, Calendar, HeartHandshake
} from 'lucide-react';
import { 
  getDevicePlatform, getPushPermissionState, requestPushPermissionAndGetToken,
  sendTestPushNotification, PushNotificationPayload, FcmTokenRegistration
} from '../../utils/fcmMessaging.ts';

interface PushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: any;
  onShowToast?: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
}

export default function PushNotificationModal({
  isOpen,
  onClose,
  userProfile,
  onShowToast
}: PushNotificationModalProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(getPushPermissionState());
  const [deviceInfo, setDeviceInfo] = useState(getDevicePlatform());
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [isSchedulingReminder, setIsSchedulingReminder] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);

  // Notification Preferences
  const [preferences, setPreferences] = useState({
    playdateRequests: true,
    playdateAccepted: true,
    eventReminders: true,
    communityAlerts: true
  });

  useEffect(() => {
    if (!isOpen) return;

    setPermission(getPushPermissionState());
    setDeviceInfo(getDevicePlatform());
    
    const savedToken = localStorage.getItem('vernunt_fcm_token') || '';
    setToken(savedToken);

    // Fetch recent notifications
    fetch('/api/fcm/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.notifications)) {
          setRecentNotifications(data.notifications.slice(0, 5));
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    setIsLoading(true);
    try {
      const result = await requestPushPermissionAndGetToken(
        userProfile?.id || 'guest',
        userProfile?.parentName || 'Vernunt Guardian'
      );

      setPermission(result.permission);
      if (result.success && result.token) {
        setToken(result.token);
        if (onShowToast) {
          onShowToast('Push Notifications Enabled', 'Your device is now subscribed to real-time playdate and event updates!', 'success');
        }
      } else if (result.error) {
        if (onShowToast) {
          onShowToast('Notification Setup', result.error, 'warning');
        }
      }
    } catch (e: any) {
      console.error('Push enable error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    setIsSendingTest(true);
    try {
      const res = await sendTestPushNotification(token);
      if (res.success) {
        if (onShowToast) {
          onShowToast('Test Push Dispatched', 'Check your device notification shade or top bar!', 'success');
        }
        // Refresh notifications
        const notifRes = await fetch('/api/fcm/notifications');
        const notifData = await notifRes.json();
        if (notifData.success) {
          setRecentNotifications(notifData.notifications.slice(0, 5));
        }
      }
    } catch (e) {
      console.error('Test push error:', e);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleScheduleDemoReminder = async () => {
    setIsSchedulingReminder(true);
    try {
      const res = await fetch('/api/fcm/schedule-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: 'demo-evt-reminder',
          eventTitle: 'Bangalore Kidathon & Science Fair',
          eventDate: 'Tomorrow',
          eventTime: '09:30 AM',
          eventVenue: 'Cubbon Park Activity Lawns',
          targetUserId: userProfile?.id || 'guest',
          delaySeconds: 5
        })
      });
      const data = await res.json();
      if (data.success) {
        if (onShowToast) {
          onShowToast('Reminder Scheduled', 'A live event reminder push will arrive on this device in 5 seconds!', 'info');
        }
      }
    } catch (e) {
      console.error('Schedule reminder error:', e);
    } finally {
      setIsSchedulingReminder(false);
    }
  };

  const handleCopyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 via-amber-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Push Notifications
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold uppercase tracking-wider">
                  FCM Real-Time
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Instant playdate alerts and event reminders on Android & iOS
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Device Detection & Permission Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {deviceInfo.isAndroid ? (
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                ) : deviceInfo.isIos ? (
                  <Apple className="w-5 h-5 text-slate-800" />
                ) : (
                  <Laptop className="w-5 h-5 text-indigo-600" />
                )}
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {deviceInfo.isAndroid ? 'Android Device (Native WebAPK / Chrome)' :
                     deviceInfo.isIos ? 'Apple iOS (Safari / Home Screen PWA)' :
                     'Desktop / Web Browser'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {deviceInfo.isPwa ? '✓ Installed PWA Mode Active' : 'Browser Web Session'}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {permission === 'granted' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Subscribed & Active
                  </span>
                ) : permission === 'denied' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Permission Blocked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                    <Bell className="w-3.5 h-3.5" />
                    Needs Permission
                  </span>
                )}
              </div>
            </div>

            {/* iOS PWA Guidance if on iPhone but not yet standalone */}
            {deviceInfo.isIos && !deviceInfo.isPwa && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-blue-800">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  How to receive lock-screen push alerts on iOS (iPhone / iPad):
                </div>
                <p className="text-blue-700">
                  Apple requires adding the app to your Home Screen for Web Push notifications (iOS 16.4+).
                </p>
                <div className="flex items-center gap-2 pt-1 font-semibold text-blue-900">
                  <span>1. Tap Share</span>
                  <span>➔</span>
                  <span>2. "Add to Home Screen"</span>
                  <span>➔</span>
                  <span>3. Open Vernunt from Home Screen</span>
                </div>
              </div>
            )}

            {/* Enable Button */}
            {permission !== 'granted' ? (
              <button
                onClick={handleEnablePush}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Connecting to Firebase Cloud Messaging...
                  </>
                ) : (
                  <>
                    <BellRing className="w-4 h-4" />
                    Turn On Push Notifications
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs text-slate-500">
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  FCM Token is active & syncing with backend
                </span>
                {token && (
                  <button
                    onClick={handleCopyToken}
                    className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-mono text-[11px] underline"
                  >
                    {copiedToken ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedToken ? 'Copied' : `${token.slice(0, 10)}...`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Preferences Toggles */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Notification Channels
            </h3>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Playdate Requests & Confirmations</div>
                    <div className="text-xs text-slate-500">Real-time alerts when matched parents invite or accept playdates</div>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={preferences.playdateRequests}
                  onChange={(e) => setPreferences({ ...preferences, playdateRequests: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Event Reminders & Ticket Alerts</div>
                    <div className="text-xs text-slate-500">Alerts 24 hours & 1 hour prior to booked community events and workshops</div>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={preferences.eventReminders}
                  onChange={(e) => setPreferences({ ...preferences, eventReminders: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Neighborhood Parent Radar</div>
                    <div className="text-xs text-slate-500">Nearby playmate updates in your neighborhood radius</div>
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={preferences.communityAlerts}
                  onChange={(e) => setPreferences({ ...preferences, communityAlerts: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                />
              </label>
            </div>
          </div>

          {/* Test Push Dispatcher */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-orange-600" />
                  Instant Live Test Controls
                </h4>
                <p className="text-xs text-slate-600">
                  Verify push notifications on your phone or computer right now
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleSendTestPush}
                disabled={isSendingTest}
                className="py-2.5 px-3 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                {isSendingTest ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-600" />
                ) : (
                  <BellRing className="w-3.5 h-3.5 text-orange-600" />
                )}
                Send Instant Test Push
              </button>

              <button
                onClick={handleScheduleDemoReminder}
                disabled={isSchedulingReminder}
                className="py-2.5 px-3 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                {isSchedulingReminder ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                )}
                Test 5s Event Reminder
              </button>
            </div>
          </div>

          {/* Recent Notifications Feed */}
          {recentNotifications.length > 0 && (
            <div className="space-y-2 pt-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Recent Dispatched Push Alerts
              </h3>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {recentNotifications.map((n, idx) => (
                  <div key={n.id || idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-2.5">
                    <span className="p-1 rounded-lg bg-orange-100 text-orange-700 flex-shrink-0 mt-0.5">
                      {n.type === 'playdate_request' || n.type === 'playdate_confirmed' ? (
                        <HeartHandshake className="w-3 h-3" />
                      ) : (
                        <Calendar className="w-3 h-3" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 truncate">{n.title}</div>
                      <div className="text-slate-600 line-clamp-1">{n.body}</div>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            End-to-End Encrypted via Firebase Cloud Messaging
          </div>
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
