"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronsRight } from "lucide-react";
import ImageCard from "./ImageCard";
import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import type { NormalizedImage } from "../types";
import { providers } from "../constants/providers";
import SearchBar from "./SearchBar";
import { useStore } from "@nanostores/react";
import { selectedImagesStore, toggleImageSelection } from "../../../shared/store/boardStore";
import SelectedImagesModal from "./SelectedImagesModal";
import { errorLogger } from "../../../shared/utils/errorLogger";
import { imageCache } from "../../../shared/utils/imageCache";
import { useDebounce } from "../../../shared/hooks/useDebounce";

export default function ImagesGallery() {
	const [selectedProviders, setSelectedProviders] = useState<string[]>(["unsplash", "pexels"]);
	const [images, setImages] = useState<NormalizedImage[]>([]);
	const [query, setQuery] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const selectedImages = useStore(selectedImagesStore);

	// Cierra el modal si la selección queda vacía. Se ajusta durante el render
	// (patrón recomendado por React: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
	// en vez de en un useEffect, para evitar el setState síncrono dentro de un efecto.
	const [prevSelectedCount, setPrevSelectedCount] = useState(selectedImages.length);
	if (selectedImages.length !== prevSelectedCount) {
		setPrevSelectedCount(selectedImages.length);
		if (selectedImages.length === 0) {
			setIsModalOpen(false);
		}
	}

	const loaderRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let isMounted = true;

		const fetchImages = async () => {
			try {
				if (page === 1) {
					setLoading(true);
					setError(null);
				} else {
					setLoadingMore(true);
				}

				const filterProviders = providers.filter((provider) =>
					selectedProviders.includes(provider.value),
				);

				// Check cache first (only for page 1)
				if (page === 1) {
					const cachedImages = imageCache.get(query, page, selectedProviders.join(","));

					if (cachedImages && cachedImages.length > 0) {
						if (!isMounted) return;
						setImages(cachedImages);
						setError(null);
						setLoading(false);
						return;
					}
				}

				// Usar allSettled para capturar errores de cada proveedor individualmente
				const results = await Promise.allSettled(
					filterProviders.map((provider) => provider.getImages(query, page)),
				);

				if (!isMounted) return;

				// Procesar resultados y errores
				const images: NormalizedImage[] = [];
				const failedProviders: string[] = [];

				results.forEach((result, idx) => {
					if (result.status === "fulfilled") {
						images.push(...result.value);
					} else {
						failedProviders.push(filterProviders[idx].label);
					}
				});

				const newImages = images.sort(() => Math.random() - 0.5);

				// Cache the results for page 1
				if (page === 1 && newImages.length > 0) {
					imageCache.set(query, newImages, page, selectedProviders.join(","));
				}

				// Mostrar error solo si TODOS los proveedores fallaron
				if (failedProviders.length === filterProviders.length) {
					setImages([]);
					setError(
						`No se pudieron cargar imágenes de los proveedores: ${failedProviders.join(", ")}`,
					);
				} else if (failedProviders.length > 0 && page === 1) {
					// Si algunos fallan pero otros funcionan, mostrar warning
					setImages(newImages);
					setError(null); // No es error crítico
				} else {
					setImages((prev) => (page === 1 ? newImages : [...prev, ...newImages]));
					setError(null);
				}
			} catch (err) {
				if (!isMounted) return;

				const errorMessage = err instanceof Error ? err.message : "Error al cargar imágenes";
				setError(errorMessage);

				// Log error with context
				errorLogger.error(
					"ImagesGallery fetch failed",
					{
						query,
						page,
						selectedProviders,
						message: errorMessage,
					},
					err instanceof Error ? err : undefined,
				);
			} finally {
				if (isMounted) {
					if (page === 1) setLoading(false);
					else setLoadingMore(false);
				}
			}
		};

		fetchImages();

		return () => {
			isMounted = false;
		};
	}, [selectedProviders, query, page]);

	// Intersection Observer for infinite scrolling
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const target = entries[0];
				if (target.isIntersecting && !loading && !loadingMore && images.length > 0) {
					setPage((prev) => prev + 1);
				}
			},
			{
				rootMargin: "200px", // fetch a bit before reaching bottom
			},
		);

		if (loaderRef.current) {
			observer.observe(loaderRef.current);
		}

		return () => {
			observer.disconnect();
		};
	}, [loading, loadingMore, images.length]);

	const handleSearch = (newQuery: string) => {
		setPage(1);
		setQuery(newQuery);
		setError(null);
		// Clear cache when searching (to get fresh results)
		imageCache.clear(newQuery);
	};

	// Debounced search handler
	const debouncedSearch = useDebounce(handleSearch, 500);

	const handleProvidersChange: React.Dispatch<React.SetStateAction<string[]>> = (val) => {
		setPage(1);
		setSelectedProviders(val);
		setError(null);
		// Clear cache when changing providers
		imageCache.clear();
	};

	// Listen for suggested searches
	useEffect(() => {
		const handleSuggestedSearch = (event: Event) => {
			const customEvent = event as CustomEvent<string>;
			handleSearch(customEvent.detail);
		};

		window.addEventListener("suggestSearch", handleSuggestedSearch);
		return () => window.removeEventListener("suggestSearch", handleSuggestedSearch);
	}, []);

	return (
		<section className="space-y-8">
			<div className="mb-8">
				<SearchBar
					providers={providers}
					selectedProviders={selectedProviders}
					setSelectedProviders={handleProvidersChange}
					initialQuery={query}
					onSearch={debouncedSearch}
				/>
			</div>

			{/* Loading State - First Load */}
			{loading && <LoadingState message="Cargando inspiración..." />}

			{/* Error State */}
			{error && !loading && (
				<ErrorState
					error={error}
					onRetry={() => {
						setPage(1);
						setError(null);
					}}
				/>
			)}

			{/* Gallery */}
			{!loading && !error && images.length > 0 && (
				<>
					{/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Tailwind resetea list-style en todos los ul/ol; sin el rol explícito, Safari/VoiceOver deja de anunciar la semantica de lista. */}
					<ul
						role="list"
						className="grid grid-flow-row-dense auto-rows-[140px] grid-cols-2 gap-4 md:auto-rows-[130px] md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4"
					>
						{images.map((img, index) => {
							const isSelected = selectedImages.some(
								(selected) => selected.imageSrc === img.imageSrc,
							);
							return (
								<ImageCard
									key={`${img.imageSrc}-${index}`}
									width={img.width.toString()}
									height={img.height.toString()}
									imageSrc={img.imageSrc}
									alt={img.alt}
									selected={isSelected}
									onClick={() => toggleImageSelection(img)}
								/>
							);
						})}
					</ul>

					{/* Infinite Scroll Loader */}
					{images.length > 0 && (
						<div
							ref={loaderRef}
							className="mt-4 flex h-24 items-center justify-center"
							role="status"
							aria-live="polite"
							aria-label="Cargando más imágenes"
						>
							{loadingMore && <LoadingState message="Cargando más imágenes..." />}
						</div>
					)}
				</>
			)}

			{/* Floating Bottom Bar for Selected Images */}
			{selectedImages.length > 0 && (
				<div className="animate-fade-in-up fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
					<nav
						className="bg-df-surface dark:bg-df-surface-dark dark:shadow-df-primary-dark/10 ring-df-border dark:ring-df-border-dark flex items-center gap-4 rounded-full px-4 py-3 shadow-2xl ring-1 transition-all duration-300"
						aria-label="Imágenes seleccionadas"
					>
						<button
							onClick={() => setIsModalOpen(true)}
							className="group flex cursor-pointer items-center gap-4 transition-opacity outline-none hover:opacity-80"
							aria-label={`Ver todas las ${selectedImages.length} imágenes seleccionadas`}
						>
							<div className="mr-2 flex -space-x-2" aria-hidden="true">
								{selectedImages.slice(0, 3).map((img, idx) => (
									<img
										key={idx}
										src={img.imageSrc}
										alt=""
										className="border-df-surface dark:border-df-surface-dark h-10 w-10 rounded-full border-2 object-cover"
									/>
								))}
								{selectedImages.length > 3 && (
									<div
										className="border-df-surface dark:border-df-surface-dark bg-df-surface-alt dark:bg-df-surface-alt-dark text-df-ink dark:text-df-ink-dark flex h-10 w-10 items-center justify-center rounded-full border-2 text-[10px] font-bold"
										aria-label={`${selectedImages.length - 3} imágenes más`}
									>
										+{selectedImages.length - 3}
									</div>
								)}
							</div>

							<div className="shrink-0">
								<p className="text-df-ink dark:text-df-ink-dark text-xs leading-none font-bold tracking-widest uppercase">
									{selectedImages.length} {selectedImages.length === 1 ? "imagen" : "imágenes"}
								</p>
								<p className="text-df-muted dark:text-df-muted-dark mt-0.5 text-[10px] font-semibold tracking-widest uppercase">
									{selectedImages.length === 1 ? "seleccionada" : "seleccionadas"}
								</p>
							</div>
						</button>

						<div
							className="bg-df-muted dark:bg-df-muted-dark mx-2 h-6 w-px"
							aria-hidden="true"
						></div>

						<a
							href="/canvas"
							className="from-df-primary to-df-accent dark:from-df-primary-dark dark:to-df-accent-dark shadow-df-primary/30 dark:shadow-df-primary-dark/20 flex items-center gap-2 rounded-full bg-linear-to-r px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-150 hover:opacity-90 active:scale-95"
							aria-label="Ir a canvas para armar el board con las imágenes seleccionadas"
						>
							Armar Board
							<ChevronsRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
						</a>
					</nav>
				</div>
			)}

			<SelectedImagesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
		</section>
	);
}
