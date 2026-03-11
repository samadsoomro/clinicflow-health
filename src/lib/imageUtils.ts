/**
 * Compresses an image file using a canvas before upload.
 * Reduces file size significantly while maintaining acceptable quality.
 *
 * @param file - The original image File
 * @param maxWidthPx - Maximum width in pixels (default 800)
 * @param qualityPercent - JPEG quality 0–1 (default 0.8)
 * @returns A new compressed File object
 */
export const compressImage = (
  file: File,
  maxWidthPx = 800,
  qualityPercent = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const ratio = Math.min(maxWidthPx / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          resolve(new File([blob!], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
          URL.revokeObjectURL(url);
        },
        "image/jpeg",
        qualityPercent
      );
    };

    img.src = url;
  });
};
