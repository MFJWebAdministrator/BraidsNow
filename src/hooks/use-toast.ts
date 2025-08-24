import React from "react";
import { toast as reactToastifyToast, ToastOptions } from "react-toastify";

// Re-export the toast function for backward compatibility
export const toast = reactToastifyToast;

// Custom hook that provides a simplified interface
export function useToast() {
    const showToast = (
        messageOrOptions:
            | string
            | {
                  title?: string;
                  description?: string;
                  variant?: string;
                  duration?: number;
              },
        options?: ToastOptions & { title?: string }
    ) => {
        // Handle the case where the first parameter is an object (backward compatibility)
        if (typeof messageOrOptions === "object") {
            const { title, description, variant, duration, ...restOptions } =
                messageOrOptions;
            const message = description || title || "Toast message";

            // Determine toast type based on variant
            let toastFunction = reactToastifyToast.success;
            if (variant === "destructive") {
                toastFunction = reactToastifyToast.error;
            } else if (variant === "default") {
                toastFunction = reactToastifyToast.success;
            }

            return toastFunction(
                title && description
                    ? React.createElement(
                          "div",
                          {},
                          React.createElement(
                              "div",
                              { className: "font-semibold" },
                              title
                          ),
                          React.createElement(
                              "div",
                              { className: "text-sm opacity-90" },
                              description
                          )
                      )
                    : message,
                {
                    position: "top-right",
                    autoClose: duration || 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    ...restOptions,
                }
            );
        }

        // Handle the case where the first parameter is a string
        const { title, ...toastOptions } = options || {};

        if (title) {
            // If title is provided, show as success toast with title
            return reactToastifyToast.success(
                React.createElement(
                    "div",
                    {},
                    React.createElement(
                        "div",
                        { className: "font-semibold" },
                        title
                    ),
                    React.createElement(
                        "div",
                        { className: "text-sm opacity-90" },
                        messageOrOptions
                    )
                ),
                {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    ...toastOptions,
                }
            );
        }

        // Default toast without title
        return reactToastifyToast.success(messageOrOptions, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...toastOptions,
        });
    };

    const success = (message: string, options?: ToastOptions) => {
        return reactToastifyToast.success(message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...options,
        });
    };

    const error = (message: string, options?: ToastOptions) => {
        return reactToastifyToast.error(message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...options,
        });
    };

    const warning = (message: string, options?: ToastOptions) => {
        return reactToastifyToast.warning(message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...options,
        });
    };

    const info = (message: string, options?: ToastOptions) => {
        return reactToastifyToast.info(message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            ...options,
        });
    };

    return {
        toast: showToast,
        success,
        error,
        warning,
        info,
        dismiss: reactToastifyToast.dismiss,
    };
}
