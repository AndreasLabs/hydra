// Centralized file extension lists used across file features

export const SUPPORTED_TEXT_EXTENSIONS = [
  'txt',
  'json',
];

export const SUPPORTED_IMAGE_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'tif', 'tiff', 'svg', 'ico', 'heic', 'heif',
];

export function getFileExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.substring(idx + 1).toLowerCase() : '';
}

export function isTextExtension(ext: string): boolean {
  return SUPPORTED_TEXT_EXTENSIONS.includes(ext.toLowerCase());
}

export function isImageExtension(ext: string): boolean {
  return SUPPORTED_IMAGE_EXTENSIONS.includes(ext.toLowerCase());
}


