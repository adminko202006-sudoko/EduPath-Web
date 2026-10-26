import { useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import { RouteActivityContext } from '../context/routeActivityContext';

export default function useOnlinePresence(userIds) {
  const { token, user } = useAuth();
  const isActive = useContext(RouteActivityContext);
  const ownerId = user?.id;
  const accountRole = user?.role;
  const key = [...new Set(userIds.filter((id) => Number.isInteger(Number(id)) && Number(id) > 0).map(Number))].sort((a, b) => a - b).join(',');
  const [snapshot, setSnapshot] = useState({ key: '', values: {}, checkedAt: 0, owner: null });
  useEffect(() => {
    if (!key || !token || accountRole !== 'admin' || !isActive) return;
    let active = true;
    let pending = false;
    const update = async () => {
      if (pending || document.visibilityState !== 'visible') return;
      pending = true;
      setSnapshot((current) => Date.now() - current.checkedAt > 90000 ? { key, values: {}, checkedAt: 0, owner: ownerId } : current);
      try {
        const ids = key.split(',').map(Number);
        const values = {};
        for (let start = 0; start < ids.length; start += 200) {
          const response = await api.get('/admin/presence', { params: { user_ids: ids.slice(start, start + 200) }, timeout: 8000 });
          Object.assign(values, response.data.data);
        }
        if (active) setSnapshot({ key, values, checkedAt: Date.now(), owner: ownerId });
      } catch (error) {
        if (active) setSnapshot({ key, values: {}, checkedAt: 0, owner: ownerId });
        if (import.meta.env.DEV) console.debug('Online indicators unavailable:', error.response?.status ?? 'network');
      }
      finally { pending = false; }
    };
    void update();
    const timer = window.setInterval(update, 30000);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('online', update);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', update); window.removeEventListener('online', update); };
  }, [key, token, accountRole, ownerId, isActive]);
  return snapshot.key === key && snapshot.owner === ownerId && accountRole === 'admin' ? snapshot.values : {};
}
