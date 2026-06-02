import type { NormalizedImage } from "../types";
import { errorLogger } from "../../../shared/utils/errorLogger";

export const getPexelsImg = async (query?: string, page: number = 1): Promise<NormalizedImage[]> => {
  try {
    const url = new URL('/api/images', window.location.origin);
    url.searchParams.append('provider', 'pexels');
    url.searchParams.append('page', page.toString());
    if (query) url.searchParams.append('query', query);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      const error = new Error(`Pexels API error: ${response.status} ${statusText}`);
      errorLogger.error('Pexels API request failed', {
        status: response.status,
        statusText,
        url: url.toString(),
        query,
        page,
      }, error);
      throw error;
    }

    const data = await response.json();
    const photos = data.photos || [];
    
    if (!Array.isArray(photos)) {
      throw new Error('Invalid response format from Pexels');
    }
    
    return photos.map((img: any) => ({
      width: img.width,
      height: img.height,
      imageSrc: img.src.large,
      alt: img.alt || img.photographer || "Pexels Image",
    }));
  } catch (error) {
    if (error instanceof Error) {
      errorLogger.error('Pexels fetch error', { query, page }, error);
    }
    throw error;
  }
}