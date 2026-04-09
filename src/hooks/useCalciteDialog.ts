import { useRef, useEffect } from "react";

export function useCalciteDialog(
  open: boolean,
  onClose: () => void
): React.RefObject<HTMLCalciteDialogElement | null> {
  const ref = useRef<HTMLCalciteDialogElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      el.setAttribute("open", "");
    } else {
      el.removeAttribute("open");
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("calciteDialogClose", onClose);
    return () => el.removeEventListener("calciteDialogClose", onClose);
  }, [onClose]);

  return ref;
}
