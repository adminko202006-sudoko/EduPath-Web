import { useEffect, useState } from 'react';
import api from '../services/api';
import { subscribeRefresh } from '../services/refreshBus';
import { hasStaffPermission, staffAccessKey } from '../services/staffAccess';

// Pending applications are the new submissions awaiting review.
export default function useApplicationCounts(user, token) {
  const role = user?.role?.toLowerCase();
  const canAdmissions = role === 'admin' || (role === 'staff' && hasStaffPermission(user, 'manage_admissions'));
  const canScholarships = role === 'admin' || (role === 'staff' && hasStaffPermission(user, 'manage_scholarships'));
  const [snapshot, setSnapshot] = useState(null);
  const accountKey = token ? `${user?.id}:${role}:${canAdmissions}:${canScholarships}:${role === 'staff' ? staffAccessKey(user) : ''}` : null;

  useEffect(() => {
    if (!token || (!canAdmissions && !canScholarships)) return undefined;

    let disposed = false;
    let controller;
    const refresh = async () => {
      if (document.visibilityState === 'hidden') return;
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await api.get(`/${role}/application-counts`, { signal: controller.signal });
        const data = response.data.data;
        if (!disposed) {
          setSnapshot({
            accountKey,
            admissions: canAdmissions ? Number(data.pending_applications) || 0 : 0,
            scholarships: canScholarships ? Number(data.pending_scholarship_applications) || 0 : 0,
          });
        }
      } catch (error) {
        if (!disposed && error.code !== 'ERR_CANCELED') {
          console.error('Unable to refresh application badges:', error);
        }
      }
    };

    void refresh();
    const unsubscribe = subscribeRefresh(refresh);
    const interval = window.setInterval(refresh, 30000);
    return () => {
      disposed = true;
      controller?.abort();
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [accountKey, role, token, canAdmissions, canScholarships]);

  return snapshot?.accountKey === accountKey ? snapshot : { admissions: 0, scholarships: 0 };
}
