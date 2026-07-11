import type { NormalizedImage } from "../types";
import { errorLogger } from "../../../shared/utils/errorLogger";

/**
 * Resuelve un enlace pegado por el usuario hacia un `NormalizedImage`.
 *
 * Tres casos:
 * 1. Página de foto de Unsplash (`unsplash.com/photos/...`) → resuelve por ID vía `/api/images`.
 * 2. Página de foto de Pexels (`pexels.com/photo/...`) → resuelve por ID vía `/api/images`.
 * 3. Cualquier otro enlace directo a una imagen pública → se carga tal cual (sin re-subir),
 *    leyendo sus dimensiones reales del propio archivo.
 */
export async function resolveImageLink(rawUrl: string): Promise<NormalizedImage> {
	const trimmed = rawUrl.trim();
	if (!trimmed) {
		throw new Error("Pega un enlace de imagen.");
	}

	let url: URL;
	try {
		url = new URL(trimmed);
	} catch {
		throw new Error("El enlace no es válido. Copia la URL completa.");
	}

	if (url.protocol !== "http:" && url.protocol !== "https:") {
		throw new Error("El enlace debe empezar con http:// o https://.");
	}

	const unsplashId = parseUnsplashId(url);
	if (unsplashId) {
		return fetchProviderPhoto("unsplash", unsplashId);
	}

	const pexelsId = parsePexelsId(url);
	if (pexelsId) {
		return fetchProviderPhoto("pexels", pexelsId);
	}

	return loadDirectImage(trimmed);
}

/** Extrae el ID de una URL de página de Unsplash, o `null` si no lo es. */
function parseUnsplashId(url: URL): string | null {
	if (url.hostname !== "unsplash.com" && url.hostname !== "www.unsplash.com") {
		return null;
	}
	const segments = url.pathname.split("/").filter(Boolean);
	if (segments[0] !== "photos" || !segments[1]) {
		return null;
	}
	// La URL puede ser `/photos/{slug}-{id}` o `/photos/{id}`.
	// El ID es el último tramo tras el guion final.
	const last = segments[1];
	const id = last.includes("-") ? last.slice(last.lastIndexOf("-") + 1) : last;
	return id || null;
}

/** Extrae el ID de una URL de página de Pexels, o `null` si no lo es. */
function parsePexelsId(url: URL): string | null {
	if (url.hostname !== "pexels.com" && url.hostname !== "www.pexels.com") {
		return null;
	}
	// `/photo/{slug}-{id}/` (o localizado `/es-es/foto/{slug}-{id}/`). El ID es el número final.
	if (!/\/(photo|foto)\//.test(url.pathname)) {
		return null;
	}
	const match = url.pathname.match(/(\d+)\/?$/);
	return match ? match[1] : null;
}

/** Pide una sola foto normalizada al proxy `/api/images` y la normaliza al shape compartido. */
async function fetchProviderPhoto(
	provider: "unsplash" | "pexels",
	photoId: string,
): Promise<NormalizedImage> {
	try {
		const url = new URL("/api/images", window.location.origin);
		url.searchParams.append("provider", provider);
		url.searchParams.append("photoId", photoId);

		const response = await fetch(url.toString());
		if (!response.ok) {
			if (response.status === 404) {
				throw new Error("No encontramos esa foto. Revisa que el enlace sea correcto.");
			}
			throw new Error(`No se pudo obtener la imagen (${response.status}).`);
		}

		const data = await response.json();
		return provider === "unsplash" ? normalizeUnsplash(data) : normalizePexels(data);
	} catch (error) {
		if (error instanceof Error) {
			errorLogger.error("Resolve provider photo by link failed", { provider, photoId }, error);
		}
		throw error;
	}
}

interface UnsplashPhoto {
	width: number;
	height: number;
	urls?: { regular?: string };
	alt_description?: string | null;
	user?: { name?: string };
}

interface PexelsPhoto {
	width: number;
	height: number;
	src?: { large?: string };
	alt?: string | null;
	photographer?: string;
}

function normalizeUnsplash(img: UnsplashPhoto): NormalizedImage {
	if (!img?.urls?.regular) {
		throw new Error("La respuesta de Unsplash no tiene un formato válido.");
	}
	return {
		width: img.width,
		height: img.height,
		imageSrc: img.urls.regular,
		alt: img.alt_description || img.user?.name || "Unsplash Image",
	};
}

function normalizePexels(img: PexelsPhoto): NormalizedImage {
	if (!img?.src?.large) {
		throw new Error("La respuesta de Pexels no tiene un formato válido.");
	}
	return {
		width: img.width,
		height: img.height,
		imageSrc: img.src.large,
		alt: img.alt || img.photographer || "Pexels Image",
	};
}

/** Carga un enlace directo a imagen para leer sus dimensiones reales sin re-subirla. */
function loadDirectImage(src: string): Promise<NormalizedImage> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			if (!img.naturalWidth || !img.naturalHeight) {
				reject(new Error("El enlace no parece apuntar a una imagen válida."));
				return;
			}
			resolve({
				width: img.naturalWidth,
				height: img.naturalHeight,
				imageSrc: src,
				alt: "Imagen desde enlace",
			});
		};
		img.onerror = () => {
			const error = new Error(
				"No se pudo cargar la imagen desde el enlace. Asegúrate de que sea una URL pública y directa a la imagen.",
			);
			errorLogger.warn("Direct image link failed to load", { src });
			reject(error);
		};
		img.src = src;
	});
}
