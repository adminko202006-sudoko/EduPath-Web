import tmcLogo from '../assets/tmcLogo.jpg';

/** Crop the source photo's outer white margin inside the circular seal. */
export default function TmcLogo({ className = '' }) {
  return (
    <span className={`ep-tmc-logo relative inline-block shrink-0 overflow-hidden rounded-full bg-[#123B5D] ${className}`}>
      <img
        src={tmcLogo}
        alt="Trinidad Municipal College logo"
        className="absolute max-w-none object-cover"
        style={{ width: '110%', height: '110%', left: '-5%', top: '-7%' }}
      />
    </span>
  );
}
