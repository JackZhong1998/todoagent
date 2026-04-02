import React from 'react';

type Props = {
  size?: number;
  className?: string;
  title?: string;
};

/**
 * TodoAgent mark — white tile + oversized “do”, clockwise tilt & slight offset.
 * Matches /favicon.svg.
 */
export const BrandMark: React.FC<Props> = ({ size = 36, className, title }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <rect x="1" y="1" width="98" height="98" rx="23" fill="#ffffff" stroke="#d1d1d6" strokeWidth="1" />
      <g transform="translate(50.8 50.6) rotate(10.5) translate(-50.8 -50.6)">
        <text
          x={50.5}
          y={50}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#1d1d1f"
          fontFamily='system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif'
          fontSize={69}
          fontWeight={600}
          letterSpacing={-7.2}
        >
          do
        </text>
      </g>
    </svg>
  );
};
