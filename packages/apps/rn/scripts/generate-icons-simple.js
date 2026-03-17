const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Simple 1x1 PNG with specific color (RGBA)
function createSimplePNG(width, height, r, g, b, a = 255) {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // color type (RGBA)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  // IDAT chunk (compressed image data)
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      rawData.push(r, g, b, a);
    }
  }
  
  const compressed = require('zlib').deflateSync(Buffer.from(rawData));
  const idatChunk = createChunk('IDAT', compressed);
  
  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type);
  
  const crc = require('zlib').crc32(Buffer.concat([typeBuffer, data]));
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);
  
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// Generate simple colored icons
console.log('Generating simple placeholder icons...\n');

try {
  // icon.png - Pink gradient-like (solid color for now)
  const iconBuffer = createSimplePNG(1024, 1024, 255, 105, 180);
  fs.writeFileSync(path.join(assetsDir, 'icon.png'), iconBuffer);
  console.log('✓ Generated icon.png (1024x1024) - Pink background');

  // adaptive-icon.png - Transparent
  const adaptiveBuffer = createSimplePNG(1024, 1024, 255, 105, 180, 255);
  fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), adaptiveBuffer);
  console.log('✓ Generated adaptive-icon.png (1024x1024)');

  // splash.png - Pink
  const splashBuffer = createSimplePNG(1242, 2436, 255, 105, 180);
  fs.writeFileSync(path.join(assetsDir, 'splash.png'), splashBuffer);
  console.log('✓ Generated splash.png (1242x2436) - Pink background');

  // favicon.png - Small pink
  const faviconBuffer = createSimplePNG(48, 48, 255, 105, 180);
  fs.writeFileSync(path.join(assetsDir, 'favicon.png'), faviconBuffer);
  console.log('✓ Generated favicon.png (48x48)');

  console.log('\n✅ All placeholder icons generated successfully!');
  console.log('\nNote: These are simple colored placeholders.');
  console.log('For production, please replace with proper designed icons.');
  console.log('You can use tools like:');
  console.log('  - https://icon.kitchen/');
  console.log('  - https://appicon.co/');
  console.log('  - Or design in Figma/Photoshop');
} catch (error) {
  console.error('❌ Error generating icons:', error.message);
  process.exit(1);
}
