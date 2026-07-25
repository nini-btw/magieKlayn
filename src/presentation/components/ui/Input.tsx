"use client";

import * as React from "react";
import { cn } from "@/presentation/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
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
            className="text-xs font-bold uppercase tracking-widest text-[#5C3D2E] block"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full bg-white border border-[#E8D5C0] rounded-2xl px-4 py-3.5 text-[#2C1810] placeholder:text-[#A07850] focus:outline-none focus:border-[#F77BAD] focus:ring-2 focus:ring-[#FFF0F5] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed",
            error && "border-red-400 focus:border-red-400 focus:ring-red-100",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-red-500 text-xs font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-[#A07850] text-xs">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
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
            className="text-xs font-bold uppercase tracking-widest text-[#5C3D2E] block"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full bg-white border border-[#E8D5C0] rounded-2xl px-4 py-3.5 text-[#2C1810] placeholder:text-[#A07850] focus:outline-none focus:border-[#F77BAD] focus:ring-2 focus:ring-[#FFF0F5] transition-all duration-150 resize-none min-h-[100px] disabled:opacity-60",
            error && "border-red-400 focus:border-red-400 focus:ring-red-100",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-red-500 text-xs font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-[#A07850] text-xs">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
