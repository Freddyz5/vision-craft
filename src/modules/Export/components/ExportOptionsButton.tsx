import React from "react";
import { ChevronRight } from "lucide-react";

const ExportOptionsButton = ({
	name,
	description,
	icon,
	onClick,
}: {
	name: string;
	description: string;
	icon?: React.ReactNode;
	onClick: () => void;
}) => {
	return (
		<button
			className={[
				"flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border-2 p-4 text-left transition-all duration-200 outline-none",
				"bg-df-surface dark:bg-df-surface-dark hover:border-df-primary/40 dark:hover:border-df-primary-dark/40 border-gray-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700",
			].join(" ")}
			onClick={onClick}
		>
			<article className="flex items-center gap-4">
				<div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 transition-transform group-hover:scale-110 dark:text-purple-400">
					{icon}
				</div>

				<div className="text-left">
					<span className="text-df-ink dark:text-df-ink-dark block text-sm font-bold">{name}</span>
					<span className="text-df-muted dark:text-df-muted-dark block text-xs">{description}</span>
				</div>
			</article>

			<div className="text-df-muted dark:text-df-muted-dark">
				<ChevronRight className="h-4 w-4" aria-hidden="true" />
			</div>
		</button>
	);
};

export default ExportOptionsButton;
