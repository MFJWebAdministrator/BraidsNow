import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
    // Support 1 or 2 thumbs based on value/defaultValue length
    const value = (props as any).value as number[] | undefined;
    const defaultValue = (props as any).defaultValue as number[] | undefined;
    const thumbsCount = Array.isArray(value)
        ? value.length
        : Array.isArray(defaultValue)
          ? defaultValue.length
          : 1;

    return (
        <SliderPrimitive.Root
            ref={ref}
            className={cn(
                "relative flex w-full touch-none select-none items-center",
                className
            )}
            {...props}
        >
            <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20 ">
                <SliderPrimitive.Range className="absolute h-full bg-primary " />
            </SliderPrimitive.Track>
            {Array.from({ length: thumbsCount }).map((_, idx) => (
                <SliderPrimitive.Thumb
                    key={idx}
                    className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 bg-white focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                />
            ))}
        </SliderPrimitive.Root>
    );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
