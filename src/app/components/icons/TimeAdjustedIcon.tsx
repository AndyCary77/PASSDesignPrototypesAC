import React from 'react';

interface TimeAdjustedIconProps {
  className?: string;
}

export function TimeAdjustedIcon({ className = '' }: TimeAdjustedIconProps) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g transform="translate(1, 6.6862)">
        <path 
          d="M17.8764991,2.39746789 C18.3538066,1.92016043 19.1276749,1.92016043 19.6049824,2.39746789 L23.6790564,6.47154197 C24.4490135,7.24149902 23.9036985,8.55800581 22.8148148,8.55800581 L14.6666667,8.55800581 C13.577783,8.55800581 13.032468,7.24149902 13.802425,6.47154197 L17.8764991,2.39746789 Z" 
          fillRule="nonzero" 
          transform="translate(18.7407, 5.2987) rotate(90) translate(-18.7407, -5.2987)"
          fill="currentColor"
        />
        <circle cx="10.9147346" cy="5.29874655" r="1.22222222" fill="currentColor" />
        <circle cx="10.9147346" cy="1.63207989" r="1.22222222" fill="currentColor" />
        <circle cx="10.9147346" cy="8.99549579" r="1.22222222" fill="currentColor" />
        <path 
          d="M7.33333333,2.06956986 C8.42221704,2.06956986 8.96753201,3.38607665 8.19757495,4.15603371 L4.12350088,8.23010778 C3.64619341,8.70741525 2.87232511,8.70741525 2.39501764,8.23010778 L-1.67905644,4.15603371 C-2.44901349,3.38607665 -1.90369852,2.06956986 -0.814814815,2.06956986 L7.33333333,2.06956986 Z" 
          fillRule="nonzero" 
          transform="translate(3.2593, 5.3288) rotate(90) translate(-3.2593, -5.3288)"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}
