const TouchControls = ({ onJump, onKick }) => {
  const handleAction = (action, e) => {
    if (e) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    }
    action();
  };

  return (
    <div className="touch-controls-container">
      {/* JUMP BUTTON */}
      <button
        type="button"
        className="touch-btn jump-touch-btn"
        onPointerDown={(e) => handleAction(onJump, e)}
      >
        <span className="touch-icon">⬆</span>
        <span className="touch-label">লাফ</span>
        <span className="touch-sub">JUMP</span>
      </button>

      {/* KICK BUTTON */}
      <button
        type="button"
        className="touch-btn kick-touch-btn"
        onPointerDown={(e) => handleAction(onKick, e)}
      >
        <span className="touch-icon">💥</span>
        <span className="touch-label">লাত্থি</span>
        <span className="touch-sub">KICK</span>
      </button>
    </div>
  );
};

export default TouchControls;
