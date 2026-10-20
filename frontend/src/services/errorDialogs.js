// Keep one error in front of the user; retain later failures until acknowledged.
export function createErrorDialogStore() {
  const entries = new Map();
  const listeners = new Set();
  let snapshot = [];
  const emit = () => {
    snapshot = [...entries.values()].filter(entry => !entry.dismissed);
    listeners.forEach(listener => listener());
  };
  return {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    getSnapshot: () => snapshot,
    publish(id, message, content = null) {
      if (!message) { if (entries.delete(id)) emit(); return; }
      const previous = entries.get(id);
      entries.set(id, { id, message, content, dismissed: previous?.message === message && previous.dismissed });
      emit();
    },
    remove(id) { if (entries.delete(id)) emit(); },
    reopen(id) {
      const entry = entries.get(id);
      if (entry) { entry.dismissed = false; emit(); }
    },
    dismiss(id) {
      const entry = entries.get(id);
      if (!entry) return;
      // Multiple components can report the same failed request. Acknowledge it once.
      for (const [key, item] of entries) {
        if (item.message !== entry.message) continue;
        if (item.transient) entries.delete(key);
        else item.dismissed = true;
      }
      emit();
    },
    show(message) {
      const id = Symbol('error');
      entries.set(id, { id, message, content: null, transient: true, dismissed: false });
      emit();
    },
  };
}

export const errorDialogs = createErrorDialogStore();
export const showErrorDialog = message => errorDialogs.show(message || 'Something went wrong. Please try again.');
