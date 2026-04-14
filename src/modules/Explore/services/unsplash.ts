import type { NormalizedImage } from "../types";

export const getUnsplashImg = async (query?: string, page: number = 1): Promise<NormalizedImage[]> => {
  const clientId = "O4C3y9s_t9mhtuteakcP0oAM-REbX2zy0bpy63okaEE";
  
  const endpoint = query 
    ? `https://api.unsplash.com/search/photos/?client_id=${clientId}&query=${encodeURIComponent(query)}&per_page=20&page=${page}` 
    : `https://api.unsplash.com/photos/?client_id=${clientId}&per_page=20&page=${page}`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      redirect: "follow"
    });

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