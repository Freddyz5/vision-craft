import { Check } from "lucide-react";

interface Props {
	imageSrc: string;
	alt: string;
	selected?: boolean;
	width?: string;
	height?: string;
	onClick?: () => void;
	onDragStart?: (e: React.DragEvent<HTMLImageElement>) => void;
}

export default function ImageCard({
	imageSrc,
	alt,
	selected = false,
	width,
	height,
	onClick,
	onDragStart,
}: Props) {
	const large = Number(height) > Number(width);

	return (
		<li className={large ? "row-span-2 h-full" : "col-span-2 row-span-1 h-full"}>
			<button
				type="button"
				onClick={onClick}
				className={[
					"group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl",
					"transition-all duration-200 ease-out",
					"bg-df-surface dark:bg-df-surface-dark",
					"focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2",
					selected
						? "ring-df-primary dark:ring-df-primary-dark shadow-df-primary/10 dark:shadow-df-primary-dark/10 z-10 -translate-y-0.5 shadow-lg ring-2"
						: "ring-df-muted dark:ring-df-muted-dark hover:ring-df-primary/40 dark:hover:ring-df-primary-dark/40 ring-1 hover:z-10 hover:-translate-y-1 hover:shadow-lg",
				].join(" ")}
				aria-pressed={selected}
				aria-label={`${alt}${selected ? " - seleccionada" : ""}`}
				draggable={onDragStart ? true : false}
				onDragStart={onDragStart}
			>
				<div className="bg-df-surface dark:bg-df-surface-dark relative h-full w-full flex-1 overflow-hidden">
					<img
						src={imageSrc}
						alt={alt}
						className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
						loading="lazy"
						decoding="async"
					/>
					{!selected && (
						<div
							aria-hidden="true"
							className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/15"
						>
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 opacity-0 shadow-md backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
								<Check
									className="text-df-primary dark:text-df-primary-dark h-4 w-4"
									strokeWidth={2.5}
									aria-hidden="true"
								/>
							</div>
						</div>
					)}

					{selected && (
						<div
							aria-hidden="true"
							className="bg-df-primary dark:bg-df-primary-dark absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full shadow-md"
						>
							<Check className="h-3.5 w-3.5 text-white" strokeWidth={3} aria-hidden="true" />
						</div>
					)}
				</div>
			</button>
		</li>
	);
}
