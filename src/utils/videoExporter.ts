import {
  FORMAL_VIDEO_SCENES,
  FORMAL_VOCABULARY_LIST,
  VideoScene,
  VocabularyItem,
} from '../data/vocabulary';

export interface RenderProgress {
  progress: number; // 0 to 100
  currentFrame: number;
  totalFrames: number;
  sceneTitle: string;
}

interface LabelBox {
  id: string;
  word: string;
  phonetic: string;
  pinX: number; // Screen pin coordinate
  pinY: number;
  cardX: number; // Card bounding box top-left
  cardY: number;
  width: number;
  height: number;
  isSpotlight: boolean;
}

// Cubic ease in-out for smooth camera movement
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function getCameraTransformAtTime(
  time: number,
  scenes: VideoScene[] = FORMAL_VIDEO_SCENES,
  vocabularyList: VocabularyItem[] = FORMAL_VOCABULARY_LIST
): {
  scene: VideoScene;
  zoom: number;
  panX: number;
  panY: number;
  activeWords: VocabularyItem[];
  progress: number;
} {
  const clampedTime = Math.max(0, Math.min(30, time));
  const scene =
    scenes.find((s) => clampedTime >= s.startTime && clampedTime < s.endTime) ||
    scenes[scenes.length - 1];

  const sceneProgress = (clampedTime - scene.startTime) / (scene.endTime - scene.startTime);
  const eased = easeInOutCubic(Math.max(0, Math.min(1, sceneProgress)));

  const zoom = scene.camera.startZoom + (scene.camera.endZoom - scene.camera.startZoom) * eased;
  const panX = scene.camera.startPanX + (scene.camera.endPanX - scene.camera.startPanX) * eased;
  const panY = scene.camera.startPanY + (scene.camera.endPanY - scene.camera.startPanY) * eased;

  const activeWords = vocabularyList.filter((w) => scene.featuredWordIds.includes(w.id));

  return {
    scene,
    zoom,
    panX,
    panY,
    activeWords,
    progress: sceneProgress,
  };
}

/**
 * Intelligent Anti-Collision Layout Solver for Video Word Labels
 * Ensures NO label cards ever overlap ("najezdzaja na siebie")
 */
function layoutNonOverlappingLabels(
  ctx: CanvasRenderingContext2D,
  words: VocabularyItem[],
  screenWidth: number,
  screenHeight: number,
  focusCenterX: number,
  focusCenterY: number,
  zoom: number,
  baseOffsetX: number,
  baseOffsetY: number,
  baseWidth: number,
  baseHeight: number,
  currentTime: number,
  scene: VideoScene
): LabelBox[] {
  const placedBoxes: LabelBox[] = [];

  // Determine current spotlight index based on scene elapsed time
  const sceneElapsed = currentTime - scene.startTime;
  const sceneDuration = scene.endTime - scene.startTime;
  const spotlightIndex = Math.min(
    words.length - 1,
    Math.floor((sceneElapsed / sceneDuration) * words.length)
  );

  // Measure and collect candidates
  const candidates = words
    .map((word, idx) => {
      const imgPixelX = baseOffsetX + (word.xPercent / 100) * baseWidth;
      const imgPixelY = baseOffsetY + (word.yPercent / 100) * baseHeight;

      const pinX = screenWidth / 2 + (imgPixelX - focusCenterX) * zoom;
      const pinY = screenHeight / 2 + (imgPixelY - focusCenterY) * zoom;

      // Check if pin is reasonably on screen
      if (
        pinX < -20 ||
        pinX > screenWidth + 20 ||
        pinY < 40 ||
        pinY > screenHeight - 60
      ) {
        return null;
      }

      ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      const text = word.word.toUpperCase();
      const textWidth = ctx.measureText(text).width;
      const cardWidth = Math.max(textWidth + 26, 90);
      const cardHeight = 36;

      return {
        id: word.id,
        word: text,
        phonetic: word.phonetic,
        pinX,
        pinY,
        width: cardWidth,
        height: cardHeight,
        isSpotlight: idx === spotlightIndex,
        xPercent: word.xPercent,
        yPercent: word.yPercent,
        index: idx,
      };
    })
    .filter(Boolean) as (LabelBox & { xPercent: number; yPercent: number; index: number })[];

  // Bounds for label cards so they do not collide with top banner or lower subtitles
  const minX = 20;
  const maxX = screenWidth - 20;
  const minY = 76; // Below top scene banner
  const maxY = screenHeight - 90; // Above subtitle bar
  const gap = 12; // Minimum gap between any two cards in pixels

  // Helper: check if box overlaps any already placed box
  const hasCollision = (box: { cardX: number; cardY: number; width: number; height: number }) => {
    for (const p of placedBoxes) {
      const horizontalOverlap =
        box.cardX < p.cardX + p.width + gap && box.cardX + box.width + gap > p.cardX;
      const verticalOverlap =
        box.cardY < p.cardY + p.height + gap && box.cardY + box.height + gap > p.cardY;
      if (horizontalOverlap && verticalOverlap) {
        return true;
      }
    }
    return false;
  };

  for (const item of candidates) {
    const { pinX, pinY, width, height } = item;

    // Define 8 multi-directional candidate placement slots around the target pin
    const candidateSlots = [
      // 1. Top-Right
      { cardX: pinX + 16, cardY: pinY - height - 8 },
      // 2. Top-Left
      { cardX: pinX - width - 16, cardY: pinY - height - 8 },
      // 3. Bottom-Right
      { cardX: pinX + 16, cardY: pinY + 14 },
      // 4. Bottom-Left
      { cardX: pinX - width - 16, cardY: pinY + 14 },
      // 5. High Top-Right (for dense clusters)
      { cardX: pinX + 24, cardY: pinY - height - 34 },
      // 6. High Top-Left
      { cardX: pinX - width - 24, cardY: pinY - height - 34 },
      // 7. Low Bottom-Right
      { cardX: pinX + 24, cardY: pinY + 36 },
      // 8. Low Bottom-Left
      { cardX: pinX - width - 24, cardY: pinY + 36 },
      // 9. Directly Above
      { cardX: pinX - width / 2, cardY: pinY - height - 20 },
      // 10. Directly Below
      { cardX: pinX - width / 2, cardY: pinY + 20 },
    ];

    let chosenSlot = candidateSlots[0];
    let foundNonColliding = false;

    // Evaluate each candidate slot
    for (const slot of candidateSlots) {
      // Clamp to screen boundaries
      let clampedX = Math.max(minX, Math.min(maxX - width, slot.cardX));
      let clampedY = Math.max(minY, Math.min(maxY - height, slot.cardY));

      const testBox = {
        cardX: clampedX,
        cardY: clampedY,
        width,
        height,
      };

      if (!hasCollision(testBox)) {
        chosenSlot = testBox;
        foundNonColliding = true;
        break;
      }
    }

    // If still colliding in standard slots, calculate a dynamic offset push
    if (!foundNonColliding) {
      let fallbackY = Math.max(minY, Math.min(maxY - height, pinY - height - 10));
      let fallbackX = pinX > screenWidth / 2 ? pinX - width - 20 : pinX + 20;
      fallbackX = Math.max(minX, Math.min(maxX - width, fallbackX));

      // Push down incrementally until gap is cleared
      while (
        hasCollision({ cardX: fallbackX, cardY: fallbackY, width, height }) &&
        fallbackY + height + 15 < maxY
      ) {
        fallbackY += height + 8;
      }

      chosenSlot = {
        cardX: fallbackX,
        cardY: fallbackY,
      };
    }

    placedBoxes.push({
      id: item.id,
      word: item.word,
      phonetic: item.phonetic,
      pinX,
      pinY,
      cardX: chosenSlot.cardX,
      cardY: chosenSlot.cardY,
      width,
      height,
      isSpotlight: item.isSpotlight,
    });
  }

  return placedBoxes;
}

export function drawSceneToCanvas(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  time: number,
  width: number,
  height: number,
  options?: {
    showLabels?: boolean;
    showSubtitles?: boolean;
    showVignette?: boolean;
    scenes?: VideoScene[];
    vocabularyList?: VocabularyItem[];
  }
) {
  const showLabels = options?.showLabels !== false;
  const showSubtitles = options?.showSubtitles !== false;
  const showVignette = options?.showVignette !== false;
  const scenes = options?.scenes || FORMAL_VIDEO_SCENES;
  const vocabularyList = options?.vocabularyList || FORMAL_VOCABULARY_LIST;

  const { scene, zoom, panX, panY, activeWords } = getCameraTransformAtTime(
    time,
    scenes,
    vocabularyList
  );

  // Clear background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, width, height);

  // Aspect scaling (cover/fit)
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = width / height;

  let baseWidth = width;
  let baseHeight = height;

  if (imgAspect > canvasAspect) {
    baseHeight = width / imgAspect;
  } else {
    baseWidth = height * imgAspect;
  }

  const baseOffsetX = (width - baseWidth) / 2;
  const baseOffsetY = (height - baseHeight) / 2;

  // Zoom center in pixel coordinates relative to the canvas
  const focusCenterX = baseOffsetX + (panX / 100) * baseWidth;
  const focusCenterY = baseOffsetY + (panY / 100) * baseHeight;

  // 1. Draw Image with Camera Pan & Zoom Transform
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-focusCenterX, -focusCenterY);
  ctx.drawImage(img, baseOffsetX, baseOffsetY, baseWidth, baseHeight);
  ctx.restore();

  // 2. Draw Pins and Labels with Anti-Collision Layout
  if (showLabels && activeWords.length > 0) {
    const layoutBoxes = layoutNonOverlappingLabels(
      ctx,
      activeWords,
      width,
      height,
      focusCenterX,
      focusCenterY,
      zoom,
      baseOffsetX,
      baseOffsetY,
      baseWidth,
      baseHeight,
      time,
      scene
    );

    layoutBoxes.forEach((box) => {
      const { pinX, pinY, cardX, cardY, width: badgeWidth, height: badgeHeight, isSpotlight } = box;

      // Pulse animation for pin
      const pulse = Math.sin(time * 5 + pinX * 0.05) * 0.15 + 1;

      // Outer glow circle
      ctx.beginPath();
      ctx.arc(pinX, pinY, (isSpotlight ? 14 : 11) * pulse, 0, Math.PI * 2);
      ctx.fillStyle = isSpotlight
        ? 'rgba(245, 158, 11, 0.45)'
        : 'rgba(234, 179, 8, 0.25)';
      ctx.fill();

      // Pin center dot
      ctx.beginPath();
      ctx.arc(pinX, pinY, isSpotlight ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isSpotlight ? '#f59e0b' : '#fbbf24';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Calculate anchor connection point on the label card
      let anchorX = cardX;
      if (pinX > cardX + badgeWidth) {
        anchorX = cardX + badgeWidth;
      } else if (pinX > cardX && pinX < cardX + badgeWidth) {
        anchorX = pinX;
      }

      let anchorY = cardY + badgeHeight / 2;
      if (pinY > cardY + badgeHeight) {
        anchorY = cardY + badgeHeight;
      } else if (pinY < cardY) {
        anchorY = cardY;
      }

      // Connecting pointer line
      ctx.beginPath();
      ctx.moveTo(pinX, pinY);
      ctx.lineTo(anchorX, anchorY);
      ctx.strokeStyle = isSpotlight ? 'rgba(251, 191, 36, 0.95)' : 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = isSpotlight ? 2 : 1.5;
      ctx.stroke();

      // Card rounded rectangle
      ctx.fillStyle = isSpotlight ? 'rgba(15, 23, 42, 0.96)' : 'rgba(15, 23, 42, 0.90)';
      ctx.strokeStyle = isSpotlight ? '#fbbf24' : 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = isSpotlight ? 2 : 1.2;
      roundRect(ctx, cardX, cardY, badgeWidth, badgeHeight, 6);
      ctx.fill();
      ctx.stroke();

      // Spotlight glow badge border
      if (isSpotlight) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.lineWidth = 4;
        roundRect(ctx, cardX - 2, cardY - 2, badgeWidth + 4, badgeHeight + 4, 8);
        ctx.stroke();
      }

      // Card word text
      ctx.fillStyle = isSpotlight ? '#ffffff' : '#f1f5f9';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(box.word, cardX + 8, cardY + 16);

      // Card phonetic text
      ctx.fillStyle = isSpotlight ? '#fde047' : '#e2e8f0';
      ctx.font = '10px monospace';
      ctx.fillText(box.phonetic, cardX + 8, cardY + 29);
    });
  }

  // 3. Screen Vignette
  if (showVignette) {
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.45,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.85
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // 4. Top Scene Header Banner
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  roundRect(ctx, 16, 16, Math.min(width - 32, 420), 52, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText(`ENGLISH VIDEO TOUR • ${scene.title.toUpperCase()}`, 28, 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText(scene.subtitle, 28, 54);

  // Time indicator in top-right
  const timeFormatted = `${String(Math.floor(time)).padStart(2, '0')}:00 / 00:30`;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  roundRect(ctx, width - 130, 16, 114, 32, 6);
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '12px monospace';
  ctx.fillText(`⏱ ${timeFormatted}`, width - 118, 37);

  // 5. Lower-third Subtitle Bar
  if (showSubtitles) {
    const subHeight = 64;
    const subY = height - subHeight - 20;
    const subWidth = Math.min(width - 40, 960);
    const subX = (width - subWidth) / 2;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    roundRect(ctx, subX, subY, subWidth, subHeight, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('NARRATOR (FORMAL DINING ENGLISH)', subX + 18, subY + 22);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '14px system-ui, sans-serif';
    wrapText(ctx, scene.narration, subX + 18, subY + 44, subWidth - 36, 18);
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let lineY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, lineY);
      line = words[n] + ' ';
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, lineY);
}

/**
 * Render and export actual downloadable video file (.webm / .mp4)
 */
export async function exportVideoFile(
  imageSrc: string,
  onProgress?: (progress: RenderProgress) => void,
  scenes: VideoScene[] = FORMAL_VIDEO_SCENES,
  vocabularyList: VocabularyItem[] = FORMAL_VOCABULARY_LIST
): Promise<{ blob: Blob; url: string; filename: string }> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(new Error('Failed to load image for video export: ' + e));
    img.src = imageSrc;
  });

  const width = 1280;
  const height = 720;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas 2D context');

  const fps = 30;
  const durationSeconds = 30;
  const totalFrames = fps * durationSeconds;

  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/mp4';
  }

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
    videoBitsPerSecond: 4000000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  recorder.start();

  const frameIntervalMs = 1000 / fps;

  for (let f = 0; f < totalFrames; f++) {
    const time = f / fps;
    drawSceneToCanvas(ctx, img, time, width, height, {
      showLabels: true,
      showSubtitles: true,
      showVignette: true,
      scenes,
      vocabularyList,
    });

    if (onProgress && f % 5 === 0) {
      const { scene } = getCameraTransformAtTime(time, scenes, vocabularyList);
      onProgress({
        progress: Math.round((f / totalFrames) * 100),
        currentFrame: f,
        totalFrames,
        sceneTitle: scene.title,
      });
    }

    await new Promise((r) => setTimeout(r, Math.min(frameIntervalMs, 12)));
  }

  return new Promise<{ blob: Blob; url: string; filename: string }>((resolve, reject) => {
    recorder.onstop = () => {
      const finalBlob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(finalBlob);
      const filename = `Formal_Table_Setting_Video_${Date.now()}.webm`;
      resolve({ blob: finalBlob, url, filename });
    };
    recorder.onerror = (e) => reject(e);
    recorder.stop();
  });
}
