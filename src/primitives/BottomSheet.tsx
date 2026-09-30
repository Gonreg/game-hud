import { useEffect, type ReactNode } from 'react';

export function BottomSheet({
  open,
  onClose,
  children,
  labelledBy,
  backdropClassName,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  /** Доп. класс подложки — шиту, которому надо лечь поверх кабинета
   *  (у оверлея кабинета z-index 1000, у обычной подложки 30). */
  backdropClassName?: string;
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`hud-sheet-backdrop${backdropClassName ? ` ${backdropClassName}` : ''}`}
      onPointerDown={onClose}
    >
      <div
        className="hud-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
