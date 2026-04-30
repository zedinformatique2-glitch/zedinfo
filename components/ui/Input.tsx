import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full bg-white rounded-xl ring-1 ring-outline-variant/60 px-4 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full bg-white rounded-xl ring-1 ring-outline-variant/60 px-4 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full bg-white rounded-xl ring-1 ring-outline-variant/60 px-4 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all",
        className
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2"
    >
      {children}
    </label>
  );
}
