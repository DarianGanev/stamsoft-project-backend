export const MAX_IMAGES_PER_LISTING = 20;
export const MAX_IMAGES_PER_UPLOAD = 10;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
