import { useState } from "react";
import { Search } from "lucide-react";

interface Props {
	initialQuery: string;
	providers: { label: string; value: string }[];
	selectedProviders: string[];
	setSelectedProviders: React.Dispatch<React.SetStateAction<string[]>>;
	onSearch: (query: string) => void;
}

export default function SearchBar({
	initialQuery,
	providers,
	selectedProviders,
	setSelectedProviders,
	onSearch,
}: Props) {
	const [inputValue, setInputValue] = useState(initialQuery);

	const handleChange = (value: string) => {
		setSelectedProviders((prev) => {
			if (prev.includes(value)) {
				return prev.filter((provider) => provider !== value);
			} else {
				return [...prev, value];
			}
		});
	};

	const handleInputChange = (newValue: string) => {
		setInputValue(newValue);
		// Immediate search for empty string
		if (newValue.trim() === "") {
			onSearch("");
		} else {
			// Debounced search for non-empty queries
			onSearch(newValue);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSearch(inputValue);
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="bg-df-surface dark:bg-df-surface-dark border-df-muted dark:border-df-muted-dark flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm"
		>
			{/* Search input */}
			<search className="flex min-w-0 flex-1 basis-full items-center gap-3 sm:basis-auto">
				<Search
					className="text-df-muted dark:text-df-muted-dark h-4.5 w-4.5 shrink-0"
					aria-hidden="true"
				/>
				<label htmlFor="inspiration-search" className="sr-only">
					Busca tu inspiración
				</label>
				<input
					id="inspiration-search"
					type="search"
					value={inputValue}
					onChange={(e) => handleInputChange(e.target.value)}
					placeholder="Busca tu inspiración (ej. 'Arquitectura Minimalista', 'Neon Tokyo')"
					className="text-df-ink dark:text-df-ink-dark placeholder:text-df-muted dark:placeholder:text-df-muted-dark min-w-0 flex-1 bg-transparent text-sm outline-none"
				/>
			</search>

			{/* Divider */}
			<div
				className="bg-df-border dark:bg-df-border-dark hidden h-5 w-px shrink-0 sm:block"
				aria-hidden="true"
			/>

			{/* Provider filters */}
			<fieldset className="flex shrink-0 items-center gap-4">
				<legend className="text-df-muted dark:text-df-muted-dark pr-1 text-[9px] font-bold tracking-[0.15em] uppercase">
					Providers:
				</legend>

				{providers.map(({ label, value }) => (
					<label
						key={`key-${value}`}
						className="group/check flex cursor-pointer items-center gap-1.5"
					>
						<input
							type="checkbox"
							id={`id-${value}`}
							value={value}
							checked={selectedProviders.includes(value)}
							onChange={(e) => handleChange(e.target.value)}
							className="border-df-border dark:border-df-border-dark accent-df-primary dark:accent-df-primary-dark h-4 w-4 cursor-pointer rounded"
						/>
						<span className="text-df-ink dark:text-df-ink-dark group-hover/check:text-df-primary dark:group-hover/check:text-df-primary-dark text-xs font-medium transition-colors select-none">
							{label}
						</span>
					</label>
				))}
			</fieldset>
		</form>
	);
}
