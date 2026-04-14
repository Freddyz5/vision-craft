import type { NormalizedImage } from "../types";

export const getUnsplashImg = async (query?: string, page: number = 1): Promise<NormalizedImage[]> => {
  try {
    const url = new URL('/api/images', window.location.origin);
    url.searchParams.append('provider', 'unsplash');
    url.searchParams.append('page', page.toString());
    if (query) url.searchParams.append('query', query);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    const photos = query ? data.results : data;
    
    if (!Array.isArray(photos)) return [];
    
    return photos.map((img: any) => ({
      width: img.width,
      height: img.height,
      imageSrc: img.urls.regular,
      alt: img.alt_description || img.user?.name || "Unsplash Image",
    }));
  } catch (error) {
    console.error("Error fetching Unsplash images:", error);
    return [];
  }
}