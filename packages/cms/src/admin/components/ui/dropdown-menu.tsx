import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

interface DropdownMenuContextValue {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenu() {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) throw new Error("DropdownMenu components must be used within <DropdownMenu>");
  return ctx;
}

function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (triggerRef.current?.contains(e.target as Node)) return;
      const content = triggerRef.current?.parentElement?.querySelector("[data-dropdown-content]");
      if (content?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ onClose, onOpen, open, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: ReactNode;
}

function DropdownMenuTrigger({ asChild, children }: DropdownMenuTriggerProps) {
  const { onClose, onOpen, open, triggerRef } = useDropdownMenu();

  if (asChild) {
    const child = children as React.ReactElement;
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? onClose() : onOpen())}
        className="inline-flex"
      >
        {child}
      </button>
    );
  }

  return (
    <button ref={triggerRef} type="button" onClick={() => (open ? onClose() : onOpen())}>
      {children}
    </button>
  );
}

function DropdownMenuContent({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { open, triggerRef } = useDropdownMenu();
  if (!open) return null;

  return (
    <div
      data-dropdown-content
      className={cn(
        "absolute right-0 z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        className,
      )}
      style={{ top: triggerRef.current?.offsetHeight ?? 0 }}
      {...props}
    >
      {children}
    </div>
  );
}

interface DropdownMenuItemProps extends HTMLAttributes<HTMLDivElement> {
  onClick?: () => void;
}

function DropdownMenuItem({ children, className, onClick, ...props }: DropdownMenuItemProps) {
  const { onClose } = useDropdownMenu();

  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className,
      )}
      onClick={() => {
        onClick?.();
        onClose();
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
