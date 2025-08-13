import { useLazyLoad } from "@/hooks/use-lazy-load";
import { cn } from "@/lib/utils";

interface LazyCardProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

export function LazyCard({ children, className, delay = 0 }: LazyCardProps) {
    const { elementRef, isVisible } = useLazyLoad<HTMLDivElement>();

    return (
        <div
            ref={elementRef}
            className={cn(
                "transition-all duration-700 ease-out",
                isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8",
                className
            )}
            style={{
                transitionDelay: isVisible ? `${delay}ms` : "0ms",
            }}
        >
            {children}
        </div>
    );
}
