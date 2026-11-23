import { useState, useEffect } from 'react';

const HUD = ({ stats, highScore, isMuted, onToggleMute }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const energy = stats.energy || 0;
  const isLowEnergy = energy < 30;

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Bengali number converter helper
  const toBengaliNumber = (num) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, (w) => bengaliDigits[+w]);
  };

  return (
    <div className="hud-container">
      {/* Top Bar Stats */}
      <div className="hud-top-bar">
        {/* Distance */}
        <div className="hud-card distance-card">
          <span className="hud-label">দূরত্ব</span>
          <span className="hud-value">{toBengaliNumber(stats.distance || 0)} <small>মি.</small></span>
        </div>

        {/* Kicks */}
        <div className="hud-card kicks-card">
          <span className="hud-label">লাত্থি</span>
          <span className="hud-value">💥 {toBengaliNumber(stats.kicks || 0)}</span>
        </div>

        {/* Score */}
        <div className="hud-card score-card">
          <span className="hud-label">স্কোর</span>
          <span className="hud-value text-yellow">{toBengaliNumber(stats.score || 0)}</span>
        </div>

        {/* High Score */}
        <div className="hud-card highscore-card">
          <span className="hud-label">সেরা</span>
          <span className="hud-value text-amber">🏆 {toBengaliNumber(highScore || 0)}</span>
        </div>

        {/* Mute Button */}
        <button
          type="button"
          className="hud-btn mute-btn"
          onClick={onToggleMute}
          title={isMuted ? 'সাউন্ড আনমিউট করুন' : 'সাউন্ড মিউট করুন'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Fullscreen Button */}
        <button
          type="button"
          className="hud-btn fullscreen-btn"
          onClick={handleToggleFullscreen}
          title={isFullscreen ? 'ফুলস্ক্রিন বন্ধ করুন' : 'সম্পূর্ণ ফুলস্ক্রিন করুন (⛶)'}
        >
          {isFullscreen ? '⤦' : '⛶'}
        </button>
      </div>

      {/* Energy Stamina Bar */}
      <div className="hud-energy-wrapper">
        <div className="hud-energy-header">
          <span className={`hud-energy-title ${isLowEnergy ? 'blink-text text-danger' : ''}`}>
            ⚡ লিডারের এনার্জি: {toBengaliNumber(energy)}%
            {isLowEnergy && <span className="danger-alert"> ⚠️ ঘাম ছুটছে! গণধোলাই আসন্ন!</span>}
          </span>
          {stats.isBoosted && (
            <span className="hud-boost-badge blink-boost">
              🔥 লিডার পাওয়ার! ({toBengaliNumber(Math.ceil((stats.boostPercent || 0) / 28))} সে.)
            </span>
          )}
        </div>
        <div className="hud-energy-bar-bg">
          <div
            className={`hud-energy-bar-fill ${
              stats.isBoosted
                ? 'fill-boost'
                : isLowEnergy
                ? 'fill-low'
                : energy < 60
                ? 'fill-mid'
                : 'fill-high'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, energy))}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default HUD;
