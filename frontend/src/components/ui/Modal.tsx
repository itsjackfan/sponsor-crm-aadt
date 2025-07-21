import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '' 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div 
          className={`modal-content ${className}`} 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
          </div>
          <div className="modal-body">
            {children}
          </div>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn var(--duration-slow) var(--easing-default);
        }

        .modal-content {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(16px);
          border-radius: var(--radius-modal);
          padding: 40px;
          max-width: 560px;
          width: 90%;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: var(--shadow-modal);
          position: relative;
          animation: slideUp var(--duration-slow) var(--easing-spring);
        }

        .modal-header {
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
        }

        .modal-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          text-align: center;
          margin: 0;
          letter-spacing: -0.025em;
        }

        .modal-body {
          /* Content styles handled by children */
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(20px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0px) scale(1); 
          }
        }
      `}</style>
    </>
  );
};