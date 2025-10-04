/* I AM HUMAN — Portal sequence */
(() => {
  // ====== CONFIG ======
  const MASK_URL = "new_mask1.jpg"; // Path relative to assets/js/
  const USB_URL  = "usb_source.jpg";      // Path relative to assets/js/

  // 🟢 CHANGED — simple toggle + placeholder URL (no navigation until you flip OPEN_URL)
  const OPEN_URL = false;                 // 🟢 set to true when the target is live
  const DRIVE_URL = "https://your.link";  // 🟢 replace with real URL when ready

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
    const now = Date.now();
    const mobileDevice = window.innerWidth < 768;
    const effectiveInterval = collapseMode ? 
      (mobileDevice ? Math.max(33, staticUpdateInterval) : staticUpdateInterval * 0.5) : 
      staticUpdateInterval;
    if (now - lastStaticUpdate < effectiveInterval) {
      ctx.save();
      if (collapseMode) {
        ctx.globalAlpha = 0.12;
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
      if (collapseMode) {
        v = (rnd()*15)+8;
      }
      d[i]=d[i+1]=d[i+2]=v; d[i+3]=255;
    }
    nctx.putImageData(id,0,0);

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
    if (collapseMode) {
      ctx.globalAlpha = 0.12;
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
    const baseW = W*1.2376; const r = maskImg.height/maskImg.width; const baseH = baseW*r;
    const a = 0.18 + 0.15 * Math.abs(Math.sin(tNorm*Math.PI*2.1));
    const w = Math.round(baseW), h = Math.round(baseH);
    if (maskCanvas.width !== w || maskCanvas.height !== h) {
      maskCanvas.width = w;
      maskCanvas.height = h;
    }
    maskCtx.clearRect(0, 0, w, h);
    maskCtx.drawImage(maskImg, 0, 0, w, h);
    const imageData = maskCtx.getImageData(0, 0, w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      if (brightness < 50) {
        data[i + 3] = 0;
      } else {
        data[i] = Math.floor(r * 0.8);
        data[i + 1] = Math.floor(g * 0.8);
        data[i + 2] = Math.floor(b * 0.8);
      }
    }
    maskCtx.putImageData(imageData, 0, 0);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.drawImage(maskCanvas, W/2 - w/2 - 50 + jitter(6), H/2 - h/2 + jitter(6));
    ctx.restore();
  }

  function typewriter(line, x, y, progress, px, pauseAtHalf = false){
    ctx.font = `bold ${px*2}px "Courier New", Courier, monospace`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    let adjustedProgress = progress;
    if (pauseAtHalf && progress > 0.45 && progress < 0.55) {
      adjustedProgress = 0.45;
    } else if (pauseAtHalf && progress >= 0.55) {
      adjustedProgress = (progress - 0.1) / 0.9;
    }
    const n = Math.floor(adjustedProgress * line.length);
    const shown = line.slice(0, n);
    ctx.save();
    function drawTextWithGlow(text, textX, textY) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = '#e9e9ea';
      ctx.fillText(text, textX, textY);
      ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#e9e9ea';
      ctx.fillText(text, textX, textY);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#e9e9ea';
      ctx.fillText(text, textX, textY);
    }
    drawTextWithGlow(shown, x, y);
    const cursorBlink = Math.floor(Date.now() / 500) % 2 === 0;
    if (cursorBlink) {
      const cursorX = n < line.length ? 
        x + ctx.measureText(shown).width/2 + 6 :
        x + ctx.measureText(line).width/2 + 6;
      drawTextWithGlow('_', cursorX, y);
    }
    ctx.restore();
  }

  function drawUsbPngJitter(tNorm, withGlitch = false, glowProgress = 0, climaxBoost = false){
    if(!usbReady) return;
    const maxWidthScale = 0.763733124;
    const maxHeightScale = 0.58;
    const ratio = usbImg.height / usbImg.width;
    const widthConstrainedW = W * maxWidthScale;
    const widthConstrainedH = widthConstrainedW * ratio;
    const heightConstrainedH = H * maxHeightScale;
    const heightConstrainedW = heightConstrainedH / ratio;
    const targetW = widthConstrainedH <= H * maxHeightScale ? widthConstrainedW : heightConstrainedW;
    const targetH = widthConstrainedH <= H * maxHeightScale ? widthConstrainedH : heightConstrainedH;
    const cx = W/2, cy = H/2;

    if (!withGlitch && stableUsbReady && 
        stableUsbCanvas.width === (targetW|0) && 
        stableUsbCanvas.height === (targetH|0)) {
      ucv.width = targetW|0; ucv.height = targetH|0;
      uctx.clearRect(0,0,ucv.width,ucv.height);
      uctx.drawImage(stableUsbCanvas, 0, 0);
    } else {
      ucv.width = targetW|0; ucv.height = targetH|0;
      uctx.clearRect(0,0,ucv.width,ucv.height);
      uctx.drawImage(usbImg, 0,0, ucv.width, ucv.height);
      const id = uctx.getImageData(0,0,ucv.width,ucv.height);
      const d  = id.data;
      for(let i=0;i<d.length;i+=4){
        const y = 0.2126*d[i] + 0.7152*d[i+1] + 0.0722*d[i+2];
        if (y > 200 || y < 50){ 
          d[i+3]=0; 
        } else {
          d[i+3]=255;
          if (withGlitch && Math.random() < 0.3) {
            const glitchIntensity = Math.random() * 0.6;
            d[i] = Math.min(255, d[i] + (Math.random() - 0.5) * 100 * glitchIntensity);
            d[i+1] = Math.min(255, d[i+1] + (Math.random() - 0.5) * 100 * glitchIntensity);
            d[i+2] = Math.min(255, d[i+2] + (Math.random() - 0.5) * 100 * glitchIntensity);
          }
        }
      }
      uctx.putImageData(id,0,0);
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
    
    if (withGlitch) {
      alpha *= (0.4 + Math.random() * 0.6);
      offsetX = jitter(8);
      offsetY = jitter(8);
      const glitchScale = 0.95 + Math.random() * 0.1;
      const scaledW = targetW * glitchScale;
      const scaledH = targetH * glitchScale;
      ctx.save();
      const time = Date.now() * 0.001;
      const randomTime1 = time * (1.3 + Math.random() * 2.8);
      const randomTime2 = time * (2.1 + Math.random() * 3.4);
      const randomTime3 = time * (0.7 + Math.random() * 1.8);
      const flicker1 = Math.sin(randomTime1) * 0.8 + 0.2;
      const flicker2 = Math.sin(randomTime2) * 0.7 + 0.3;
      const flicker3 = Math.cos(randomTime3) * 0.6 + 0.4;
      const randomFlicker = Math.random() < 0.4 ? 0.1 + Math.random() * 1.9 : 0.5 + Math.random() * 0.8;
      const flickerMultiplier = flicker1 * flicker2 * flicker3 * randomFlicker;
      const baseGlow = 0.6;
      let interferenceGlow = (baseGlow + glowProgress * 0.4) * flickerMultiplier;
      let glowSize = (12 + 16 * glowProgress) * (0.5 + flickerMultiplier * 0.8);
      if (climaxBoost) {
        interferenceGlow = Math.min(2.5, interferenceGlow * 2.2);
        glowSize *= 1.6;
      }
      for (let i = 1; i <= 4; i++) {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = glowSize * i / 4;
        ctx.globalAlpha = alpha * interferenceGlow * (0.6 / i);
        ctx.drawImage(ucv, cx - scaledW/2 + offsetX, cy - scaledH/2 + offsetY, scaledW, scaledH);
      }
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.globalAlpha = alpha;
      const focusProgress = glowProgress;
      const brightnessTime = Date.now() * 0.005;
      const brightnessFlicker = Math.sin(brightnessTime * 1.8) * 0.5 + 0.5;
      const irregularFlicker = Math.random() < 0.2 ? 0.2 + Math.random() * 1.3 : 1;
      const flickerBrightness = brightnessFlicker * irregularFlicker;
      const baseBrightness = 0.8;
      const brightness = (baseBrightness + (focusProgress * 0.8)) * flickerBrightness;
      if (Math.random() < 0.2) {
        ctx.filter = `hue-rotate(${Math.random() * 360}deg) brightness(${brightness + Math.random() * 0.2})`;
      } else {
        ctx.filter = `brightness(${brightness})`;
      }
      ctx.drawImage(ucv, cx - scaledW/2 + offsetX, cy - scaledH/2 + offsetY, scaledW, scaledH);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = alpha;
      if (glowProgress > 0) {
        const stableGlowTime = Date.now() * 0.004;
        const primaryFlicker = Math.sin(stableGlowTime * 1.2) * 0.6 + 0.4;
        const secondaryFlicker = Math.sin(stableGlowTime * 2.8) * 0.4 + 0.6;
        const tertiaryFlicker = Math.sin(stableGlowTime * 4.1) * 0.3 + 0.7;
        const randomSpike = Math.random() < 0.15 ? 2.0 + Math.random() * 1.0 : 1;
        const randomDrop = Math.random() < 0.1 ? 0.1 + Math.random() * 0.3 : 1;
        const flickerMultiplier = primaryFlicker * secondaryFlicker * tertiaryFlicker * randomSpike * randomDrop;
        const glowIntensity = glowProgress * 1.2 * flickerMultiplier;
        const glowSize = 35 * glowProgress * (0.4 + flickerMultiplier * 1.0);
        for (let i = 1; i <= 4; i++) {
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = glowSize * i / 4;
          ctx.globalAlpha = alpha * glowIntensity * (0.25 / i);
          ctx.drawImage(ucv, cx - targetW/2 + offsetX, cy - targetH/2 + offsetY);
        }
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.globalAlpha = alpha;
      }
      const stableBrightnessTime = Date.now() * 0.006;
      const brightnessFlicker = Math.sin(stableBrightnessTime * 1.9) * 0.6 + 0.4;
      const unstableFlicker = Math.random() < 0.25 ? 0.2 + Math.random() * 1.4 : 1;
      const focusBrightness = (1.2 + (glowProgress * 0.8)) * brightnessFlicker * unstableFlicker;
      ctx.filter = `brightness(${focusBrightness})`;
      ctx.drawImage(ucv, cx - targetW/2 + offsetX, cy - targetH/2 + offsetY);
      ctx.restore();
    }
  }

  function loop(now){
    if (isReducedMotion) {
      CTA.classList.add('show');
      return;
    }
    if (document.visibilityState === 'hidden') {
      requestAnimationFrame(loop);
      return;
    }
    if (!start) {
      start = now;
    }
    const t = (now - start) % LOOP;

    let staticFade = 1;
    let staticSlow = 1;
    if (t >= T.drive[0]) {
      const driveProgress = Math.min(1, (t - T.drive[0]) / (T.drive[1] - T.drive[0]));
      staticFade = 1 - (driveProgress * 0.7);
      staticSlow = 1 - (driveProgress * 0.8);
    }
    
    let collapseMode = false;
    let canvasInvert = false;
    if (t >= T.climax[0] && t < T.climax[1]) {
      const climaxProgress = (t - T.climax[0]) / (T.climax[1] - T.climax[0]);
      if (climaxProgress < 0.45) {
        canvasInvert = true;
      } else {
        collapseMode = true;
      }
    } else if (t >= T.climax[1] && t < T.drive[1]) {
      collapseMode = true;
    }
    if (canvasInvert) {
      cv.style.filter = 'invert(1) brightness(1.2) contrast(1.4)';
    } else {
      cv.style.filter = '';
    }
    drawStatic(staticFade, staticSlow, collapseMode);

    if (t>=T.mask[0] && t<T.plant[0] && maskReady){
      const maskWindow = T.plant[0] - T.mask[0];
      const elapsed = t - T.mask[0];
      const tn = Math.min(1, elapsed / 250);
      if (Math.random()<0.9) drawMaskFlicker(tn);
    }

    if (t>=T.plant[0] && t<T.plant[1]){
      ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(0,0,W,H);
      const tn = (t-T.plant[0])/(T.plant[1]-T.plant[0]);
      const px = Math.max(14, Math.min(W,H)/34 | 0);

      if (tn < 0.196) {
        const elapsed = tn / 0.196;
        if (elapsed < 0.426) {
          const p1 = elapsed / 0.426;
          typewriter(LINE1, W/2, H*0.46, p1, px);
        } else {
          typewriter(LINE1, W/2, H*0.46, 1, px);
        }
      } else if (tn < 0.392) {
        const elapsed = (tn - 0.196) / 0.196;
        if (elapsed < 0.426) {
          const p2 = elapsed / 0.426;
          typewriter(LINE2, W/2, H*0.46, p2, px, true);
        } else {
          typewriter(LINE2, W/2, H*0.46, 1, px);
        }
      } else if (tn < 0.588) {
        const elapsed = (tn - 0.392) / 0.196;
        if (elapsed < 0.426) {
          const p3 = elapsed / 0.426;
          typewriter(LINE3, W/2, H*0.46, p3, px);
        } else {
          typewriter(LINE3, W/2, H*0.46, 1, px);
        }
      } else if (tn < 1.0) {
        const elapsed = (tn - 0.588) / 0.412;
        if (elapsed < 0.198) {
          const p4 = elapsed / 0.198;
          typewriter(LINE4, W/2, H*0.46, p4, px);
        } else {
          const displayProgress = (elapsed - 0.198) / (1 - 0.198);
          if (displayProgress > 0.67) {
            const flickerIntensity = Math.random() > 0.3 ? (0.4 + Math.random() * 0.6) : 0.1;
            ctx.save();
            ctx.globalAlpha = flickerIntensity;
            typewriter(LINE4, W/2, H*0.46, 1, px);
            ctx.restore();
          } else {
            typewriter(LINE4, W/2, H*0.46, 1, px);
          }
        }
      }
    }

    if (t>=T.drive[0] && t<T.drive[1]){
      const tn = (t-T.drive[0])/(T.drive[1]-T.drive[0]);
      let interferenceGlow = 1 - staticFade;
      const inClimaxBoost = t >= T.climax[1] && t < T.drive[1];
      drawUsbPngJitter(tn, true, interferenceGlow, inClimaxBoost);
    } else if (t>=T.drive[1] && t<T.cta[1]){
      const ctaProgress = (t-T.drive[1])/(T.cta[1]-T.drive[1]);
      let glowProgress = Math.min(1, ctaProgress * 2);
      const inCtaClimaxBoost = ctaProgress < 0.3;
      if (inCtaClimaxBoost) {
        glowProgress = Math.min(2.0, glowProgress * 1.8);
      }
      drawUsbPngJitter(1, false, glowProgress, inCtaClimaxBoost);
    }

    let usbBottomY = H/2;
    let usbCenterX = W/2;
    if (usbReady) {
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
      // 🟢 CHANGED — keep the intended label when showing CTA
      if (CTA.textContent !== "//open-drive Δ") {           // 🟢
        CTA.textContent = "//open-drive Δ";                  // 🟢
        CTA.setAttribute('aria-label', 'Open the Drive');    // 🟢
      }
      CTA.classList.add('show');
      const ctaElapsed = t - T.cta[0]; 
      if (ctaElapsed < 1500) {
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
    animationComplete = true;

    const flash = document.createElement('div');
    flash.style.cssText = `position:fixed;inset:0;background:#000;animation:flash .18s ease-out forwards;pointer-events:none;z-index:9999;`;
    document.body.appendChild(flash);
    const style = document.createElement('style');
    style.textContent = `@keyframes flash{0%{opacity:0}20%{opacity:1}100%{opacity:0}}`;
    document.head.appendChild(style);

    // 🟢 CHANGED — after click, switch to "I AM HUMAN"
    CTA.textContent = "I AM HUMAN";     // 🟢
    CTA.classList.add('show');
    CTA.classList.add('climax-boost');

    setTimeout(() => {
      // 🟢 CHANGED — only attempt navigation when OPEN_URL is true
      if (OPEN_URL) {                                         // 🟢
        try { parent.postMessage({ type:'iah-open', url: DRIVE_URL }, '*'); } catch(e) {}  // 🟢
        try { window.location.assign(DRIVE_URL); } catch(e) {}                              // 🟢
      } else {                                                // 🟢
        CTA.disabled = true;                                  // 🟢 prevent repeat clicks while URL is offline
        CTA.style.opacity = 0.8;                              // 🟢 optional subtle visual cue
        CTA.style.cursor = 'default';                         // 🟢
      }                                                       // 🟢
    }, 350);
  });

  // Start animation loop (unless reduced motion is preferred)
  if (isReducedMotion) {
    CTA.classList.add('show');
  } else {
    requestAnimationFrame(loop);
  }
})();
