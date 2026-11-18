function Skeleton({ className = "", rounded = "rounded-lg", pulse = true }) {
  return <div className={`skeleton ${rounded} ${pulse ? "skeleton-pulse" : ""} ${className}`.trim()} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3, lineClassName = "h-3", gapClassName = "gap-2" }) {
  return (
    <div className={`flex flex-col ${gapClassName}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`${lineClassName} ${index === lines - 1 ? "w-2/3" : "w-full"}`}
          rounded="rounded-md"
        />
      ))}
    </div>
  );
}

export default Skeleton;
