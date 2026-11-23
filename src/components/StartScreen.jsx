import { useState, useEffect } from 'react';
import sound from '../utils/soundEngine';

const StartScreen = ({
  onStart,
  customLeaderImg,
  highScore,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const handleStartGame = () => {
    sound.init();
    sound.playKick();
    sound.playCluck();
    onStart();
  };

  const toBengaliNumber = (num) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, (w) => bengaliDigits[+w]);
  };

  const currentAvatarSrc = customLeaderImg || '/assets/leader_face.png';

  return (
    <div className="overlay-screen start-screen">
      {/* Fullscreen Button in Corner */}
      <button
        type="button"
        className="start-fullscreen-btn"
        onClick={handleToggleFullscreen}
        title="সম্পূর্ণ ফুলস্ক্রিন করুন"
      >
        {isFullscreen ? '⤦ নরমাল স্ক্রিন' : '⛶ ফুলস্ক্রিন'}
      </button>

      {/* Game Title with Cartoon Satirical Styling */}
      <div className="title-container">
        <div className="chicken-badge">🐔💨</div>
        <h1 className="game-title">লিডার মুরগি চুর</h1>
        <p className="game-subtitle">LEADER MURGI CHUR • BANGLADESHI ARCADE ACTION RUNNER</p>
      </div>

      {/* Story Prologue Banner */}
      <div className="story-banner">
        <p>
          🚨 <strong>ব্রেকিং:</strong> গ্রাম্য খামার থেকে জীবন্ত মুরগি বগলদাবা করে পালাচ্ছেন আমাদের লিডার! 
          পেছনে ক্ষিপ্ত গ্রামবাসী লাঠি-ঝাঁড়ু নিয়ে ধাওয়া করেছে। সামনে আসা মানুষদের <strong>লাত্থি (KICK)</strong> মেরে উড়িয়ে দিন, 
          রাস্তার <strong>এনার্জি ড্রিংক (⚡)</strong> খেয়ে দৌড়ের স্পিড ধরে রাখুন এবং <strong>গণধোলাই</strong> এড়িয়ে বহুদূর পালিয়ে যান!
        </p>
      </div>

      {/* Character Preview Box */}
      <div className="character-preview-card">
        <div className="character-avatar-frame">
          <img
            src={currentAvatarSrc}
            alt="Leader"
            className="character-avatar-img"
          />
          <div className="chicken-avatar-overlay">🐔</div>
        </div>

        <div className="character-controls">
          <h3 className="character-name">প্রধান চরিত্র: লিডার</h3>
          <p className="character-desc">
            জীবন্ত মুরগি বগলদাবা করে পালাচ্ছেন ক্ষিপ্ত গ্রামবাসীর ধাওয়া থেকে!
          </p>
        </div>
      </div>

      {/* How to Play Controls Guide */}
      <div className="controls-guide">
        <div className="control-card">
          <span className="control-icon">⌨️ / ⬆</span>
          <strong>লাফ (JUMP)</strong>
          <span>Space / Up / W / বামে ট্যাপ</span>
        </div>

        <div className="control-card">
          <span className="control-icon">💥 / ➡️</span>
          <strong>লাত্থি (KICK)</strong>
          <span>D / Right / Enter / ডানে ট্যাপ</span>
        </div>

        <div className="control-card">
          <span className="control-icon">⚡</span>
          <strong>এনার্জি ড্রিংক</strong>
          <span>স্পিড বুস্ট ও স্ট্যামিনা রিফিল</span>
        </div>
      </div>

      {/* Best Score Trophy */}
      {highScore > 0 && (
        <div className="highscore-badge">
          🏆 আপনার সেরা রেকর্ড: <strong>{toBengaliNumber(highScore)}</strong> পয়েন্ট
        </div>
      )}

      {/* BIG PLAY BUTTON */}
      <button className="btn btn-primary start-btn" onClick={handleStartGame}>
        <span className="btn-icon">🏃💨</span> দৌড় শুরু করুন (PLAY)
      </button>

      <p className="footer-credits">
        অনুপ্রেরণা: <em>dalalpidan.com</em> • ১০০% পিওর ক্যানভাস ৬০ FPS আর্কেড গেম
      </p>
    </div>
  );
};

export default StartScreen;
