import TCSLogo from '@/assets/tcs-logo.svg?react';
import './tcs-brand.css';

export default function TCSBrandMark() {
  return (
    <div className="tcs-brand relative group flex items-center" aria-label="TCS brand mark" role="img">
      <span className="tcs-brand__glow pointer-events-none absolute inset-[-8px] rounded-xl opacity-35 blur-xl" />

      <span className="tcs-brand__edge pointer-events-none absolute inset-[-4px] rounded-xl opacity-60" />

      <div className="relative z-10 flex items-center">
        <TCSLogo className="tcs-brand__logo h-8 w-auto text-white opacity-90 transition-transform duration-500 ease-out group-hover:opacity-100 group-hover:scale-[1.02]" />
      </div>

      <span className="tcs-brand__shimmer pointer-events-none absolute inset-[-6px] rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-30" />
    </div>
  );
}
