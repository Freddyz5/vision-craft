import type { NormalizedImage } from "../types";
import { errorLogger } from "../../../shared/utils/errorLogger";

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
	if (!file.type.startsWith("image/")) {
		errorLogger.warn("Invalid file rejected before Cloudinary upload", {
			fileName: file.name,
			fileType: file.type,
			fileSize: file.size,
		});
		return "El archivo debe ser una imagen (JPG, PNG, WEBP, GIF).";
	}

	if (file.size > MAX_FILE_SIZE_BYTES) {
		errorLogger.warn("Invalid file rejected before Cloudinary upload", {
			fileName: file.name,
			fileType: file.type,
			fileSize: file.size,
		});
		return "La imagen no debe superar los 10MB.";
	}

	return null;
}

export async function uploadToCloudinary(file: File): Promise<NormalizedImage> {
	const cloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
	const uploadPreset = import.meta.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET;

	if (!cloudName || !uploadPreset) {
		throw new Error("Subida de imágenes no configurada.");
	}

	try {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("upload_preset", uploadPreset);

		const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
			method: "POST",
			body: formData,
		});

		const data = await response.json();

		if (!response.ok) {
			const message = data?.error?.message || "No se pudo subir la imagen.";
			throw new Error(message);
		}

		return {
			width: data.width,
			height: data.height,
			imageSrc: data.secure_url,
			alt: data.original_filename || "Imagen subida",
		};
	} catch (error) {
		if (error instanceof Error) {
			errorLogger.error("Cloudinary upload error", { fileName: file.name }, error);
		}
		throw error;
	}
}
