import React from 'react';

type Props = {
  size?: number;
  className?: string;
  title?: string;
};

/**
 * TodoAgent mark: rounded square + geometric “T” (matches /favicon.svg).
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
      <rect width="100" height="100" rx="24" fill="#0a0a0a" />
      <rect x="18" y="26" width="64" height="13" rx="6.5" fill="#fafafa" />
      <rect x="43.5" y="36" width="13" height="46" rx="6.5" fill="#fafafa" />
    </svg>
  );
};
