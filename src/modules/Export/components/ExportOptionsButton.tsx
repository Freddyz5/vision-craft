import React from "react";

const IconChevronRight = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round">
		<polyline points="9 18 15 12 9 6"></polyline>
	</svg>
);

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
				"w-full flex items-center gap-2 p-4 justify-between rounded-2xl border-2 transition-all duration-200 text-left cursor-pointer outline-none",
				"border-gray-200 dark:border-gray-700 bg-df-surface dark:bg-df-surface-dark hover:border-df-primary/40 dark:hover:border-df-primary-dark/40 hover:-translate-y-0.5 hover:shadow-md",
			].join(" ")}
			onClick={onClick}>
			<article className="flex gap-4 items-center">
				<div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg group-hover:scale-110 transition-transform">
					{icon}
				</div>

				<div className="text-left">
					<span className="block font-bold text-sm text-df-ink dark:text-df-ink-dark">
						{name}
					</span>
					<span className="block text-xs text-df-muted dark:text-df-muted-dark">
						{description}
					</span>
				</div>
			</article>

			<div className="text-df-muted dark:text-df-muted-dark">
				<IconChevronRight />
			</div>
		</button>
	);
};

export default ExportOptionsButton;
