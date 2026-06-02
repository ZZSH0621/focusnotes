
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

// 图标尺寸
const sizes = [32, 128, 256];
const iconsDir = __dirname + '/src-tauri/icons';

async function processIcon() {
  // 创建临时的简单图标（因为我们没有实际的图片数据）
  // 在实际应用中，您应该替换这里的代码来加载真实图片

  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // 填充背景
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);

    // 画一个简单的芯片图标
    ctx.fillStyle = '#ffffff';
    const chipSize = size * 0.4;
    const x = (size - chipSize) / 2;
    const y = (size - chipSize) / 2;
    
    // 芯片主体
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(x, y, chipSize, chipSize);
    
    // 芯片边框
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, size / 32);
    ctx.strokeRect(x, y, chipSize, chipSize);
    
    // 引脚
    ctx.fillStyle = '#ffffff';
    const pinWidth = chipSize / 6;
    const pinHeight = chipSize / 8;
    const pinSpacing = chipSize / 4;
    
    // 左侧引脚
    for (let i = 0; i &lt; 3; i++) {
      ctx.fillRect(x - pinWidth, y + pinSpacing * i + pinSpacing/2, pinWidth, pinHeight);
    }
    
    // 右侧引脚
    for (let i = 0; i &lt; 3; i++) {
      ctx.fillRect(x + chipSize, y + pinSpacing * i + pinSpacing/2, pinWidth, pinHeight);
    }
    
    // 顶部引脚
    for (let i = 0; i &lt; 3; i++) {
      ctx.fillRect(x + pinSpacing * i + pinSpacing/2, y - pinHeight, pinHeight, pinWidth);
    }
    
    // 底部引脚
    for (let i = 0; i &lt; 3; i++) {
      ctx.fillRect(x + pinSpacing * i + pinSpacing/2, y + chipSize, pinHeight, pinWidth);
    }
    
    // 中心芯片
    ctx.fillStyle = '#4caf50';
    const centerSize = chipSize / 2;
    ctx.fillRect(x + chipSize/4, y + chipSize/4, centerSize, centerSize);
    ctx.strokeRect(x + chipSize/4, y + chipSize/4, centerSize, centerSize);

    const buffer = canvas.toBuffer('image/png');
    const filename = size === 32 ? '32x32.png' : 
                     size === 128 ? '128x128.png' : 'icon.png';
    fs.writeFileSync(iconsDir + '/' + filename, buffer);
    console.log(`Saved: ${filename}`);
    
    // 对于128x128，也保存为icon.png
    if (size === 128) {
      fs.writeFileSync(iconsDir + '/icon.png', buffer);
      console.log('Saved: icon.png');
    }
    
    // 对于256x256，保存为128x128@2x.png
    if (size === 256) {
      fs.writeFileSync(iconsDir + '/128x128@2x.png', buffer);
      console.log('Saved: 128x128@2x.png');
    }
  }

  console.log('\n✅ Icons processed!');
}

processIcon().catch(console.error);

