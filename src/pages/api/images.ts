import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
	const url = new URL(request.url);
	const provider = url.searchParams.get("provider");
	const query = url.searchParams.get("query");
	const page = url.searchParams.get("page") || "1";
	const photoId = url.searchParams.get("photoId");

	try {
		if (provider === "pexels") {
			const pexelsKey = import.meta.env.PEXELS_API_KEY;
			if (!pexelsKey)
				return new Response(JSON.stringify({ error: "Missing PEXELS_API_KEY" }), { status: 500 });

			// Resolver una sola foto a partir de su ID (enlace pegado por el usuario)
			if (photoId) {
				const response = await fetch(
					`https://api.pexels.com/v1/photos/${encodeURIComponent(photoId)}`,
					{
						headers: { Authorization: pexelsKey },
					},
				);
				const data = await response.json();
				if (!response.ok) {
					return new Response(JSON.stringify({ error: "No se encontró la foto en Pexels" }), {
						status: response.status,
					});
				}
				return new Response(JSON.stringify(data), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			const endpoint = query
				? `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}`
				: `https://api.pexels.com/v1/curated?per_page=20&page=${page}`;

			const response = await fetch(endpoint, {
				headers: {
					Authorization: pexelsKey,
				},
			});

			const data = await response.json();
			return new Response(JSON.stringify(data), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		} else if (provider === "unsplash") {
			const unsplashKey = import.meta.env.UNSPLASH_CLIENT_ID;
			if (!unsplashKey)
				return new Response(JSON.stringify({ error: "Missing UNSPLASH_CLIENT_ID" }), {
					status: 500,
				});

			// Resolver una sola foto a partir de su ID (enlace pegado por el usuario)
			if (photoId) {
				const response = await fetch(
					`https://api.unsplash.com/photos/${encodeURIComponent(photoId)}?client_id=${unsplashKey}`,
				);
				const data = await response.json();
				if (!response.ok) {
					return new Response(JSON.stringify({ error: "No se encontró la foto en Unsplash" }), {
						status: response.status,
					});
				}
				return new Response(JSON.stringify(data), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			const endpoint = query
				? `https://api.unsplash.com/search/photos/?client_id=${unsplashKey}&query=${encodeURIComponent(query)}&per_page=20&page=${page}`
				: `https://api.unsplash.com/photos/?client_id=${unsplashKey}&per_page=20&page=${page}`;

			const response = await fetch(endpoint);
			const data = await response.json();

			return new Response(JSON.stringify(data), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		}

		return new Response(JSON.stringify({ error: "Invalid provider" }), { status: 400 });
	} catch (error) {
		console.error(`Error processing ${provider} request:`, error);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
	}
};
