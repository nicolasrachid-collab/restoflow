import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
  height?: number | string;
  width?: number | string;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  count = 1,
  height = 20,
  width = '100%',
  circle = false,
}) => {
  const baseStyles = 'bg-gray-200 animate-pulse rounded';
  const heightStyle = typeof height === 'number' ? `h-${height}` : height;
  const widthStyle = typeof width === 'number' ? `w-${width}` : width;
  const shapeStyle = circle ? 'rounded-full' : 'rounded';

  const skeleton = (
    <div
      className={`${baseStyles} ${shapeStyle} ${className}`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
      }}
      aria-label="Carregando..."
      role="status"
    />
  );

  if (count === 1) {
    return skeleton;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>{skeleton}</React.Fragment>
      ))}
    </>
  );
};

