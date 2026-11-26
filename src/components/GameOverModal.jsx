import { useState, useEffect } from 'react';
import { CHAT_PHRASES, getLeaderRank } from '../utils/constants';
import { generateScoreCardBlob } from '../utils/scoreCardGenerator';

const GameOverModal = ({ stats, highScore, onRestart }) => {
  const [headline] = useState(
    () =>
      CHAT_PHRASES.BREAKING_HEADLINES[
        Math.floor(Math.random() * CHAT_PHRASES.BREAKING_HEADLINES.length)
      ]
  );
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const isNewRecord = (stats.score || 0) >= (highScore || 0) && (stats.score || 0) > 0;
  const rank = getLeaderRank(stats.score || 0);

  useEffect(() => {
    // Grace period before keyboard restart to prevent accidental skip from rapid key taps
    let canRestart = false;
    const timer = setTimeout(() => {
      canRestart = true;
    }, 350);

    const handleKeyDown = (e) => {
      if (!canRestart || e.repeat) return;
      if (['Space', 'Enter'].includes(e.code)) {
        e.preventDefault();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onRestart]);

  const toBengaliNumber = (num) => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, (w) => bengaliDigits[+w]);
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    setShareStatus('⏳ স্কোরকার্ড ইমেজ তৈরি হচ্ছে...');

    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost:5174/';
    const shareText = `🚨 লিডার মুরগি চুর খেলায় আমি ${toBengaliNumber(
      stats.distance || 0
    )} মিটার দৌড়াইয়া ${toBengaliNumber(
      stats.kicks || 0
    )} জনকে লাত্থি মারছি! মোট স্কোর: ${toBengaliNumber(
      stats.score || 0
    )} (${rank.badge} পদবি: ${rank.title})। পারলে আমার রেকর্ড ভাঙো! 🐔🏃💨\n\nগেম লিংক: ${shareUrl}`;

    try {
      // 1. Generate high-quality scorecard image via HTML5 Canvas
      const blob = await generateScoreCardBlob(stats, headline, toBengaliNumber);

      // 2. Mobile / Web Share API with image file
      if (blob && navigator.canShare) {
        const file = new File([blob], 'leader_murgi_chur_score.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'লিডার মুরগি চুর - স্কোরকার্ড',
            text: shareText,
            url: shareUrl,
            files: [file],
          });
          setShareStatus('✅ ফেসবুকে স্কোরকার্ড সফলভাবে শেয়ার হয়েছে!');
          setTimeout(() => setShareStatus(''), 4000);
          setSharing(false);
          return;
        }
      }

      // 3. Desktop / Web Fallback:
      // A) Download the generated scorecard image
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leader_murgi_chur_score.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // B) Copy text and website link to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }

      // C) Open Facebook web share popup
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}&quote=${encodeURIComponent(shareText)}`;
      window.open(fbUrl, '_blank', 'noopener,noreferrer,width=640,height=580');

      setShareStatus('✅ স্কোরকার্ড ডাউনলোড হয়েছে এবং ফেসবুক ওপেন হয়েছে!');
      setTimeout(() => setShareStatus(''), 5000);
    } catch (err) {
      console.error('Share error:', err);
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}&quote=${encodeURIComponent(shareText)}`;
      window.open(fbUrl, '_blank', 'noopener,noreferrer,width=640,height=580');
      setShareStatus('✅ ফেসবুক শেয়ার ওপেন হয়েছে!');
      setTimeout(() => setShareStatus(''), 4000);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="overlay-screen gameover-modal">
      <div className="gameover-content">
        {/* Newspaper Style Breaking News Header */}
        <div className="news-banner">
          <div className="news-tag">🚨 জরুরি সংবাদ 🚨</div>
          <h2 className="news-title">গণপিটুনি!</h2>
          <p className="news-headline">{headline}</p>
        </div>

        {/* Crying Leader Feature Section */}
        <div className="gameover-crying-hero">
          <div className="crying-portrait-frame">
            <img
              src="/assets/leader_crying_square.jpg"
              alt="কান্নারত লিডার"
              className="crying-portrait-img"
            />
            <div className="crying-tear-badge">😭💧</div>
          </div>
          <div className="crying-speech-bubble">
            <div className="crying-badge">🚨 কান্নারত লিডারের বয়ান</div>
            <p className="crying-statement">
              "আমি তো মুরগিটা শুধু একটু আদর করতে চাইছিলাম ভাই! এভাবে ঝাঁড়ু আর লাঠি দিয়া গণধোলাই দিল কেন?!"
            </p>
          </div>
        </div>

        {/* New High Score Celebration Banner */}
        {isNewRecord && (
          <div className="new-record-badge">
            🌟 নতুন সেরা রেকর্ড! সাবাশ লিডার! 🌟
          </div>
        )}

        {/* Earned Leader Rank Badge */}
        <div
          className="gameover-rank-banner"
          style={{ background: rank.bg, borderColor: rank.border }}
        >
          <span className="rank-badge-icon">{rank.badge}</span>
          <div className="rank-info">
            <span className="rank-label">অর্জিত পদবি:</span>
            <strong className="rank-title" style={{ color: rank.color }}>
              {rank.title}
            </strong>
            <span className="rank-sub">{rank.subtitle}</span>
          </div>
        </div>

        {/* Detailed Match Statistics */}
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-label">অতিক্রান্ত দূরত্ব</span>
            <span className="stat-val">{toBengaliNumber(stats.distance || 0)} <small>মিটার</small></span>
          </div>

          <div className="stat-box">
            <span className="stat-label">উড়িয়ে দেওয়া মানুষ</span>
            <span className="stat-val">💥 {toBengaliNumber(stats.kicks || 0)} <small>জন</small></span>
          </div>

          <div className="stat-box">
            <span className="stat-label">এনার্জি ড্রিংক সেবন</span>
            <span className="stat-val">⚡ {toBengaliNumber(stats.drinks || 0)} <small>বোতল</small></span>
          </div>

          <div className="stat-box stat-highlight">
            <span className="stat-label">সর্বমোট স্কোর</span>
            <span className="stat-val text-yellow">{toBengaliNumber(stats.score || 0)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-buttons">
          <button className="btn btn-primary restart-btn" onClick={onRestart}>
            🔄 আবার দৌড়ান (PLAY AGAIN)
          </button>

          <button
            className="btn btn-secondary share-btn"
            onClick={handleShare}
            disabled={sharing}
          >
            {sharing ? '⏳ ইমেজ তৈরি হচ্ছে...' : '📢 ফেসবুকে স্কোর শেয়ার করুন'}
          </button>
        </div>

        {shareStatus && <div className="share-status-toast">{shareStatus}</div>}

        <p className="restart-hint">
          (কী-বোর্ডের <strong>Space</strong> অথবা <strong>Enter</strong> চাপলেই সাথে সাথে আবার শুরু হবে)
        </p>
      </div>
    </div>
  );
};

export default GameOverModal;
