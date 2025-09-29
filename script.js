/* I AM HUMAN — Portal sequence */
(() => {
  // ====== CONFIG ======
  const MASK_URL = "new_mask.png"; // Path relative to assets/js/
  const USB_URL  = "usb_source.png";      // Path relative to assets/js/

  const LOOP = 25000;
  const T = {
    static: [0, 1000],        // 1 second shorter
    mask:   [1000, 1250],     // shifted by -1000ms
    plant:  [1500, 9674],     // 8.174 seconds: 5% faster typing (0.7048525s per line)
    climax: [9574, 9794],     // 220ms climax sequence: 100ms invert + 120ms collapse
    drive:  [9674, 11174],    // 1.5 seconds for USB to appear with glitch
    cta:    [11304, 18304],   // CTA fades in slowly and calmly 0.5s earlier, USB visible 2 seconds longer
  };

  const LINE1 = "a hard drive was found";
  const LINE2 = "this was on it";
  const LINE3 = "Only one lives";
  const LINE4 = "You decide which";

  // ====== Canvas ======
  const cv = document.getElementById('portal');
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const CTA = document.getElementById('cta');
  let DPR=1, W=0, H=0, start=0;
  let stableUsbReady = false; // Moved from line 71 to fix reference error

  const ncv = document.createElement('canvas');
  const nctx = ncv.getContext('2d', { willReadFrequently: true });

  function resize(){
    DPR = Math.max(1, Math.min(2, window.devicePixelRatio||1));
    cv.width = Math.floor(innerWidth * DPR);
    cv.height= Math.floor(innerHeight* DPR);
    cv.style.width='100vw'; cv.style.height='100vh';
    ctx.setTransform(1,0,0,1,0,0);
    W=cv.width; H=cv.height;
    
    // Mobile optimization: Reduce static buffer size on narrow screens
    const staticScale = innerWidth < 768 ? 6 : 4;
    ncv.width = Math.max(160, Math.floor(W/staticScale));
    ncv.height= Math.max(90,  Math.floor(H/staticScale));
    
    // Invalidate stable USB cache on resize
    stableUsbReady = false;
  }
  addEventListener('resize', resize, { passive:true });
  resize();

  // ====== Assets ======
  const maskImg = new Image();
  let maskReady=false;
  if (MASK_URL){
    maskImg.src = MASK_URL + '?v=' + Date.now();
    maskImg.onload = () => maskReady = true;
  }

  const usbImg = new Image();
  let usbReady=false;
  usbImg.src = USB_URL + '?v=' + Date.now();
  usbImg.onload = () => {
    usbReady = true;
    stableUsbReady = false; // Force regeneration of stable USB
  };

  const ucv = document.createElement('canvas');
  const uctx = ucv.getContext('2d', { willReadFrequently: true });
  
  // Performance optimization: Pre-processed USB canvas for stable phase
  const stableUsbCanvas = document.createElement('canvas');
  const stableUsbCtx = stableUsbCanvas.getContext('2d', { willReadFrequently: true });
  
  // Reusable mask canvas to avoid recreation
  const maskCanvas = document.createElement('canvas');
  const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
  
  // Mobile performance: Reduce static update frequency
  let lastStaticUpdate = 0;
  const staticUpdateInterval = window.innerWidth < 768 ? 33 : 16; // 30fps on mobile, 60fps on desktop
  let animationComplete = false; // Flag to prevent timing resets after CTA click
  
  // Accessibility: Check for reduced motion preference
  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let isReducedMotion = prefersReducedMotion();
  
  // Listen for reduced motion changes
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    isReducedMotion = e.matches;
    if (isReducedMotion) {
      // Show CTA immediately when reduced motion is enabled
      CTA.classList.add('show');
    }
  });

  // ====== Helpers ======
  const rnd = Math.random;
  const jitter = k => (rnd()*k - k/2);

  function drawStatic(staticFade = 1, staticSlow = 1, collapseMode = false){
    // Mobile performance: Skip static updates if too frequent (reduce interval in collapse mode but don't disable)
    const now = Date.now();
    const mobileDevice = window.innerWidth < 768;
    const effectiveInterval = collapseMode ? 
      (mobileDevice ? Math.max(33, staticUpdateInterval) : staticUpdateInterval * 0.5) : 
      staticUpdateInterval;
    if (now - lastStaticUpdate < effectiveInterval) {
      // Reuse existing static but apply any scaling
      ctx.save();
      
      // In collapse mode, apply dramatic opacity reduction while keeping some shimmer
      if (collapseMode) {
        ctx.globalAlpha = 0.12; // Very low opacity but still visible
      } else {
        ctx.globalAlpha = staticFade;
      }
      
      ctx.drawImage(ncv, 0, 0, W, H);
      ctx.restore();
      return;
    }
    lastStaticUpdate = now;
    
    const id = nctx.createImageData(ncv.width, ncv.height);
    const d = id.data;
    for (let i=0;i<d.length;i+=4){
      let v = (rnd()*100)+120;
      
      // Dramatic collapse: much darker but keep faint shimmer
      if (collapseMode) {
        v = (rnd()*15)+8; // Very dark (8-23) but still some noise
      }
      
      d[i]=d[i+1]=d[i+2]=v; d[i+3]=255;
    }
    nctx.putImageData(id,0,0);

    // Reduce horizontal lines when slowing down, almost none in collapse
    const lineChance = collapseMode ? 0.02 * staticSlow : 0.09 * staticSlow;
    if (rnd() < lineChance){
      nctx.globalAlpha = collapseMode ? 0.3 : 0.75; 
      nctx.fillStyle = collapseMode ? '#444' : '#fff';
      const y = (rnd()*ncv.height)|0, h = 1 + (rnd()*2|0);
      nctx.fillRect(0,y,ncv.width,h);
      nctx.globalAlpha = 1;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.save();
    
    // In collapse mode, apply dramatic opacity reduction while keeping some shimmer
    if (collapseMode) {
      ctx.globalAlpha = 0.12; // Very low opacity but still visible
    } else {
      ctx.globalAlpha = staticFade;
    }
    
    ctx.drawImage(ncv, 0,0, W,H);
    ctx.restore();

    const g = ctx.createRadialGradient(W/2,H/2, Math.min(W,H)*0.2, W/2,H/2, Math.max(W,H)*0.7);
    g.addColorStop(0,'rgba(0,0,0,0)');
    g.addColorStop(1,`rgba(0,0,0,${0.35 * staticFade})`);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  }

  function drawMaskFlicker(tNorm){
    // No need to check maskReady here since it's checked before calling
    const baseW = W*1.2376; const r = maskImg.height/maskImg.width; const baseH = baseW*r;
    const a = 0.18 + 0.15 * Math.abs(Math.sin(tNorm*Math.PI*2.1));
    
    // Reuse mask canvas to avoid recreation (performance optimization)
    // Fix: Round dimensions to avoid float/integer mismatch causing unnecessary reallocations
    const w = Math.round(baseW), h = Math.round(baseH);
    if (maskCanvas.width !== w || maskCanvas.height !== h) {
      maskCanvas.width = w;
      maskCanvas.height = h;
    }
    maskCtx.clearRect(0, 0, w, h);
    
    // Draw mask to reusable canvas
    maskCtx.drawImage(maskImg, 0, 0, w, h);
    
    // Get image data and make light colors transparent
    const imageData = maskCtx.getImageData(0, 0, w, h);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      
      // If pixel is dark (black background), make it transparent
      if (brightness < 50) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      } else {
        // Make visible pixels 20% darker
        data[i] = Math.floor(r * 0.8);
        data[i + 1] = Math.floor(g * 0.8);
        data[i + 2] = Math.floor(b * 0.8);
      }
    }
    
    // Put the processed data back
    maskCtx.putImageData(imageData, 0, 0);
    
    // Draw the processed mask
    ctx.save();
    ctx.globalAlpha = a;
    ctx.drawImage(maskCanvas, W/2 - w/2 - 50 + jitter(6), H/2 - h/2 + jitter(6));
    ctx.restore();
  }

  function typewriter(line, x, y, progress, px, pauseAtHalf = false){
    ctx.font = `bold ${px*2}px "Courier New", Courier, monospace`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    
    let adjustedProgress = progress;
    
    // Handle pause at halfway point for second sentence
    if (pauseAtHalf && progress > 0.45 && progress < 0.55) {
      adjustedProgress = 0.45; // Pause at 45% through the sentence
    } else if (pauseAtHalf && progress >= 0.55) {
      adjustedProgress = (progress - 0.1) / 0.9; // Resume after pause, compressed timing
    }
    
    const n = Math.floor(adjustedProgress * line.length);
    const shown = line.slice(0, n);
    
    // Save current context state
    ctx.save();
    
    // Draw text with glow effects
    function drawTextWithGlow(text, textX, textY) {
      // Black shadow for readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = '#e9e9ea';
      ctx.fillText(text, textX, textY);
      
      // White glow for signal-like haze
      ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#e9e9ea';
      ctx.fillText(text, textX, textY);
      
      // Final clean text pass
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#e9e9ea';
      ctx.fillText(text, textX, textY);
    }
    
    drawTextWithGlow(shown, x, y);
    
    // Blinking cursor - shows during typing and continues after completion
    const cursorBlink = Math.floor(Date.now() / 500) % 2 === 0; // Blink every 500ms
    if (cursorBlink) {
      const cursorX = n < line.length ? 
        x + ctx.measureText(shown).width/2 + 6 : // During typing
        x + ctx.measureText(line).width/2 + 6;   // After completion
      drawTextWithGlow('_', cursorX, y);
    }
    
    // Restore context state
    ctx.restore();
  }

  function drawUsbPngJitter(tNorm, withGlitch = false, glowProgress = 0, climaxBoost = false){
    if(!usbReady) return;

    // Responsive scaling: Ensure USB fits both width and height constraints
    const maxWidthScale = 0.763733124; // 76.4% of width
    const maxHeightScale = 0.58; // Max 58% of height to prevent overflow
    const ratio = usbImg.height / usbImg.width;
    
    const widthConstrainedW = W * maxWidthScale;
    const widthConstrainedH = widthConstrainedW * ratio;
    
    const heightConstrainedH = H * maxHeightScale;
    const heightConstrainedW = heightConstrainedH / ratio;
    
    // Use the smaller scale to ensure it fits in both dimensions
    const targetW = widthConstrainedH <= H * maxHeightScale ? widthConstrainedW : heightConstrainedW;
    const targetH = widthConstrainedH <= H * maxHeightScale ? widthConstrainedH : heightConstrainedH;
    
    const cx = W/2, cy = H/2; // Center both horizontally and vertically

    // Performance optimization: Use pre-processed stable USB when not glitching
    if (!withGlitch && stableUsbReady && 
        stableUsbCanvas.width === (targetW|0) && 
        stableUsbCanvas.height === (targetH|0)) {
      // Use cached stable USB
      ucv.width = targetW|0; ucv.height = targetH|0;
      uctx.clearRect(0,0,ucv.width,ucv.height);
      uctx.drawImage(stableUsbCanvas, 0, 0);
    } else {
      // Process USB image (either for glitch or to create stable cache)
      ucv.width = targetW|0; ucv.height = targetH|0;
      uctx.clearRect(0,0,ucv.width,ucv.height);
      uctx.drawImage(usbImg, 0,0, ucv.width, ucv.height);

      const id = uctx.getImageData(0,0,ucv.width,ucv.height);
      const d  = id.data;
      for(let i=0;i<d.length;i+=4){
        const y = 0.2126*d[i] + 0.7152*d[i+1] + 0.0722*d[i+2];
        // Make both very light and very dark pixels transparent (background removal)
        if (y > 200 || y < 50){ 
          d[i+3]=0; 
        } else {
          // Keep medium brightness pixels (the actual USB stick) in their original colors
          d[i+3]=255;
          
          // Add glitch effect during appearance
          if (withGlitch && Math.random() < 0.3) {
            const glitchIntensity = Math.random() * 0.6;
            d[i] = Math.min(255, d[i] + (Math.random() - 0.5) * 100 * glitchIntensity);
            d[i+1] = Math.min(255, d[i+1] + (Math.random() - 0.5) * 100 * glitchIntensity);
            d[i+2] = Math.min(255, d[i+2] + (Math.random() - 0.5) * 100 * glitchIntensity);
          }
        }
      }
      uctx.putImageData(id,0,0);
      
      // Cache stable version for reuse
      if (!withGlitch && !stableUsbReady) {
        stableUsbCanvas.width = ucv.width;
        stableUsbCanvas.height = ucv.height;
        stableUsbCtx.clearRect(0, 0, stableUsbCanvas.width, stableUsbCanvas.height);
        stableUsbCtx.drawImage(ucv, 0, 0);
        stableUsbReady = true;
      }
    }

    let alpha = 0.25 + 0.55 * Math.min(1, tNorm*1.2);
    let offsetX = jitter(2);
    let offsetY = jitter(2);
    
    // Enhanced glitch effects during appearance
    if (withGlitch) {
      // Random alpha flickering
      alpha *= (0.4 + Math.random() * 0.6);
      // Stronger position jitter
      offsetX = jitter(8);
      offsetY = jitter(8);
      // Random scaling
      const glitchScale = 0.95 + Math.random() * 0.1;
      const scaledW = targetW * glitchScale;
      const scaledH = targetH * glitchScale;
      
      ctx.save();
      
      // Dramatic flickering glow - more random and aggressive like the text
      const time = Date.now() * 0.001; // Even slower base time for unpredictability
      const randomTime1 = time * (1.3 + Math.random() * 2.8); // Random frequency 1.3-4.1
      const randomTime2 = time * (2.1 + Math.random() * 3.4); // Random frequency 2.1-5.5
      const randomTime3 = time * (0.7 + Math.random() * 1.8); // Random frequency 0.7-2.5
      
      const flicker1 = Math.sin(randomTime1) * 0.8 + 0.2; // More dramatic range 0.2-1.0
      const flicker2 = Math.sin(randomTime2) * 0.7 + 0.3; // Secondary flicker 0.3-1.0  
      const flicker3 = Math.cos(randomTime3) * 0.6 + 0.4; // Tertiary flicker 0.4-1.0
      
      // Much more frequent and dramatic random spikes/drops
      const randomFlicker = Math.random() < 0.4 ? 0.1 + Math.random() * 1.9 : 0.5 + Math.random() * 0.8;
      const flickerMultiplier = flicker1 * flicker2 * flicker3 * randomFlicker;
      
      // Strong base glow that's always visible
      const baseGlow = 0.6; // Much stronger base glow
      let interferenceGlow = (baseGlow + glowProgress * 0.4) * flickerMultiplier;
      let glowSize = (12 + 16 * glowProgress) * (0.5 + flickerMultiplier * 0.8); // Much larger glow
      
      // Climax boost: 2.2x multiplier for dramatic effect
      if (climaxBoost) {
        interferenceGlow = Math.min(2.5, interferenceGlow * 2.2);
        glowSize *= 1.6; // Also boost glow size
      }
      
      // Draw multiple dramatic glow layers
      for (let i = 1; i <= 4; i++) {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = glowSize * i / 4;
        ctx.globalAlpha = alpha * interferenceGlow * (0.6 / i); // Stronger glow opacity
        ctx.drawImage(ucv, cx - scaledW/2 + offsetX, cy - scaledH/2 + offsetY, scaledW, scaledH);
      }
      
      // Reset shadow for main glitched image
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      ctx.globalAlpha = alpha;
      
      // Add color shift and brightness increase as it comes into focus with flicker
      const focusProgress = glowProgress; // Use glow progress to simulate coming into focus
      
      // Dramatic brightness flickering - very obvious
      const brightnessTime = Date.now() * 0.005;
      const brightnessFlicker = Math.sin(brightnessTime * 1.8) * 0.5 + 0.5; // Much more dramatic range
      const irregularFlicker = Math.random() < 0.2 ? 0.2 + Math.random() * 1.3 : 1; // More frequent, extreme drops
      const flickerBrightness = brightnessFlicker * irregularFlicker;
      
      const baseBrightness = 0.8; // Higher base brightness
      const brightness = (baseBrightness + (focusProgress * 0.8)) * flickerBrightness; // Much more dramatic brightness changes
      
      if (Math.random() < 0.2) {
        ctx.filter = `hue-rotate(${Math.random() * 360}deg) brightness(${brightness + Math.random() * 0.2})`;
      } else {
        ctx.filter = `brightness(${brightness})`;
      }
      
      ctx.drawImage(ucv, cx - scaledW/2 + offsetX, cy - scaledH/2 + offsetY, scaledW, scaledH);
      ctx.restore();
    } else {
      // Add glow effect when stable - intense, focused glow
      ctx.save();
      ctx.globalAlpha = alpha;
      
      // Glow effect - draw multiple layers with increasing blur and decreasing opacity
      if (glowProgress > 0) {
        // Extremely dramatic flickering for stable phase - like a severely failing neon tube
        const stableGlowTime = Date.now() * 0.004;
        const primaryFlicker = Math.sin(stableGlowTime * 1.2) * 0.6 + 0.4; // Much more dramatic main flicker
        const secondaryFlicker = Math.sin(stableGlowTime * 2.8) * 0.4 + 0.6; // More dramatic secondary
        const tertiaryFlicker = Math.sin(stableGlowTime * 4.1) * 0.3 + 0.7; // More dramatic overlay
        const randomSpike = Math.random() < 0.15 ? 2.0 + Math.random() * 1.0 : 1; // More frequent, brighter spikes
        const randomDrop = Math.random() < 0.1 ? 0.1 + Math.random() * 0.3 : 1; // More frequent, darker drops
        
        const flickerMultiplier = primaryFlicker * secondaryFlicker * tertiaryFlicker * randomSpike * randomDrop;
        
        const glowIntensity = glowProgress * 1.2 * flickerMultiplier; // Much stronger glow
        const glowSize = 35 * glowProgress * (0.4 + flickerMultiplier * 1.0); // Much larger, more dramatic glow
        
        for (let i = 1; i <= 4; i++) {
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = glowSize * i / 4;
          ctx.globalAlpha = alpha * glowIntensity * (0.25 / i);
          ctx.drawImage(ucv, cx - targetW/2 + offsetX, cy - targetH/2 + offsetY);
        }
        
        // Reset shadow for main image
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.globalAlpha = alpha;
      }
      
      // Dramatic brightness flickering for stable phase
      const stableBrightnessTime = Date.now() * 0.006;
      const brightnessFlicker = Math.sin(stableBrightnessTime * 1.9) * 0.6 + 0.4; // Much more dramatic brightness flicker
      const unstableFlicker = Math.random() < 0.25 ? 0.2 + Math.random() * 1.4 : 1; // More frequent, extreme unstable moments
      const focusBrightness = (1.2 + (glowProgress * 0.8)) * brightnessFlicker * unstableFlicker;
      ctx.filter = `brightness(${focusBrightness})`;
      
      ctx.drawImage(ucv, cx - targetW/2 + offsetX, cy - targetH/2 + offsetY);
      ctx.restore();
    }
  }

  function loop(now){
    // Honor reduced-motion preference - skip animation if user prefers reduced motion
    if (isReducedMotion) {
      CTA.classList.add('show');
      return; // Exit loop without requesting next frame
    }
    
    // Power saving: pause when tab is hidden
    if (document.visibilityState === 'hidden') {
      requestAnimationFrame(loop);
      return;
    }
    
    if (!start) {
      start = now;
    }
    const t = (now - start) % LOOP;

    // Calculate static fade and slow for USB focus effect
    let staticFade = 1;
    let staticSlow = 1;
    
    if (t >= T.drive[0]) {
      const driveProgress = Math.min(1, (t - T.drive[0]) / (T.drive[1] - T.drive[0]));
      staticFade = 1 - (driveProgress * 0.7); // Fade to 30% opacity
      staticSlow = 1 - (driveProgress * 0.8); // Slow to 20% speed
    }
    
    // Climax sequence: invert then collapse
    let collapseMode = false;
    let canvasInvert = false;
    
    if (t >= T.climax[0] && t < T.climax[1]) {
      const climaxProgress = (t - T.climax[0]) / (T.climax[1] - T.climax[0]);
      
      if (climaxProgress < 0.45) {
        // First 100ms: dramatic invert effect
        canvasInvert = true;
      } else {
        // Remaining 120ms: collapse to dark static
        collapseMode = true;
      }
    } else if (t >= T.climax[1] && t < T.drive[1]) {
      // Continue collapse mode until USB is fully revealed
      collapseMode = true;
    }
    
    // Apply canvas invert effect if needed
    if (canvasInvert) {
      cv.style.filter = 'invert(1) brightness(1.2) contrast(1.4)';
    } else {
      cv.style.filter = '';
    }
    
    drawStatic(staticFade, staticSlow, collapseMode);

    // Mask phase - more flexible timing to ensure it always appears
    if (t>=T.mask[0] && t<T.plant[0] && maskReady){
      // Extended window: from normal mask start until plant phase begins
      const maskWindow = T.plant[0] - T.mask[0]; // 500ms total window instead of 250ms
      const elapsed = t - T.mask[0];
      const tn = Math.min(1, elapsed / 250); // Still use 250ms for the animation cycle, but loop if needed
      if (Math.random()<0.9) drawMaskFlicker(tn);
    }

    if (t>=T.plant[0] && t<T.plant[1]){
      ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(0,0,W,H);
      const tn = (t-T.plant[0])/(T.plant[1]-T.plant[0]);
      const px = Math.max(14, Math.min(W,H)/34 | 0);

      // Adjusted timing: faster typing (0.7048525s) + display, with pause in line 2
      if (tn < 0.196) {
        // Line 1: 0-1.655s (0.7048525s typing + 0.95s display)
        const elapsed = tn / 0.196;
        if (elapsed < 0.426) {
          // Typing phase (first 42.6% of time)
          const p1 = elapsed / 0.426;
          typewriter(LINE1, W/2, H*0.46, p1, px);
        } else {
          // Display phase (remaining 57.4% of time)
          typewriter(LINE1, W/2, H*0.46, 1, px);
        }
      } else if (tn < 0.392) {
        // Line 2: 1.655-3.310s (0.7048525s typing with pause + 0.95s display)
        const elapsed = (tn - 0.196) / 0.196;
        if (elapsed < 0.426) {
          // Typing phase with pause
          const p2 = elapsed / 0.426;
          typewriter(LINE2, W/2, H*0.46, p2, px, true); // pauseAtHalf = true
        } else {
          // Display phase
          typewriter(LINE2, W/2, H*0.46, 1, px);
        }
      } else if (tn < 0.588) {
        // Line 3: 3.310-4.965s (0.7048525s typing + 0.95s display)
        const elapsed = (tn - 0.392) / 0.196;
        if (elapsed < 0.426) {
          // Typing phase
          const p3 = elapsed / 0.426;
          typewriter(LINE3, W/2, H*0.46, p3, px);
        } else {
          // Display phase
          typewriter(LINE3, W/2, H*0.46, 1, px);
        }
      } else if (tn < 1.0) {
        // Line 4: 4.965-8.174s (0.7048525s typing + 2.504s display with flicker)
        const elapsed = (tn - 0.588) / 0.412;
        if (elapsed < 0.198) {
          // Typing phase (first 19.8% of time)
          const p4 = elapsed / 0.198;
          typewriter(LINE4, W/2, H*0.46, p4, px);
        } else {
          // Display phase with dying light bulb flicker starting 0.3s earlier
          const displayProgress = (elapsed - 0.198) / (1 - 0.198);
          if (displayProgress > 0.67) {
            // Random flicker like a dying light bulb - quick and erratic (starts 0.3s earlier)
            const flickerIntensity = Math.random() > 0.3 ? (0.4 + Math.random() * 0.6) : 0.1;
            ctx.save();
            ctx.globalAlpha = flickerIntensity;
            typewriter(LINE4, W/2, H*0.46, 1, px);
            ctx.restore();
          } else {
            // Normal display
            typewriter(LINE4, W/2, H*0.46, 1, px);
          }
        }
      }
    }

    // No text fade - USB appears immediately after final text

    // USB appears with glitch effect, then stays visible during CTA with growing glow
    if (t>=T.drive[0] && t<T.drive[1]){
      const tn = (t-T.drive[0])/(T.drive[1]-T.drive[0]);
      // Calculate glow progress based on static fade - as interference reduces, glow increases
      let interferenceGlow = 1 - staticFade; // Inverted: as static fades, glow grows
      
      // Check if we're in climax boost period
      const inClimaxBoost = t >= T.climax[1] && t < T.drive[1];
      
      drawUsbPngJitter(tn, true, interferenceGlow, inClimaxBoost); // with glitch effect and growing glow
    } else if (t>=T.drive[1] && t<T.cta[1]){
      const ctaProgress = (t-T.drive[1])/(T.cta[1]-T.drive[1]);
      let glowProgress = Math.min(1, ctaProgress * 2); // Glow reaches max at halfway point
      
      // Continue enhanced glow for first part of CTA phase
      const inCtaClimaxBoost = ctaProgress < 0.3;
      if (inCtaClimaxBoost) {
        glowProgress = Math.min(2.0, glowProgress * 1.8); // 1.8x boost for first 30% of CTA phase
      }
      
      drawUsbPngJitter(1, false, glowProgress, inCtaClimaxBoost); // stable USB with growing glow
    }

    // Get USB position info for CTA anchoring
    let usbBottomY = H/2; // Default fallback
    let usbCenterX = W/2;
    
    if (usbReady) {
      // Calculate USB dimensions (same logic as drawUsbPngJitter)
      const maxWidthScale = 0.763733124;
      const maxHeightScale = 0.58;
      const ratio = usbImg.height / usbImg.width;
      
      const widthConstrainedW = W * maxWidthScale;
      const widthConstrainedH = widthConstrainedW * ratio;
      const heightConstrainedH = H * maxHeightScale;
      const heightConstrainedW = heightConstrainedH / ratio;
      
      const targetW = widthConstrainedH <= H * maxHeightScale ? widthConstrainedW : heightConstrainedW;
      const targetH = widthConstrainedH <= H * maxHeightScale ? widthConstrainedH : heightConstrainedH;
      
      usbCenterX = W/2;
      const usbCenterY = H/2;
      usbBottomY = usbCenterY + targetH/2;
    }

    if (t>=T.cta[0] && !animationComplete){
      // Legacy mode: Use CSS-rendered CTA instead of canvas (reverted to 5 hours ago)
      // Show CTA button with CSS styling (no canvas text rendering)
      if (CTA.textContent !== "I AM HUMAN") {
        CTA.textContent = "";
      }
      CTA.classList.add('show');
      
      // Add climax boost class for enhanced glow during first 1.5s of CTA reveal
      const ctaElapsed = t - T.cta[0]; 
      if (ctaElapsed < 1500) { // First 1.5 seconds
        CTA.classList.add('climax-boost');
      } else {
        CTA.classList.remove('climax-boost');
      }
    } else if (!animationComplete) {
      CTA.classList.remove('show');
    }

    if (!animationComplete) {
      requestAnimationFrame(loop);
    }
  }

  CTA.addEventListener('click', () => {
    // Stop animation loop from resetting CTA state
    animationComplete = true;
    
    const flash = document.createElement('div');
    flash.style.cssText = `position:fixed;inset:0;background:#000;animation:flash .18s ease-out forwards;pointer-events:none;z-index:9999;`;
    document.body.appendChild(flash);
    const style = document.createElement('style');
    style.textContent = `@keyframes flash{0%{opacity:0}20%{opacity:1}100%{opacity:0}}`;
    document.head.appendChild(style);

    // Set final state that won't be overridden
    CTA.textContent = "I AM HUMAN";
    CTA.classList.add('show');
    CTA.classList.add('climax-boost');
    
    setTimeout(() => {
      try{ parent.postMessage({ type:'iah-open' }, '*'); }catch(e){}
    }, 350);
  });

  // Start animation loop (unless reduced motion is preferred)
  if (isReducedMotion) {
    // Immediately show CTA for reduced motion users
    CTA.classList.add('show');
  } else {
    requestAnimationFrame(loop);
  }
})();
