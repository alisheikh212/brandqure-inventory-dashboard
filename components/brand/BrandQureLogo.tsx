interface BrandQureLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

export default function BrandQureLogo({
  className = "",
  size = 40,
  showWordmark = true,
}: BrandQureLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={Math.round(size * 0.6)}
        viewBox="0 0 200 60"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="BrandQure logo"
      >
        <path
          d="M20 15C20 12.2386 22.2386 10 25 10H45C47.7614 10 50 12.2386 50 15V45C50 47.7614 47.7614 50 45 50H25C22.2386 50 20 47.7614 20 45V15Z"
          fill="#0F172A"
        />
        <path
          d="M30 25L35 35L40 25"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {showWordmark && (
          <text
            x="60"
            y="40"
            fontFamily="sans-serif"
            fontWeight="700"
            fontSize="24"
            fill="#0F172A"
          >
            BrandQure
          </text>
        )}
      </svg>
    </div>
  );
}

export function BrandQureLogoWhite({
  className = "",
  size = 40,
}: BrandQureLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={Math.round(size * 0.6)}
        viewBox="0 0 200 60"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="BrandQure logo"
      >
        <path
          d="M20 15C20 12.2386 22.2386 10 25 10H45C47.7614 10 50 12.2386 50 15V45C50 47.7614 47.7614 50 45 50H25C22.2386 50 20 47.7614 20 45V15Z"
          fill="white"
          fillOpacity="0.9"
        />
        <path
          d="M30 25L35 35L40 25"
          stroke="#131b2e"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <text
          x="60"
          y="40"
          fontFamily="sans-serif"
          fontWeight="700"
          fontSize="24"
          fill="white"
        >
          BrandQure
        </text>
      </svg>
    </div>
  );
}
