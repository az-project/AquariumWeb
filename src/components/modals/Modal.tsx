"use client";

// 네이티브 <dialog> 유지 (index.html:297-380) — showModal()의 백드롭/ESC 동작 보존
import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  id: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ id, open, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog className="modal" id={id} ref={ref} onClose={onClose}>
      {children}
    </dialog>
  );
}
