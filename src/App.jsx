import { useState, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import TouchControls from './components/TouchControls';
import StartScreen from './components/StartScreen';
import GameOverModal from './components/GameOverModal';
import sound from './utils/soundEngine';
import './App.css';

const LOCAL_STORAGE_HIGH_SCORE = 'leader_murgi_chur_highscore';
const LOCAL_STORAGE_CUSTOM_IMG = 'leader_murgi_chur_custom_img';

function App() {
  const [gameState, setGameState] = useState('START'); // 'START' | 'PLAYING' | 'GAMEOVER'
  const [stats, setStats] = useState({
    distance: 0,
    kicks: 0,
    drinks: 0,
    score: 0,
    energy: 100,
    isBoosted: false,
    boostPercent: 0,
  });

  const [highScore, setHighScore] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HIGH_SCORE);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [customLeaderImg, setCustomLeaderImg] = useState(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_CUSTOM_IMG) || null;
    } catch {
      return null;
    }
  });

  const [isMuted, setIsMuted] = useState(false);

  const handleStartGame = () => {
    setStats({
      distance: 0,
      kicks: 0,
      drinks: 0,
      score: 0,
      energy: 100,
      isBoosted: false,
      boostPercent: 0,
    });
    setGameState('PLAYING');
  };

  // Completely stable callback: uses functional updater so highScore is NEVER a dependency
  const handleGameOver = useCallback((finalStats) => {
    setGameState('GAMEOVER');
    setStats((prev) => ({
      ...prev,
      ...finalStats,
    }));

    setHighScore((prevHigh) => {
      const newHigh = Math.max(prevHigh, finalStats.score || 0);
      if (newHigh > prevHigh) {
        try {
          localStorage.setItem(LOCAL_STORAGE_HIGH_SCORE, newHigh.toString());
        } catch {
          // ignore storage error
        }
      }
      return newHigh;
    });
  }, []);

  // Completely stable callback: updates stats without restarting game engine
  const handleUpdateStats = useCallback((liveStats) => {
    setStats((prev) => ({
      ...prev,
      ...liveStats,
    }));
    setHighScore((prevHigh) => {
      if (liveStats.score > prevHigh) {
        try {
          localStorage.setItem(LOCAL_STORAGE_HIGH_SCORE, liveStats.score.toString());
        } catch {
          // ignore
        }
        return liveStats.score;
      }
      return prevHigh;
    });
  }, []);

  const handleImageUpload = (dataUrl) => {
    setCustomLeaderImg(dataUrl);
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_IMG, dataUrl);
    } catch {
      // ignore
    }
  };

  const handleResetImage = () => {
    setCustomLeaderImg(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_CUSTOM_IMG);
    } catch {
      // ignore
    }
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleJumpPress = () => {
    window.dispatchEvent(new CustomEvent('game:jump'));
  };

  const handleKickPress = () => {
    window.dispatchEvent(new CustomEvent('game:kick'));
  };

  return (
    <div className="game-wrapper">
      <div className="game-screen-container">
        {/* HUD (Visible while playing or in game over) */}
        {gameState !== 'START' && (
          <HUD
            stats={stats}
            highScore={highScore}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        )}

        {/* Core Canvas 60 FPS Engine */}
        <GameCanvas
          gameState={gameState}
          onGameOver={handleGameOver}
          onUpdateStats={handleUpdateStats}
          customLeaderImg={customLeaderImg}
        />

        {/* Start Screen Overlay */}
        {gameState === 'START' && (
          <StartScreen
            onStart={handleStartGame}
            customLeaderImg={customLeaderImg}
            onImageUpload={handleImageUpload}
            onResetImage={handleResetImage}
            highScore={highScore}
          />
        )}

        {/* Game Over Modal Overlay */}
        {gameState === 'GAMEOVER' && (
          <GameOverModal
            stats={stats}
            highScore={highScore}
            onRestart={handleStartGame}
          />
        )}

        {/* On-Screen Touch Controls (Active while playing) */}
        {gameState === 'PLAYING' && (
          <TouchControls onJump={handleJumpPress} onKick={handleKickPress} />
        )}
      </div>
    </div>
  );
}

export default App;
