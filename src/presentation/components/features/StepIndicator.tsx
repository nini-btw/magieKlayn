"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CheckIcon } from "lucide-react";
import { cn } from "@/presentation/lib/utils";

/**
 * Step indicator props
 */
export interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

/**
 * Step indicator component
 * Shows progress through multi-step flows
 */
export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
}) => {
  return (
    <div className="flex items-center justify-center gap-2 w-full max-w-md mx-auto">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          {/* Step circle */}
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
              index < currentStep
                ? "bg-pink-500 text-white"
                : index === currentStep
                ? "bg-pink-500 text-white ring-4 ring-pink-100"
                : "bg-brown-100 text-brown-400"
            )}
          >
            {index < currentStep ? (
              <CheckIcon className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div className="flex-1 h-0.5 rounded overflow-hidden bg-brown-100">
              <motion.div
                className="h-full bg-pink-500"
                initial={{ width: "0%" }}
                animate={{
                  width: index < currentStep ? "100%" : "0%",
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
