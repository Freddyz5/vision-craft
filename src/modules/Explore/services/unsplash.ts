import type { NormalizedImage } from "../types";
import { errorLogger } from "../../../shared/utils/errorLogger";

export const getUnsplashImg = async (query?: string, page: number = 1): Promise<NormalizedImage[]> => {
  try {
    const url = new URL('/api/images', window.location.origin);
    url.searchParams.append('provider', 'unsplash');
    url.searchParams.append('page', page.toString());
    if (query) url.searchParams.append('query', query);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      const error = new Error(`Unsplash API error: ${response.status} ${statusText}`);
      errorLogger.error('Unsplash API request failed', {
        status: response.status,
        statusText,
        url: url.toString(),
        query,
        page,
      }, error);
      throw error;
    }

    const data = await response.json();
    const photos = query ? data.results : data;
    
    if (!Array.isArray(photos)) {
      throw new Error('Invalid response format from Unsplash');
    }
    
    return photos.map((img: any) => ({
      width: img.width,
      height: img.height,
      imageSrc: img.urls.regular,
      alt: img.alt_description || img.user?.name || "Unsplash Image",
    }));
  } catch (error) {
    if (error instanceof Error) {
      errorLogger.error('Unsplash fetch error', { query, page }, error);
    }
    throw error;
  }
}