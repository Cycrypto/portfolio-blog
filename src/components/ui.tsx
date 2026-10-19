"use client";
import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Check, CircleAlert, LoaderCircle, X } from "lucide-react";

import { buttonClass } from "./ui-styles";
export { buttonClass } from "./ui-styles";
export function Button({
  variant = "primary",
  loading,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: string;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${buttonClass(variant)} ${className}`}
      {...props}
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
    >
      {loading && <LoaderCircle size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
export const inputClass =
  "w-full min-h-11 rounded border border-line bg-surface px-3 text-base sm:text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-2 focus:outline-accent/20 disabled:opacity-50";
export function Field({
  label,
  help,
  error,
  children,
  id,
}: {
  label: string;
  help?: string;
  error?: string;
  children: ReactNode;
  id?: string;
}) {
  const control =
    isValidElement<{ "aria-describedby"?: string; "aria-invalid"?: boolean }>(
      children,
    ) &&
    typeof children.type === "string" &&
    ["input", "textarea", "select"].includes(children.type)
      ? cloneElement(children, {
          "aria-describedby":
            [
              children.props["aria-describedby"],
              id && (help || error) ? `${id}-description` : undefined,
            ]
              .filter(Boolean)
              .join(" ") || undefined,
          "aria-invalid": error ? true : children.props["aria-invalid"],
        })
      : children;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-[13px] font-medium">
        {label}
      </label>
      {control}
      {(error || help) && (
        <p
          id={id ? `${id}-description` : undefined}
          role={error ? "alert" : undefined}
          className={`text-xs leading-relaxed ${error ? "text-danger" : "text-muted"}`}
        >
          {error || help}
        </p>
      )}
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'a[href], button, input, textarea, select, [tabindex="0"]',
          ),
        ).filter(
          (el) =>
            !el.hasAttribute("disabled") && el.getClientRects().length > 0,
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) {
          event.preventDefault();
          return;
        }
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === event.currentTarget)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) closeRef.current();
      }}
      onClick={(e) => {
        if (busy || e.target !== e.currentTarget) return;
        const bounds = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < bounds.left ||
          e.clientX > bounds.right ||
          e.clientY < bounds.top ||
          e.clientY > bounds.bottom
        )
          closeRef.current();
      }}
      className={`fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-32px)] overscroll-contain overflow-y-auto rounded-lg border border-line bg-surface p-5 md:p-8 ${wide ? "max-w-3xl" : "max-w-lg"}`}
      aria-labelledby={titleId}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2
          id={titleId}
          className="font-heading text-xl leading-relaxed md:text-2xl"
        >
          {title}
        </h2>
        <button
          aria-label="닫기"
          disabled={busy}
          onClick={onClose}
          className="flex min-h-11 min-w-11 items-center justify-center rounded hover:bg-soft"
        >
          <X size={20} />
        </button>
      </div>
      {open ? children : null}
    </dialog>
  );
}
export type ToastOptions =
  | boolean
  | { error?: boolean; action?: { label: string; onClick: () => void } };
const ToastContext = createContext<
  (message: string, options?: ToastOptions) => void
>(() => {});
export const useToast = () => useContext(ToastContext);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    error: boolean;
    action?: { label: string; onClick: () => void };
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const show = (message: string, options: ToastOptions = false) => {
    const { error = false, action } =
      typeof options === "boolean" ? { error: options } : options;
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, error, action });
    timer.current = setTimeout(() => setToast(null), action ? 8000 : 5000);
  };
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div
          role={toast.error ? "alert" : "status"}
          className="fixed right-4 bottom-4 z-50 flex max-w-[calc(100%-32px)] items-center gap-3 rounded border border-line bg-surface p-4 shadow-lg md:right-8 md:bottom-8"
        >
          {toast.error ? (
            <CircleAlert size={20} className="shrink-0 text-danger" />
          ) : (
            <Check size={20} className="shrink-0 text-success" />
          )}
          <p className="text-sm">{toast.message}</p>
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                setToast(null);
              }}
              className="min-h-11 shrink-0 rounded px-3 text-sm font-medium text-accent hover:bg-soft"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => setToast(null)}
            aria-label="알림 닫기"
            className="flex h-11 w-11 shrink-0 items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
export async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "서버에 연결할 수 없어요. 인터넷 연결을 확인하고 다시 시도해 주세요.",
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      data?.error ||
        (response.status === 401
          ? "로그인이 만료됐어요. 다시 로그인한 뒤 시도해 주세요."
          : "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요."),
    );
  if (data === null)
    throw new Error(
      "서버 응답을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.",
    );
  return data;
}
