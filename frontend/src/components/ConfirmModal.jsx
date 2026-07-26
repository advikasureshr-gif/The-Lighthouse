import { useEffect, useRef, useId } from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({
  isOpen,
  title = 'Sign out?',
  message = 'Are you sure you want to sign out of your account?',
  confirmText = 'Sign Out',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}) => {
  const modalRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const previousFocusRef = useRef(null);

  const baseId = useId();
  const titleId = `confirm-modal-title-${baseId}`;
  const messageId = `confirm-modal-message-${baseId}`;

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onCancel();
          return;
        }

        if (e.key === 'Tab' && modalRef.current) {
          const focusables = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length === 0) return;

          const firstElement = focusables[0];
          const lastElement = focusables[focusables.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        if (
          previousFocusRef.current &&
          document.body.contains(previousFocusRef.current) &&
          typeof previousFocusRef.current.focus === 'function'
        ) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="confirm-modal-backdrop" onClick={onCancel}>
      <div
        ref={modalRef}
        className="confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <h3 id={titleId} className="confirm-modal__title">
          {title}
        </h3>
        <p id={messageId} className="confirm-modal__message">
          {message}
        </p>
        <div className="confirm-modal__actions">
          <button
            ref={cancelBtnRef}
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
