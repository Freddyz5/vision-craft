import type { NormalizedImage } from "../types";

export const getPexelsImg = async (query?: string, page: number = 1): Promise<NormalizedImage[]> => {
  try {
    const url = new URL('/api/images', window.location.origin);
    url.searchParams.append('provider', 'pexels');
    url.searchParams.append('page', page.toString());
    if (query) url.searchParams.append('query', query);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    const photos = data.photos || [];
    
    return photos.map((img: any) => ({
      width: img.width,
      height: img.height,
      imageSrc: img.src.large,
      alt: img.alt || img.photographer || "Pexels Image",
    }));
  } catch (error) {
    console.error("Error fetching Pexels images:", error);
    return [];
  }
}