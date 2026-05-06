import { toast as sonnerToast } from 'sonner';
import type { ExternalToast, ToasterProps } from 'sonner';

export { Toaster } from 'sonner';

export const TOAST_DURATION_MS = 4000;
const WARNING_TOAST_DURATION_MS = 8000;
const ERROR_TOAST_DURATION_MS = 10000;
const TOAST_CLOSE_BUTTON_CLASS =
  '!left-auto !right-3 !top-1/2 !h-7 !w-7 !-translate-y-1/2 !translate-x-0 !border-0 !bg-transparent !text-[var(--text-muted)] hover:!bg-[var(--bg-hover)] hover:!text-[var(--text-primary)]';

export const TOAST_OPTIONS: NonNullable<ToasterProps['toastOptions']> = {
  closeButton: true,
  closeButtonAriaLabel: 'Close notification',
  classNames: {
    toast: 'pr-11',
    closeButton: TOAST_CLOSE_BUTTON_CLASS,
  },
  style: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  },
};

type ToastMessage = Parameters<typeof sonnerToast>[0];
type RendererToast = typeof sonnerToast;

export const toast: RendererToast = Object.assign(
  (message: ToastMessage, data?: ExternalToast) => sonnerToast(message, data),
  sonnerToast,
  {
    warning: (message: ToastMessage, data?: ExternalToast) =>
      sonnerToast.warning(message, { duration: WARNING_TOAST_DURATION_MS, ...data }),
    error: (message: ToastMessage, data?: ExternalToast) =>
      sonnerToast.error(message, { duration: ERROR_TOAST_DURATION_MS, ...data }),
  },
);
