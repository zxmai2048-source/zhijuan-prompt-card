export interface SelectionResult {
  rect: DOMRect;
  dpr: number;
}

export function startSelectionOverlay(): Promise<SelectionResult | undefined> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    const selection = document.createElement('div');
    overlay.className = 'zpc-selection-overlay';
    selection.className = 'zpc-selection-box';
    overlay.appendChild(selection);
    document.documentElement.appendChild(overlay);

    let startX = 0;
    let startY = 0;
    let dragging = false;
    let resolved = false;

    const cleanup = (result?: SelectionResult) => {
      if (resolved) return;
      resolved = true;
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
  });
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load screenshot.'));
    image.src = src;
  });
}
