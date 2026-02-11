type ImageQualityConfig = {
  [key: number]: number;
};

type TargetImageWidthConfig = {
  [key: number]: number;
};

type ReductionFactorConfig = {
  [key: number]: number;
};

/**
 * @description Image quality config for different file sizes.
 */
const IMAGE_QUALITY_CONFIG: ImageQualityConfig = {
  1: 0.3,
  1.5: 0.1,
  2: 0.3,
  1024: 1,
  2048: 1
};

/**
 * @description Target image width config for different file sizes.
 */
const TARGET_IMAGE_WIDTH_CONFIG: TargetImageWidthConfig = {
  1: 50,
  1.5: 400,
  2: 400,
  1024: 800,
  2048: 1000
};

/**
 * @description Reduction factor config for different file sizes.
 */
const REDUCTION_FACTOR: ReductionFactorConfig = {
  1: 2,
  2: 4,
  1.5: 4,
  1024: 10,
  2048: 10
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(new Error("failed to load image", { cause: error }));
    };
    img.src = url;
  });
}

function compressImage(
  image: HTMLImageElement,
  target: number,
  quality: number = 1
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const isWidthMore = image.width > image.height;
    const ratio = isWidthMore ? target / image.width : target / image.height;

    canvas.width = isWidthMore ? target : image.width * ratio;
    canvas.height = isWidthMore ? image.height * ratio : target;

    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Canvas not supported"));

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Compression failed"));
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

export async function compressImageToKB(file: File, maxSizeInKB: number): Promise<File> {
  if (
    !TARGET_IMAGE_WIDTH_CONFIG[maxSizeInKB] ||
    !IMAGE_QUALITY_CONFIG[maxSizeInKB] ||
    !REDUCTION_FACTOR[maxSizeInKB]
  ) {
    throw new Error("configs for maxSizeInKB is not set, please add it to the configs");
  }

  if (file.size <= maxSizeInKB * 1024) {
    return file;
  }

  const img = await loadImage(file);

  let width = TARGET_IMAGE_WIDTH_CONFIG[maxSizeInKB] || img.width;
  let blob: Blob = file;

  while (blob.size > maxSizeInKB * 1024) {
    const quality = IMAGE_QUALITY_CONFIG[maxSizeInKB] ?? 1;
    const newBlob = await compressImage(img, width, quality);

    if (!(await isValidImage(newBlob))) {
      break;
    }

    blob = newBlob;
    width -= REDUCTION_FACTOR[maxSizeInKB] || 2;
    if (width <= 0) {
      break;
    }
  }

  return new File([blob], file.name, { type: blob.type });
}

async function isValidImage(blob: Blob): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(true);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });
}
