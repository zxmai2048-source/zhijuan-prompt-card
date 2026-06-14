export interface SelectionResult {
  rect: DOMRect;
  dpr: number;
}

export interface PickedImageResult {
  srcUrl: string;
  title?: string;
}

export interface ImagePickerCopy {
  prompt: string;
  hover?: string;
  selected: string;
}

export interface SelectionOverlayCopy {
  prompt: string;
  selected: string;
}

const defaultImagePickerCopy: ImagePickerCopy = {
  prompt: 'Click any image to analyze. Press Esc to cancel.',
  hover: 'Current image, click to analyze',
  selected: 'Image selected'
};

const defaultSelectionOverlayCopy: SelectionOverlayCopy = {
  prompt: 'Drag to capture a region. Press Esc to cancel.',
  selected: 'Region selected'
};

let activeOverlayCancel: (() => void) | undefined;

export function cancelActiveSelectionOverlay(): void {
  activeOverlayCancel?.();
}

export function startSelectionOverlay(copy: SelectionOverlayCopy = defaultSelectionOverlayCopy): Promise<SelectionResult | undefined> {
  cancelActiveSelectionOverlay();
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    const selection = document.createElement('div');
    const label = document.createElement('div');
    overlay.className = 'zpc-selection-overlay';
    selection.className = 'zpc-selection-box';
    label.className = 'zpc-selection-label';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:2147483630;cursor:crosshair;background:rgba(0,0,0,.24);backdrop-filter:saturate(135%) blur(1px)';
    selection.style.cssText =
      'position:fixed;z-index:2147483631;border:1.5px solid rgba(130,184,155,.96);border-radius:18px;background:rgba(130,184,155,.08);box-shadow:0 0 0 9999px rgba(0,0,0,.34),0 18px 72px rgba(130,184,155,.22),inset 0 1px 0 rgba(255,255,255,.18);opacity:0;transition:opacity 120ms cubic-bezier(.16,1,.3,1)';
    label.style.cssText =
      'position:fixed;left:50%;top:18px;z-index:2147483632;transform:translateX(-50%);pointer-events:none;padding:9px 13px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(8,10,13,.72);color:#f2f5f1;font:800 12px/1.2 ui-sans-serif,system-ui,sans-serif;box-shadow:0 18px 58px rgba(0,0,0,.36),0 0 20px rgba(130,184,155,.11);backdrop-filter:blur(20px) saturate(150%)';
    label.textContent = copy.prompt;
    overlay.append(selection, label);
    document.documentElement.appendChild(overlay);

    let startX = 0;
    let startY = 0;
    let dragging = false;
    let resolved = false;
    const cancelCurrent = () => cleanup();

    const cleanup = (result?: SelectionResult) => {
      if (resolved) return;
      resolved = true;
      if (activeOverlayCancel === cancelCurrent) activeOverlayCancel = undefined;
      overlay.remove();
      document.removeEventListener('keydown', onKeyDown, true);
      resolve(result);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cleanup();
    };

    overlay.addEventListener('pointerdown', (event) => {
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      selection.style.left = `${startX}px`;
      selection.style.top = `${startY}px`;
      selection.style.width = '0px';
      selection.style.height = '0px';
      selection.style.opacity = '1';
      overlay.setPointerCapture(event.pointerId);
    });

    overlay.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const left = Math.min(startX, event.clientX);
      const top = Math.min(startY, event.clientY);
      const width = Math.abs(event.clientX - startX);
      const height = Math.abs(event.clientY - startY);
      selection.style.left = `${left}px`;
      selection.style.top = `${top}px`;
      selection.style.width = `${width}px`;
      selection.style.height = `${height}px`;
      label.textContent = width > 12 && height > 12 ? `${copy.selected} · ${Math.round(width)} × ${Math.round(height)}` : copy.prompt;
    });

    overlay.addEventListener('pointerup', (event) => {
      if (!dragging) return;
      dragging = false;
      const rect = selection.getBoundingClientRect();
      overlay.releasePointerCapture(event.pointerId);
      if (rect.width < 12 || rect.height < 12) cleanup();
      else cleanup({ rect, dpr: window.devicePixelRatio || 1 });
    });

    document.addEventListener('keydown', onKeyDown, true);
    activeOverlayCancel = cancelCurrent;
  });
}

export function startImagePicker(copy: ImagePickerCopy = defaultImagePickerCopy): Promise<PickedImageResult | undefined> {
  cancelActiveSelectionOverlay();
  return new Promise((resolve) => {
    const veil = document.createElement('div');
    const frame = document.createElement('div');
    const label = document.createElement('div');
    const stamp = document.createElement('div');
    veil.className = 'zpc-image-pick-overlay';
    frame.className = 'zpc-image-pick-frame';
    label.className = 'zpc-image-pick-label';
    stamp.className = 'zpc-image-pick-stamp';
    veil.style.cssText =
      'position:fixed;inset:0;z-index:2147483630;pointer-events:none;background:rgba(4,6,8,.12);backdrop-filter:saturate(140%) blur(1px)';
    frame.style.cssText =
      'position:fixed;z-index:2147483631;pointer-events:none;border:1.5px solid rgba(130,184,155,.96);border-radius:18px;box-shadow:0 0 0 9999px rgba(0,0,0,.34),0 18px 70px rgba(130,184,155,.22),inset 0 1px 0 rgba(255,255,255,.18);opacity:0;transition:transform 220ms cubic-bezier(.16,1,.3,1),opacity 160ms cubic-bezier(.16,1,.3,1)';
    label.style.cssText =
      'position:fixed;left:50%;top:18px;z-index:2147483632;transform:translateX(-50%);pointer-events:none;padding:9px 13px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(8,10,13,.72);color:#f2f5f1;font:800 12px/1.2 ui-sans-serif,system-ui,sans-serif;box-shadow:0 18px 58px rgba(0,0,0,.36),0 0 20px rgba(130,184,155,.11);backdrop-filter:blur(20px) saturate(150%)';
    stamp.style.cssText =
      'position:fixed;z-index:2147483632;pointer-events:none;opacity:0;transform:translate3d(-50%,-50%,0) scale(.86);padding:9px 13px;border:1px solid rgba(255,255,255,.24);border-radius:999px;background:rgba(130,184,155,.94);color:#07100c;font:900 12px/1 ui-sans-serif,system-ui,sans-serif;box-shadow:0 18px 68px rgba(130,184,155,.26),0 0 0 8px rgba(255,255,255,.07);backdrop-filter:blur(18px) saturate(160%)';
    label.textContent = copy.prompt;
    stamp.textContent = copy.selected;
    document.documentElement.append(veil, frame, label, stamp);

    let resolved = false;
    let locked = false;
    const clickArmedAt = performance.now() + 180;
    const cancelCurrent = () => cleanup();

    const cleanup = (result?: PickedImageResult) => {
      if (resolved) return;
      resolved = true;
      if (activeOverlayCancel === cancelCurrent) activeOverlayCancel = undefined;
      document.removeEventListener('pointermove', onPointerMove, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
      veil.remove();
      frame.remove();
      label.remove();
      stamp.remove();
      resolve(result);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (locked) return;
      const image = findImageAtPoint(event.clientX, event.clientY);
      if (!image) {
        frame.style.opacity = '0';
        label.textContent = copy.prompt;
        return;
      }
      positionFrame(frame, image);
      const rect = image.getBoundingClientRect();
      label.textContent = `${copy.hover || copy.selected} · ${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    };

    const onClick = (event: MouseEvent) => {
      if (locked) return;
      if (performance.now() < clickArmedAt) return;
      const image = findImageAtPoint(event.clientX, event.clientY);
      if (!image) return;
      event.preventDefault();
      event.stopPropagation();
      const srcUrl = image.currentSrc || image.src;
      if (!srcUrl) {
        cleanup();
        return;
      }
      locked = true;
      document.removeEventListener('pointermove', onPointerMove, true);
      document.removeEventListener('click', onClick, true);
      label.textContent = copy.selected;
      positionStamp(stamp, image);
      playSelectedImageAnimation(frame, image);
      window.setTimeout(() => {
        cleanup({ srcUrl, title: image.alt || image.title || document.title || 'Selected image' });
      }, 560);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cleanup();
    };

    document.addEventListener('pointermove', onPointerMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    activeOverlayCancel = cancelCurrent;
  });
}

function positionFrame(frame: HTMLDivElement, image: HTMLImageElement): void {
  const rect = image.getBoundingClientRect();
  frame.style.opacity = '1';
  frame.style.transform = `translate3d(${Math.round(rect.left)}px, ${Math.round(rect.top)}px, 0)`;
  frame.style.width = `${Math.round(rect.width)}px`;
  frame.style.height = `${Math.round(rect.height)}px`;
}

function positionStamp(stamp: HTMLDivElement, image: HTMLImageElement): void {
  const rect = image.getBoundingClientRect();
  stamp.style.left = `${Math.round(rect.left + rect.width / 2)}px`;
  stamp.style.top = `${Math.round(rect.top + rect.height / 2)}px`;
  stamp.animate(
    [
      { opacity: 0, transform: 'translate3d(-50%,-50%,0) scale(.82)' },
      { opacity: 1, transform: 'translate3d(-50%,-50%,0) scale(1.08)' },
      { opacity: 1, transform: 'translate3d(-50%,-50%,0) scale(1)' }
    ],
    { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' }
  );
}

function playSelectedImageAnimation(frame: HTMLDivElement, image: HTMLImageElement): void {
  positionFrame(frame, image);
  frame.style.borderColor = 'rgba(130,184,155,.98)';
  frame.style.background = 'rgba(130,184,155,.1)';
  frame.style.borderWidth = '3px';
  frame.animate(
    [
      {
        transform: frame.style.transform,
        boxShadow: '0 0 0 0 rgba(130,184,155,.34),0 0 0 9999px rgba(0,0,0,.38),0 18px 70px rgba(130,184,155,.24)'
      },
      {
        transform: `${frame.style.transform} scale(1.035)`,
        boxShadow: '0 0 0 10px rgba(130,184,155,.22),0 0 0 9999px rgba(0,0,0,.44),0 0 88px rgba(130,184,155,.36)'
      },
      {
        transform: frame.style.transform,
        boxShadow: '0 0 0 4px rgba(130,184,155,.22),0 0 0 9999px rgba(0,0,0,.38),0 18px 70px rgba(130,184,155,.24)'
      }
    ],
    { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' }
  );
}

export async function cropVisibleScreenshot(screenshotDataUrl: string, rect: DOMRect): Promise<string> {
  const image = await loadImage(screenshotDataUrl);
  const scaleX = image.naturalWidth / window.innerWidth;
  const scaleY = image.naturalHeight / window.innerHeight;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(rect.width * scaleX));
  canvas.height = Math.max(1, Math.round(rect.height * scaleY));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable.');
  context.drawImage(
    image,
    Math.round(rect.left * scaleX),
    Math.round(rect.top * scaleY),
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height
  );
  return canvas.toDataURL('image/png');
}

function findImageAtPoint(clientX: number, clientY: number): HTMLImageElement | undefined {
  const elements = document.elementsFromPoint(clientX, clientY);
  for (const element of elements) {
    if (element instanceof HTMLImageElement && (element.currentSrc || element.src)) return element;
    const nested = element.querySelector?.('img');
    if (nested instanceof HTMLImageElement && (nested.currentSrc || nested.src)) return nested;
  }
  return undefined;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load screenshot.'));
    image.src = src;
  });
}
