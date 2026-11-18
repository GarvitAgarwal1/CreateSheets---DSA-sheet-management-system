function AlertBar({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="alert-bar alert-bar--info">
      <span className="flex-1">{message}</span>
      {onDismiss ? (
        <button type="button" className="btn-base btn-ghost btn-sm" onClick={onDismiss} aria-label="Dismiss">
          ✕
        </button>
      ) : null}
    </div>
  );
}

export default AlertBar;
