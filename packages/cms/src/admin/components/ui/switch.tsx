import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const Switch = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ checked = false, className, ...props }, ref) => {
    return (
      <label
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-input",
          className,
        )}
      >
        <input type="checkbox" className="sr-only" ref={ref} checked={checked} {...props} />
        <span
          className={cn(
            "pointer-events-none absolute left-0.5 block h-5 w-5 rounded-full bg-background shadow-lg transition-transform",
            checked ? "translate-x-5" : "",
          )}
        />
      </label>
    );
  },
);
Switch.displayName = "Switch";

export { Switch };
