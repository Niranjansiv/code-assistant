import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// ── Text Input ────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  inputSize?: "sm" | "md" | "lg";
}

const inputSizeStyles = {
  sm: "h-7 text-xs px-2.5",
  md: "h-9 text-sm px-3",
  lg: "h-11 text-base px-4",
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftElement,
      rightElement,
      inputSize = "md",
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-slate-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftElement && (
            <div className="absolute left-2.5 text-slate-500 pointer-events-none">
              {leftElement}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full bg-[#0D1117] border rounded-lg text-slate-100 placeholder:text-slate-600",
              "transition-colors duration-150 outline-none",
              "focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error
                ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/30"
                : "border-[#30363d] hover:border-[#444c56]",
              inputSizeStyles[inputSize],
              leftElement && "pl-8",
              rightElement && "pr-8",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2.5 text-slate-500">{rightElement}</div>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {!error && hint && <p className="text-xs text-slate-600">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

// ── Textarea ──────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, resize = "vertical", className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-medium text-slate-400">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full bg-[#0D1117] border rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600",
            "transition-colors duration-150 outline-none",
            "focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/30"
              : "border-[#30363d] hover:border-[#444c56]",
            {
              "resize-none": resize === "none",
              "resize-y": resize === "vertical",
              "resize-x": resize === "horizontal",
              resize: resize === "both",
            },
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {!error && hint && <p className="text-xs text-slate-600">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// ── Search Input shorthand ────────────────────────────────────────────────────

interface SearchInputProps extends Omit<InputProps, "leftElement" | "type"> {
  onClear?: () => void;
}

function SearchInput({ onClear, value, ...props }: SearchInputProps) {
  return (
    <Input
      type="search"
      value={value}
      leftElement={
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      rightElement={
        value && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : undefined
      }
      {...props}
    />
  );
}

export { Input, Textarea, SearchInput };
