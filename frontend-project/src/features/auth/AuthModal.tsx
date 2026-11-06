import { useEffect, type ReactNode } from "react";
import { LayoutGrid, X } from "lucide-react";
import toast from "react-hot-toast";
import HomePage from "../landing/HomePage";

type Props = {
  titleId: string;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.001 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export function GoogleButton() {
  return (
    <button
      type="button"
      onClick={() => toast.error("Google sign-in is not available yet.")}
      className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-[#e0e0e0] bg-white text-xs font-semibold text-[#0b1b33] transition-colors hover:bg-slate-50"
    >
      <GoogleMark />
      Continue with Google
    </button>
  );
}

export function AuthDivider() {
  return (
    <div className="my-4 flex items-center gap-3">
      <span className="h-px flex-1 bg-[#e9edf3]" />
      <span className="whitespace-nowrap text-[10px] font-medium text-[#9aa4b2]">
        or continue with email
      </span>
      <span className="h-px flex-1 bg-[#e9edf3]" />
    </div>
  );
}

function AuthModal({ titleId, title, subtitle, onClose, children, footer }: Props) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      <div aria-hidden="true">
        <HomePage />
      </div>

      <div
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[100] flex min-h-full items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-[2px]"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-lg bg-white shadow-[0_24px_70px_-20px_rgba(15,23,42,0.45)] sm:max-w-[380px]"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-2.5 top-2.5 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="px-5 pb-5 pt-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb] text-white shadow-sm shadow-blue-600/25">
                <LayoutGrid className="h-4 w-4" />
              </span>
              <span className="text-sm font-bold tracking-tight text-[#0b1b33]">Taskboard</span>
            </div>

            <h1
              id={titleId}
              className="mt-5 text-[22px] font-bold leading-[1.18] tracking-[-0.025em] text-[#0b1b33]"
            >
              {title}
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-[#64748b]">{subtitle}</p>

            <div className="mt-4">{children}</div>
          </div>

          <div className="border-t border-[#edf1f7] bg-[#f4f8ff] px-5 py-3 text-center text-[11px] text-[#64748b]">
            {footer}
          </div>
        </div>
      </div>
    </>
  );
}

export default AuthModal;
