import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  maxWidth?: number | string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidth = 640,
  children,
  className = '',
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--overlay-backdrop)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className={`card ${className}`.trim()}
        style={{
          width: '100%',
          maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 32px',
          gap: '16px',
          boxShadow: 'var(--shadow-modal)',
          overflowY: 'auto',
          borderRadius: 28,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: 14,
            }}
          >
            <div>
              {title && (
                <h2 style={{ fontSize: 20, color: 'var(--text-main)', marginBottom: 4 }}>
                  {title}
                </h2>
              )}
              {subtitle && <p className="text-muted" style={{ fontSize: 13 }}>{subtitle}</p>}
            </div>
            {showCloseButton && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onClose}
                aria-label="Cerrar modal"
                style={{
                  width: 34,
                  height: 34,
                  padding: 0,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

