export interface DragDropCallbacks {
  onDrop: (files: FileList) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
}

export function initDragDrop(
  target: HTMLElement,
  callbacks: DragDropCallbacks
): () => void {
  let dragCounter = 0;

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    dragCounter++;
    if (dragCounter === 1) callbacks.onDragEnter?.();
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'copy';
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) callbacks.onDragLeave?.();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    dragCounter = 0;
    callbacks.onDragLeave?.();

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      callbacks.onDrop(files);
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      const dt = new DataTransfer();
      for (const file of imageFiles) dt.items.add(file);
      callbacks.onDrop(dt.files);
    }
  };

  target.addEventListener('dragenter', handleDragEnter);
  target.addEventListener('dragover', handleDragOver);
  target.addEventListener('dragleave', handleDragLeave);
  target.addEventListener('drop', handleDrop);
  document.addEventListener('paste', handlePaste);

  return () => {
    target.removeEventListener('dragenter', handleDragEnter);
    target.removeEventListener('dragover', handleDragOver);
    target.removeEventListener('dragleave', handleDragLeave);
    target.removeEventListener('drop', handleDrop);
    document.removeEventListener('paste', handlePaste);
  };
}
