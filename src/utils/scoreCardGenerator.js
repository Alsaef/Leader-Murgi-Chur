// Utility to generate a high-quality viral scorecard image for "Leader Murgi Chur"
// Includes the crying leader photo, stats grid, and Bengali news styling

export async function generateScoreCardBlob(stats, headline, bengaliDigitsFn) {
  const canvas = document.createElement('canvas');
  const width = 840;
  const height = 540;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#090d16');
  bgGrad.addColorStop(0.5, '#0f172a');
  bgGrad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Outer border & glow
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, width - 24, height - 24);

  // Inner subtle border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Top News Tag
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 90, 28, 180, 28, 6);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🚨 জরুরি সংবাদ: গণপিটুনি! 🚨', width / 2, 47);

  // Main Title
  ctx.fillStyle = '#f87171';
  ctx.font = 'bold 36px "Hind Siliguri", sans-serif';
  ctx.fillText('লিডার মুরগি চুর', width / 2, 88);

  // Headline
  ctx.fillStyle = '#fef08a';
  ctx.font = '600 15px "Hind Siliguri", sans-serif';
  const cleanHeadline = headline || 'মুরগি বগলদাবা করে পালানোর সময় গণধোলাই খেলেন লিডার!';
  ctx.fillText(cleanHeadline, width / 2, 114);

  // Draw Horizontal Separator
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(35, 128);
  ctx.lineTo(width - 35, 128);
  ctx.stroke();

  // Load and Draw Crying Leader Image
  try {
    const cryingImg = await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = '/assets/leader_crying_square.jpg';
    });

    const photoX = 42;
    const photoY = 145;
    const photoSize = 190;

    if (cryingImg) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoSize, photoSize, 14);
      ctx.clip();
      ctx.drawImage(cryingImg, photoX, photoY, photoSize, photoSize);
      ctx.restore();

      // Photo frame border
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoSize, photoSize, 14);
      ctx.stroke();

      // Crying badge on photo
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(photoX + 15, photoY + photoSize - 26, photoSize - 30, 22, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Hind Siliguri", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('😭 কান্নারত লিডার', photoX + photoSize / 2, photoY + photoSize - 11);
    }
  } catch {
    // ignore
  }

  // Draw Stats Grid on the right side
  const gridX = 255;
  const gridY = 145;
  const boxW = 265;
  const boxH = 90;
  const gap = 12;

  const toB = bengaliDigitsFn || ((n) => String(n));

  const statItems = [
    {
      label: 'অতিক্রান্ত দূরত্ব',
      value: `${toB(stats.distance || 0)} মিটার`,
      color: '#ffffff',
    },
    {
      label: 'উড়িয়ে দেওয়া মানুষ',
      value: `💥 ${toB(stats.kicks || 0)} জন`,
      color: '#f87171',
    },
    {
      label: 'এনার্জি ড্রিংক সেবন',
      value: `⚡ ${toB(stats.drinks || 0)} বোতল`,
      color: '#38bdf8',
    },
    {
      label: 'সর্বমোট স্কোর',
      value: `🏆 ${toB(stats.score || 0)}`,
      color: '#facc15',
      isScore: true,
    },
  ];

  statItems.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const bx = gridX + col * (boxW + gap);
    const by = gridY + row * (boxH + gap);

    // Box background
    ctx.fillStyle = item.isScore ? 'rgba(234, 179, 8, 0.15)' : 'rgba(30, 41, 59, 0.7)';
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 10);
    ctx.fill();

    // Box border
    ctx.strokeStyle = item.isScore ? '#eab308' : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = item.isScore ? 2 : 1;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 13px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.label, bx + boxW / 2, by + 30);

    // Value
    ctx.fillStyle = item.color;
    ctx.font = item.isScore ? 'bold 28px "Hind Siliguri", sans-serif' : 'bold 22px "Hind Siliguri", sans-serif';
    ctx.fillText(item.value, bx + boxW / 2, by + 68);
  });

  // Dramatic Quote Banner below stats
  ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(42, 355, width - 84, 52, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fca5a5';
  ctx.font = 'italic 600 15px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('লিডারের আকুতি: "আমি তো শুধু মুরগিটা দেখতে চাইছিলাম, সবাই ধইরা এভাবে ধোলাই দিল কেন?!" 😭🐔', width / 2, 386);

  // Bottom Footer with Share Call-To-Action & Website Link
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost:5174/';
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 15px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🐔 লিডার মুরগি চুর • পারলে আমার এই রেকর্ড ভেঙে দেখাও!', width / 2, 448);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px monospace';
  ctx.fillText(`🎮 এখনই খেলুন: ${currentUrl.replace(/\/$/, '')}`, width / 2, 476);

  ctx.fillStyle = '#64748b';
  ctx.font = '11px sans-serif';
  ctx.fillText('ইনস্ট্যান্ট আর্কেড গেম • dalalpidan.com স্টাইল ভাইরাল একশন', width / 2, 502);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
}
