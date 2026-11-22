import * as Notifications from 'expo-notifications';
import i18n from './i18n';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const OFFSETS = [
  { tag: '24h', ms: 24 * 3600 * 1000, key: 'reminder.tomorrow' },
  { tag: '1h', ms: 3600 * 1000, key: 'reminder.soon' },
] as const;

async function ensurePermission() {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/**
 * Local reminders 24 h and 1 h before a meeting. Scheduled on this device
 * whenever the member RSVPs "going" or opens the meeting list.
 */
export async function scheduleMeetingReminders(meeting: { id: string; title: string; starts_at: string }) {
  try {
    await cancelMeetingReminders(meeting.id);
    if (!(await ensurePermission())) return;
    const start = new Date(meeting.starts_at).getTime();
    for (const o of OFFSETS) {
      const at = start - o.ms;
      if (at <= Date.now() + 5000) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: `meeting-${meeting.id}-${o.tag}`,
        content: { title: meeting.title, body: i18n.t(o.key) as unknown as string },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
      });
    }
  } catch {
    // Notifications are best-effort (unsupported in some simulators / Expo Go builds).
  }
}

export async function cancelMeetingReminders(meetingId: string) {
  try {
    for (const o of OFFSETS) {
      await Notifications.cancelScheduledNotificationAsync(`meeting-${meetingId}-${o.tag}`);
    }
  } catch {
    // ignore
  }
}
