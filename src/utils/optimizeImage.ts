export async function optimizeImage(file: File, maxSize = 256): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.convertToBlob({ type: 'image/webp', quality: 0.85 });
}
