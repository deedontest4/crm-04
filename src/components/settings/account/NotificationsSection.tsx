import { useEffect, useRef, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlarmClock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotificationPrefs {
  email_notifications: boolean;
  in_app_notifications: boolean;
  push_notifications: boolean;
  lead_assigned: boolean;
  deal_updates: boolean;
  task_reminders: boolean;
  meeting_reminders: boolean;
  weekly_digest: boolean;
  notification_frequency: string;
  leads_notifications: boolean;
  contacts_notifications: boolean;
  accounts_notifications: boolean;
  daily_reminder_time: string;
}

interface NotificationsSectionProps {
  notificationPrefs: NotificationPrefs;
  setNotificationPrefs: React.Dispatch<React.SetStateAction<NotificationPrefs>>;
  userId: string;
  userTimezone?: string;
}

const TIME_OPTIONS = Array.from({ length: 33 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const hour12 = hours % 12 || 12;
  const ampm = hours < 12 ? 'AM' : 'PM';
  const label = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  return { value, label };
});

const ToggleChip = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-3 px-3 py-2 border rounded-lg bg-card min-w-0">
    <Label className="text-sm cursor-pointer truncate">{label}</Label>
    <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
  </div>
);

const NotificationsSection = ({ notificationPrefs, setNotificationPrefs, userId, userTimezone }: NotificationsSectionProps) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>(JSON.stringify(notificationPrefs));

  const saveNotificationPrefs = useCallback(async (prefs: NotificationPrefs) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          email_notifications: prefs.email_notifications,
          in_app_notifications: prefs.in_app_notifications,
          push_notifications: prefs.push_notifications,
          lead_assigned: prefs.lead_assigned,
          deal_updates: prefs.deal_updates,
          task_reminders: prefs.task_reminders,
          meeting_reminders: prefs.meeting_reminders,
          weekly_digest: prefs.weekly_digest,
          notification_frequency: prefs.notification_frequency,
          leads_notifications: prefs.leads_notifications,
          contacts_notifications: prefs.contacts_notifications,
          accounts_notifications: prefs.accounts_notifications,
          daily_reminder_time: prefs.daily_reminder_time,
          updated_at: new Date().toISOString()
        } as any, { onConflict: 'user_id' });
      if (error) throw error;
      lastSavedRef.current = JSON.stringify(prefs);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save notification preferences');
    }
  }, [userId]);

  useEffect(() => {
    const currentPrefs = JSON.stringify(notificationPrefs);
    if (currentPrefs === lastSavedRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveNotificationPrefs(notificationPrefs), 600);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [notificationPrefs, saveNotificationPrefs]);

  const updatePref = <K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Delivery & Frequency */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Delivery & Frequency</span>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleChip label="Email" checked={notificationPrefs.email_notifications} onChange={(v) => updatePref('email_notifications', v)} />
          <ToggleChip label="In-App" checked={notificationPrefs.in_app_notifications} onChange={(v) => updatePref('in_app_notifications', v)} />
          <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-card">
            <Label className="text-sm whitespace-nowrap">Frequency</Label>
            <Select value={notificationPrefs.notification_frequency} onValueChange={(v) => updatePref('notification_frequency', v)}>
              <SelectTrigger className="w-[110px] h-7 text-sm border-0 bg-muted/50 px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {notificationPrefs.task_reminders && (
            <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-card">
              <AlarmClock className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-sm whitespace-nowrap">Reminder</Label>
              <Select value={notificationPrefs.daily_reminder_time} onValueChange={(v) => updatePref('daily_reminder_time', v)}>
                <SelectTrigger className="w-[100px] h-7 text-sm border-0 bg-muted/50 px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {userTimezone && <span className="text-xs text-muted-foreground">({userTimezone})</span>}
            </div>
          )}
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Modules</span>
        <div className="grid grid-cols-3 gap-2">
          <ToggleChip label="Leads" checked={notificationPrefs.leads_notifications} onChange={(v) => updatePref('leads_notifications', v)} />
          <ToggleChip label="Contacts" checked={notificationPrefs.contacts_notifications} onChange={(v) => updatePref('contacts_notifications', v)} />
          <ToggleChip label="Accounts" checked={notificationPrefs.accounts_notifications} onChange={(v) => updatePref('accounts_notifications', v)} />
        </div>
      </div>

      {/* Events */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Events</span>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <ToggleChip label="Lead Assigned" checked={notificationPrefs.lead_assigned} onChange={(v) => updatePref('lead_assigned', v)} />
          <ToggleChip label="Deal Updates" checked={notificationPrefs.deal_updates} onChange={(v) => updatePref('deal_updates', v)} />
          <ToggleChip label="Action Reminders" checked={notificationPrefs.task_reminders} onChange={(v) => updatePref('task_reminders', v)} />
          <ToggleChip label="Meeting Reminders" checked={notificationPrefs.meeting_reminders} onChange={(v) => updatePref('meeting_reminders', v)} />
          <ToggleChip label="Weekly Digest" checked={notificationPrefs.weekly_digest} onChange={(v) => updatePref('weekly_digest', v)} />
        </div>
      </div>
    </div>
  );
};

export default NotificationsSection;
