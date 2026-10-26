export default function OnlineDot({ online }) {
  const label = online === true ? 'Online recently (within 90 seconds)' : online === false ? 'Offline' : 'Online status unavailable';
  return <span role="img" aria-label={label} title={label} className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white shadow-sm dark:border-[#102235]" style={{ backgroundColor: online === true ? '#22c55e' : '#94a3b8' }} />;
}
