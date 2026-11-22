"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { Icon } from "./Icon";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  side: "left" | "right" | "top" | "center";
  /** Accessible name for the dialog. */
  title: string;
  /** Visually hide the title (it's still the dialog's accessible name). */
  hideTitle?: boolean;
  children: ReactNode;
  panelClassName?: string;
  /** Element to focus when opened. Defaults to the first focusable element. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Where focus goes on close when the opener is gone. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  footer?: ReactNode;
};

const PANEL_LAYOUT: Record<SheetProps["side"], string> = {
  right: "ml-auto h-full w-full max-w-[28rem]",
  left: "mr-auto h-full w-[min(88vw,24rem)]",
  top: "w-full max-h-[85dvh]",
  center: "m-auto mt-[8vh] w-[min(calc(100%-2rem),40rem)] max-h-[84dvh]",
};

/**
 * Modal sheet built on native <dialog>: the browser provides the focus trap
 * (inert background) and Escape handling. We add focus restoration, backdrop
 * click to close and closing on navigation.
 */
export function Sheet({
  open,
  onClose,
  side,
  title,
  hideTitle,
  children,
  panelClassName = "",
  initialFocusRef,
  returnFocusRef,
  footer,
}: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      initialFocusRef?.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialFocusRef]);

  // Close when the route changes (e.g. a link inside the sheet was followed).
  const pathname = usePathname();
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      if (dialogRef.current?.open) onCloseRef.current();
    }
  }, [pathname]);

  function handleClose() {
    onCloseRef.current();
    const explicit = returnFocusRef?.current;
    const target = explicit?.isConnected ? explicit : openerRef.current;
    if (target?.isConnected) target.focus({ preventScroll: true });
  }

  return (
    <dialog
      ref={dialogRef}
      className="sheet"
      data-side={side}
      aria-labelledby={titleId}
      onClose={handleClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
    >
      <div
        className={`sheet-panel flex flex-col bg-ivory text-ink shadow-[0_10px_40px_rgb(0_0_0/0.12)] ${PANEL_LAYOUT[side]} ${panelClassName}`}
      >
        <div
          className={`flex items-center justify-between gap-4 px-5 ${hideTitle ? "min-h-12 pt-2" : "min-h-16 border-b hairline"}`}
        >
          <h2 id={titleId} className={hideTitle ? "sr-only" : "text-base font-semibold"}>
            {title}
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="-mr-2 inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-ivory-deep"
            aria-label={`Close ${title.toLowerCase()}`}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer}
      </div>
    </dialog>
  );
}
