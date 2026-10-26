import tmcLogo from '../assets/tmcLogo.jpg';
const eduPathLogo = `${import.meta.env.BASE_URL}images/EduPathBlue.png`;

export default function LoginBrandLogos({ large = false }) {
  const size = large ? 'h-28 w-28 sm:h-32 sm:w-32' : 'h-20 w-20';
  return (
    <div className="flex items-center justify-center gap-5 sm:gap-7">
      <div className={`${size} shrink-0 overflow-hidden rounded-full bg-white p-2 shadow-lg ring-2 ring-[#F4B400]/80`}>
        <img src={tmcLogo} alt="Trinidad Municipal College logo" className="h-full w-full rounded-full object-contain" />
      </div>
      <div className={`${size} shrink-0 overflow-hidden rounded-full bg-white p-2 shadow-lg ring-2 ring-[#F4B400]/80`}>
        <img src={eduPathLogo} alt="EduPath logo" className="h-full w-full rounded-full object-contain" />
      </div>
    </div>
  );
}
