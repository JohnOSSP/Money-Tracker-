const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function makeIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0c0b0a';
  ctx.fillRect(0, 0, size, size);

  // Rounded rect background
  const r = size * 0.22;
  ctx.fillStyle = '#181615';
  ctx.beginPath();
  ctx.roundRect(size*0.08, size*0.08, size*0.84, size*0.84, r);
  ctx.fill();

  // Accent circle
  ctx.fillStyle = '#d99a5b';
  ctx.beginPath();
  ctx.arc(size*0.5, size*0.42, size*0.22, 0, Math.PI*2);
  ctx.fill();

  // Dollar sign
  ctx.fillStyle = '#0c0b0a';
  ctx.font = `bold ${size*0.28}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('₿', size*0.5, size*0.44);

  // Bottom bar
  ctx.fillStyle = '#d99a5b';
  ctx.fillRect(size*0.2, size*0.72, size*0.6, size*0.06);
  ctx.fillStyle = '#c97f63';
  ctx.fillRect(size*0.2, size*0.82, size*0.35, size*0.06);

  return canvas.toBuffer('image/png');
}

try {
  fs.writeFileSync(path.join(__dirname, 'icons/icon-192.png'), makeIcon(192));
  fs.writeFileSync(path.join(__dirname, 'icons/icon-512.png'), makeIcon(512));
  console.log('Icons generated');
} catch(e) {
  console.log('Canvas not available, using SVG fallback');
}
