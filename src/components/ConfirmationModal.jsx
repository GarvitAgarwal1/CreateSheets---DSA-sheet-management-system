function ConfirmationModal({
  isOpen,
  title,
  message,
  actions = [],
  onClose,
  isBusy = false,
}) {
  if (!isOpen) return null;

  const toneClassByVariant = {
    neutral: "btn-neutral",
    subtle: "btn-neutral",
    primary: "btn-primary",
    danger: "btn-danger",
    success: "btn-success",
  };

  return (
    <div className="overlay-shell" onClick={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div className="overlay-panel max-w-md p-6">
        <div className="mb-5">
          <h2 className="modal-title">{title}</h2>
          <p className="modal-message">{message}</p>
        </div>

        <div className="modal-actions">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={action.onClick}
              disabled={isBusy || action.disabled}
              className={`btn-base px-4 py-2 text-sm ${toneClassByVariant[action.variant || "neutral"]} ${action.className || ""}`.trim()}
            >
              {action.label}
            </button>
          ))}
        </div>

        {onClose ? (
          <button
            type="button"
            className="sr-only"
            onClick={onClose}
            aria-label="Close confirmation dialog"
          />
        ) : null}
      </div>
    </div>
  );
}

export default ConfirmationModal;
