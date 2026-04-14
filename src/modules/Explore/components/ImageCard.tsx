
interface Props {
	imageSrc: string;
	alt: string;
	selected?: boolean;
	width?: string;
	height?: string;
	onClick?: () => void;
}

export default function ImageCard({
	imageSrc,
	alt,
	selected = false,
	width,
	height,
	onClick
}: Props) {

	const large = Number(height) > Number(width);

	return (
		<li className={large ? "row-span-2 h-full" : "row-span-1 col-span-2 h-full"}>
			<article
				onClick={onClick}
				className={[
					"group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer h-full",
					"transition-all duration-200 ease-out",
					"bg-df-surface dark:bg-df-surface-dark",
					selected
						? "ring-2 ring-df-primary dark:ring-df-primary-dark shadow-lg shadow-df-primary/10 dark:shadow-df-primary-dark/10 -translate-y-0.5 z-10"
						: "ring-1 ring-gray-200 dark:ring-gray-700/60 hover:ring-df-primary/40 dark:hover:ring-df-primary-dark/40 hover:-translate-y-1 hover:shadow-lg hover:z-10",
				].join(" ")}
				aria-selected={selected}
			>
				<div className="flex-1 w-full h-full overflow-hidden relative bg-gray-100 dark:bg-gray-800">
					<img
						src={imageSrc}
						alt={alt}
						className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
						loading="lazy"
						decoding="async"
					/>
					{!selected && (
						<div
							aria-hidden="true"
							className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-200 flex items-center justify-center"
						>
							<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md">
								<svg
									className="w-4 h-4 text-df-primary dark:text-df-primary-dark"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2.5"
									aria-hidden="true">
									<polyline points="20 6 9 17 4 12" />
								</svg>
							</div>
						</div>
					)}

					{selected && (
						<div
							aria-hidden="true"
							className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full
									bg-df-primary dark:bg-df-primary-dark
									flex items-center justify-center shadow-md"
						>
							<svg
								className="w-3.5 h-3.5 text-white"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="3"
								aria-hidden="true">
								<polyline points="20 6 9 17 4 12" />
							</svg>
						</div>
					)}
				</div>
			</article>
		</li>
	)
}

