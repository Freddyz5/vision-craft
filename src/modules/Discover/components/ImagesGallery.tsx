'use client'
import { useState, useEffect, useRef } from 'react';
import ImageCard from './ImageCard';
import type { NormalizedImage } from '../types';
import { providers } from '../constants/providers';
import SearcBar from './SearchBar';
import { useStore } from '@nanostores/react';
import { selectedImagesStore, toggleImageSelection } from '../../../store/boardStore';
import SelectedImagesModal from './SelectedImagesModal';

export default function ImagesGallery() {

	const [selectedProviders, setSelectedProviders] = useState<string[]>(['unsplash', 'pexels']);
	const [images, setImages] = useState<NormalizedImage[]>([]);
	const [query, setQuery] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);

	const selectedImages = useStore(selectedImagesStore);

	useEffect(() => {
		if (selectedImages.length === 0) {
			setIsModalOpen(false);
		}
	}, [selectedImages.length]);

	const loaderRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let isMounted = true;

		const fetchImages = async () => {
			if (page === 1) setLoading(true);
			else setLoadingMore(true);

			const filterProviders = providers.filter(provider => selectedProviders.includes(provider.value));

			const results = await Promise.all(
				filterProviders.map((provider) => provider.getImages(query, page))
			);

			if (!isMounted) return;

			const newImages = results.flat().sort(() => Math.random() - 0.5);
			setImages(prev => page === 1 ? newImages : [...prev, ...newImages]);

			if (page === 1) setLoading(false);
			else setLoadingMore(false);
		};

		fetchImages();

		return () => { isMounted = false; };
	}, [selectedProviders, query, page]);

	// Intersection Observer for infinite scrolling
	useEffect(() => {
		const observer = new IntersectionObserver((entries) => {
			const target = entries[0];
			if (target.isIntersecting && !loading && !loadingMore && images.length > 0) {
				setPage(prev => prev + 1);
			}
		}, {
			rootMargin: '200px', // fetch a bit before reaching bottom
		});

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
	};

	const handleProvidersChange: React.Dispatch<React.SetStateAction<string[]>> = (val) => {
		setPage(1);
		setSelectedProviders(val);
	};

	return (
		<section aria-labelledby="gallery-heading">
			<div className="mb-8">
				<SearcBar
					providers={providers}
					selectedProviders={selectedProviders}
					setSelectedProviders={handleProvidersChange}
					initialQuery={query}
					onSearch={handleSearch}
				/>
			</div>

			{loading ? (
				<div className="flex justify-center items-center h-40">
					<p className="text-df-muted dark:text-df-muted-dark text-sm animate-pulse">Cargando inspiración...</p>
				</div>
			) : (
				<>
					<ul
						role="list"
						className="grid grid-flow-row-dense grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 auto-rows-[140px] md:auto-rows-[130px] gap-4">
						{
							images.map((img, index) => {
								const isSelected = selectedImages.some(selected => selected.imageSrc === img.imageSrc);
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
							})
						}
					</ul>

					{/* Loader div for Infinite Scroll */}
					{images.length > 0 && (
						<div ref={loaderRef} className="flex justify-center items-center h-24 mt-4">
							{loadingMore && (
								<p className="text-df-muted dark:text-df-muted-dark text-sm animate-pulse">
									Cargando más imágenes...
								</p>
							)}
						</div>
					)}
				</>
			)}

			{/* Floating Bottom Bar for Selected Images */}
			{selectedImages.length > 0 && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
					<div className="bg-df-surface dark:bg-df-surface-dark shadow-2xl dark:shadow-df-primary-dark/10 ring-1 ring-gray-200 dark:ring-gray-800 rounded-full py-3 px-4 flex items-center gap-4 transition-all duration-300">
						<button
							onClick={() => setIsModalOpen(true)}
							className="flex items-center gap-4 group cursor-pointer outline-none"
						>
							<div className="flex -space-x-2 mr-2">
								{selectedImages.slice(0, 3).map((img, idx) => (
									<img
										key={idx}
										src={img.imageSrc}
										alt="Selected"
										className="w-10 h-10 rounded-full border-2 border-df-surface dark:border-df-surface-dark object-cover"
									/>
								))}
								{selectedImages.length > 3 && (
									<div className="w-10 h-10 rounded-full border-2 border-df-surface dark:border-df-surface-dark bg-gray-200 dark:bg-gray-500 flex items-center justify-center text-[10px] font-bold text-df-ink dark:text-df-ink-dark">
										+{selectedImages.length - 3}
									</div>
								)}
							</div>

							{/* <p className="text-sm font-medium text-df-ink dark:text-df-ink-dark group-hover:text-df-primary dark:group-hover:text-df-primary-dark transition-colors">
								{selectedImages.length} {selectedImages.length === 1 ? 'imagen seleccionada' : 'imágenes seleccionadas'}
							</p> */}
							<div className="shrink-0">
								<p className="text-xs font-bold text-df-ink dark:text-df-ink-dark uppercase tracking-widest leading-none">
									{selectedImages.length} {selectedImages.length === 1 ? 'imagen' : 'imágenes'}
								</p>
								<p className="text-[10px] font-semibold text-df-muted dark:text-df-muted-dark uppercase tracking-widest mt-0.5">
									{selectedImages.length === 1 ? 'seleccionada' : 'seleccionadas'}
								</p>
							</div>
						</button>

						<div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700 mx-2"></div>

						<a
							href="/canvas"
							className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-df-primary to-df-accent dark:from-df-primary-dark dark:to-df-accent-dark hover:opacity-90 active:scale-95 transition-all duration-150 shadow-md shadow-df-primary/30 dark:shadow-df-primary-dark/20"
						>
							Armar Board
							<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
								<path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
							</svg>
						</a>
					</div>
				</div>
			)}

			<SelectedImagesModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
			/>
		</section>
	)
}