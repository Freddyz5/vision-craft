import type { NormalizedImage } from "../types";

export const getPexelsImg = async (query?: string, page: number = 1): Promise<NormalizedImage[]> => {
  const myHeaders = new Headers();
  myHeaders.append("Authorization", "nJcBee8Xd8jDS9HQhJGUF03xPMKxIxepySyO8JZgseyhBQs25khlPlwD");
  
  const endpoint = query 
    ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}` 
    : `https://api.pexels.com/v1/curated?per_page=20&page=${page}`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    });

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