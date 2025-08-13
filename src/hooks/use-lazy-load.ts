import { useEffect, useRef, useState } from "react";

export function useLazyLoad<T extends HTMLElement = HTMLElement>(
    options: IntersectionObserverInit = {}
) {
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<T>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(element);
                }
            },
            {
                rootMargin: "50px",
                threshold: 0.1,
                ...options,
            }
        );

        observer.observe(element);

        return () => {
            observer.unobserve(element);
        };
    }, [options]);

    return { elementRef, isVisible };
}
