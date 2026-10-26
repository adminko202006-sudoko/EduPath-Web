export function isOnlineExamNotification(notification) {
  if (notification?.destination === 'online_exam') return true;
  return notification?.type === 'exam' && /online (?:scholarship )?exam/i.test(`${notification.title || ''} ${notification.message || ''}`);
}
