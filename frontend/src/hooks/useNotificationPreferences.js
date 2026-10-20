import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/useAuth';

const defaults = { applicationStatus: true, scholarshipUpdates: true, entranceExamUpdates: true, announcements: true };

export default function useNotificationPreferences() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState(defaults);
  const [notificationSaved, setNotificationSaved] = useState(false);
  const [notificationError, setNotificationError] = useState('');
  const [notificationBusy, setNotificationBusy] = useState(true);
  const revision = useRef(0);
  const busy = useRef(true);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const request = ++generation.current;
    busy.current = true; setNotificationBusy(true); setNotificationError('');
    try {
      const response = await api.get('/notification-preferences', { headers: { Authorization: `Bearer ${token}` } });
      if (request !== generation.current) return;
      setNotifications(response.data.data.preferences); revision.current = response.data.data.revision;
      busy.current = false; setNotificationBusy(false);
    } catch {
      if (request !== generation.current) return;
      setNotificationError('Unable to load preferences. Reload preferences to try again.');
      // Keep saving/toggling blocked until the saved revision is known.
    }
  }, [token]);
  useEffect(() => {
    let active = true;
    const requests = generation;
    queueMicrotask(() => { if (active) load(); });
    return () => { active = false; requests.current++; };
  }, [load, user?.id]);
  const handleNotificationChange = key => {
    if (busy.current) return;
    setNotifications(current => ({ ...current, [key]: !current[key] })); setNotificationSaved(false);
  };
  const handleSaveNotifications = async () => {
    if (busy.current) return;
    busy.current = true; setNotificationBusy(true); setNotificationError(''); setNotificationSaved(false);
    const request = generation.current;
    try {
      const response = await api.put('/notification-preferences', { preferences: notifications, revision: revision.current }, { headers: { Authorization: `Bearer ${token}` }, skipGlobalRefresh: true });
      if (request !== generation.current) return;
      revision.current = response.data.data.revision; setNotificationSaved(true);
    } catch (error) {
      if (request !== generation.current) return;
      setNotificationError(error.response?.status === 409 ? 'Another session changed your preferences. Reload preferences before saving again.' : 'Preferences were not saved. Please try again.');
      if (error.response?.status === 409) { busy.current = true; return; }
    } finally {
      if (request === generation.current && !busy.current) setNotificationBusy(false);
    }
    if (request === generation.current) { busy.current = false; setNotificationBusy(false); }
  };
  return { notifications, notificationSaved, setNotificationSaved, notificationError, notificationBusy, handleNotificationChange, handleSaveNotifications, reloadNotifications: load };
}
