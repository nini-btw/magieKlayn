"use client";

import * as React from "react";
import { cn } from "@/presentation/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[0.78rem] font-semibold uppercase tracking-[0.06em] text-ink-soft block"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full bg-white border border-line rounded-2xl px-4 py-3.5 text-ink placeholder:text-ink-soft focus:outline-none focus:border-ink focus:ring-2 focus:ring-bg-soft transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed",
            error && "border-danger focus:border-danger focus:ring-danger-bg",
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="text-danger text-xs font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-ink-soft text-xs">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || React.useId();

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-[0.78rem] font-semibold uppercase tracking-[0.06em] text-ink-soft block"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full bg-white border border-line rounded-2xl px-4 py-3.5 text-ink placeholder:text-ink-soft focus:outline-none focus:border-ink focus:ring-2 focus:ring-bg-soft transition-all duration-150 resize-none min-h-[100px] disabled:opacity-60",
            error && "border-danger focus:border-danger focus:ring-danger-bg",
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="text-danger text-xs font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-ink-soft text-xs">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
