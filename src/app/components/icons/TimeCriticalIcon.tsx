import React from 'react';

interface TimeCriticalIconProps {
  className?: string;
}

export function TimeCriticalIcon({ className = '' }: TimeCriticalIconProps) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Icon">
        <polygon id="Path" points="0 0 24 0 24 24 0 24" fill="none"></polygon>
        <path 
          d="M11.991,3 C16.968,3 21,7.032 21,12 C21,16.968 16.968,21 11.991,21 C7.023,21 3,16.968 3,12 C3,7.032 7.023,3 11.991,3 Z M11.991,5 C8.12990426,5 5,8.13423331 5,12 C5,15.8657667 8.12990426,19 11.991,19 C15.8623472,19 19,15.8645126 19,12 C19,8.1354874 15.8623472,5 11.991,5 Z" 
          id="Path" 
          fill="currentColor" 
          fillRule="nonzero"
        />
        <path 
          d="M12,7 C12.5128358,7 12.9355072,7.38604019 12.9932723,7.88337887 L13,8 L12.999,12.547 L15.2120097,13.8549773 C15.6535043,14.1159047 15.8209627,14.6632946 15.6176496,15.1208384 L15.5641053,15.2246592 C15.303178,15.6661539 14.755788,15.8336123 14.2982442,15.6302991 L14.1944234,15.5767549 L11.4912068,13.9791292 C11.2248254,13.8216953 11.0485312,13.5514005 11.0086199,13.2493824 L11,13.1182404 L11,8 C11,7.44771525 11.4477153,7 12,7 Z" 
          id="Line" 
          fill="currentColor" 
          fillRule="nonzero"
        />
      </g>
    </svg>
  );
}
