import { useStore } from "@nanostores/react";
import { Check, StepBack, StepForward } from "lucide-react";
import { LINKS } from "../constants/links";
import { selectedImagesStore } from "../store/boardStore";
import { activeCanvasConfigStore, activeCanvasItemsStore } from "../store/canvasStore";

interface Props {
	activeItem: string;
}

function isStepCompleted(
	id: string,
	selectedCount: number,
	canvasName: string,
	itemsCount: number,
): boolean {
	switch (id) {
		case "explore":
			return selectedCount > 0;
		case "canvas":
			return canvasName.trim() !== "";
		case "design":
		case "export":
			return itemsCount > 0;
		default:
			return false;
	}
}

const arrowButtonClass =
	"flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-df-muted dark:text-df-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-df-ink dark:hover:text-df-ink-dark transition-colors";

export default function StepperNav({ activeItem }: Props) {
	const selectedImages = useStore(selectedImagesStore);
	const canvasConfig = useStore(activeCanvasConfigStore);
	const canvasItems = useStore(activeCanvasItemsStore);

	const currentIndex = LINKS.findIndex((link) => link.id === activeItem);
	// currentIndex === -1 means we are on a page outside the 4-step wizard
	// (e.g. /boards): show the steps, but no prev/next arrows.
	const isWizardStep = currentIndex >= 0;
	const prevLink = currentIndex > 0 ? LINKS[currentIndex - 1] : undefined;
	const nextLink =
		isWizardStep && currentIndex < LINKS.length - 1 ? LINKS[currentIndex + 1] : undefined;

	return (
		<nav
			aria-label="Progreso del flujo"
			className="flex h-14 w-full items-center justify-evenly gap-1"
		>
			{prevLink ? (
				<a
					href={prevLink.href}
					aria-label={`Paso anterior: ${prevLink.name}`}
					className={arrowButtonClass}
				>
					<StepBack className="h-4 w-4" aria-hidden="true" strokeWidth={3} />
				</a>
			) : (
				<span className="h-7 w-7 shrink-0" aria-hidden="true" />
			)}

			{/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Tailwind resetea list-style en todos los ul/ol; sin el rol explícito, Safari/VoiceOver deja de anunciar la semantica de lista. */}
			<ol className="flex h-full w-[60%] items-center justify-center-safe gap-2" role="list">
				{LINKS.map((link, index) => {
					const isCurrent = activeItem === link.id;
					const isCompleted =
						!isCurrent &&
						isStepCompleted(link.id, selectedImages.length, canvasConfig.name, canvasItems.length);

					return (
						<li key={link.id} className="flex items-center gap-2">
							<a
								href={link.href}
								aria-current={isCurrent ? "step" : undefined}
								className={[
									"flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
									isCurrent
										? "bg-df-primary dark:bg-df-primary-dark text-white"
										: isCompleted
											? "text-df-ink dark:text-df-ink-dark hover:bg-gray-100 dark:hover:bg-gray-800"
											: "text-df-muted dark:text-df-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800",
								].join(" ")}
							>
								<span
									className={[
										"flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
										isCurrent
											? "bg-white/20 text-white"
											: isCompleted
												? "bg-df-primary dark:bg-df-primary-dark text-white"
												: "text-df-muted dark:text-df-muted-dark bg-gray-100 dark:bg-gray-800",
									].join(" ")}
									aria-hidden="true"
								>
									{isCompleted ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
								</span>
								{link.name}
							</a>
							{index < LINKS.length - 1 && (
								<span className="h-px w-6 bg-gray-300 dark:bg-gray-600" aria-hidden="true" />
							)}
						</li>
					);
				})}
			</ol>

			{nextLink ? (
				<a
					href={nextLink.href}
					aria-label={`Siguiente paso: ${nextLink.name}`}
					className={arrowButtonClass}
				>
					<StepForward className="h-4 w-4" aria-hidden="true" />
				</a>
			) : (
				<span className="h-7 w-7 shrink-0" aria-hidden="true" />
			)}
		</nav>
	);
}
