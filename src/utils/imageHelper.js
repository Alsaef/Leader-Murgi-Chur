// Helper to process uploaded leader images and ensure perfect head alignment

export function processLeaderImage(dataUrl, callback) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    canvas.width = 300;
    canvas.height = 300;

    let sx, sy, sw, sh;
    if (h > w * 1.25) {
      // Tall portrait or full body (like 768x1024)
      // Focus on the head and face area at top
      sw = w * 0.72;
      sh = sw;
      sx = (w - sw) / 2;
      sy = Math.max(0, h * 0.015);
    } else {
      // Face photo or normal aspect ratio
      const size = Math.min(w, h);
      sx = (w - size) / 2;
      sy = Math.max(0, (h - size) * 0.1);
      sw = size;
      sh = size;
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 300, 300);
    callback(canvas.toDataURL('image/png'));
  };
  img.onerror = () => {
    callback(dataUrl);
  };
  img.src = dataUrl;
}
