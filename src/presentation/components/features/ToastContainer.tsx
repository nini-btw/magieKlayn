"use client";

import * as React from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon } from "lucide-react";
import { selectToasts, removeToast } from "@/presentation/store/ui/ui.slice";
import { toastSlide } from "@/presentation/lib/animations";

/**
 * Toast icon mapping
 */
const toastIcons = {
  success: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
  error: <AlertCircleIcon className="h-5 w-5 text-red-500" />,
  info: <InfoIcon className="h-5 w-5 text-blue-500" />,
};

/**
 * Toast container component
 * Displays toast notifications
 */
export const ToastContainer: React.FC = () => {
  const toasts = useSelector(selectToasts);
  const dispatch = useDispatch();

  // Auto-dismiss toasts
  React.useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => {
        dispatch(removeToast(toast.id));
      }, 3000);
      return () => clearTimeout(timer);
    });
  }, [toasts, dispatch]);

  return (
    <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col gap-2 md:top-18 md:right-6 md:bottom-auto md:left-auto md:translate-x-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            variants={toastSlide}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-brown-900 flex min-w-[280px] items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-medium text-white shadow-2xl"
          >
            {toast.type && toastIcons[toast.type]}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => dispatch(removeToast(toast.id))}
              className="rounded-full p-1 transition-colors hover:bg-white/10"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
