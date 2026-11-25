import Image from 'next/image';

interface BrandMarkProps {
  compact?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

const dimensions = {
  sm: { box: 'h-9 w-9', image: 34, title: 'text-lg' },
  md: { box: 'h-11 w-11', image: 42, title: 'text-xl' },
  lg: { box: 'h-14 w-14', image: 54, title: 'text-2xl' },
};

export function BrandMark({ compact = false, size = 'md', showTagline = false, className = '' }: BrandMarkProps) {
  const dimension = dimensions[size];

  return (
    <span className={`inline-flex min-w-0 items-center gap-2.5 ${className}`}>
      <span className={`${dimension.box} relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#E8F5F3] to-[#FFF7E4] ring-1 ring-[#DCEBE8]`}>
        <Image
          src="/images/lentera-mascot.png"
          alt=""
          width={dimension.image}
          height={dimension.image}
          className="h-full w-full object-contain p-0.5"
          priority={size === 'lg'}
        />
      </span>
      {!compact && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className={`${dimension.title} truncate font-extrabold tracking-[0.11em] text-[#17324D]`}>LENTERA</span>
          {showTagline && <span className="mt-1 truncate text-[9px] font-semibold tracking-[0.12em] text-[#718096]">TERANGI PEMBELAJARAN</span>}
        </span>
      )}
    </span>
  );
}
