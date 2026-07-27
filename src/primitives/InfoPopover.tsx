import { useState } from 'react';

interface Props {
  text: string;
}

export function InfoPopover({ text }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="info"
        style={{
          marginLeft: 6,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: '#9aa3c4',
          cursor: 'pointer',
          fontSize: 12,
          lineHeight: 1,
        }}
      >
        ?
      </button>
      {open && (
        <div
          role="dialog"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1f33',
              borderRadius: 16,
              padding: 16,
              maxWidth: 360,
              color: '#fff',
              fontSize: 14,
              lineHeight: 1.5,
              whiteSpace: 'pre-line',
              // Reset inherited eyebrow-label styling — this dialog renders
              // inside .profile-card__label, which is uppercase + tracked.
              textTransform: 'none',
              letterSpacing: 'normal',
              fontWeight: 400,
              fontFamily: 'var(--sans)',
            }}
          >
            {text}
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '10px',
                background: '#ff7a59',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}
