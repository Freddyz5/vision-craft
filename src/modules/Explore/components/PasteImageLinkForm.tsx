import { useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import type { NormalizedImage } from "../types";
import { resolveImageLink } from "../services/imageLink";

interface Props {
	onResolved: (image: NormalizedImage) => void;
	onError: (message: string) => void;
	className?: string;
}

/** Campo para pegar el enlace de una imagen (Unsplash/Pexels o URL pública directa). */
export default function PasteImageLinkForm({ onResolved, onError, className = "" }: Props) {
	const [value, setValue] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (loading) return;

		setLoading(true);
		try {
			const image = await resolveImageLink(value);
			onResolved(image);
			setValue("");
		} catch (err) {
			onError(err instanceof Error ? err.message : "No se pudo agregar la imagen desde el enlace.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className={["flex flex-col gap-2", className].join(" ")}>
			<label
				htmlFor="paste-image-link"
				className="text-df-muted dark:text-df-muted-dark text-xs font-semibold"
			>
				O pega el enlace de una imagen
			</label>
			<div className="flex gap-2">
				<div className="relative flex-1">
					<Link2
						className="text-df-muted dark:text-df-muted-dark pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2"
						strokeWidth={2}
						aria-hidden="true"
					/>
					<input
						id="paste-image-link"
						type="url"
						inputMode="url"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						disabled={loading}
						placeholder="https://unsplash.com/photos/..."
						className="bg-df-surface dark:bg-df-surface-dark ring-df-border dark:ring-df-border-dark text-df-ink dark:text-df-ink-dark placeholder:text-df-muted/70 dark:placeholder:text-df-muted-dark/70 focus:ring-df-primary dark:focus:ring-df-primary-dark w-full rounded-lg py-2 pr-2 pl-8 text-xs ring-1 transition-shadow outline-none focus:ring-2"
						aria-label="Enlace de la imagen"
					/>
				</div>
				<button
					type="submit"
					disabled={loading || !value.trim()}
					className="bg-df-primary dark:bg-df-primary-dark flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
					aria-busy={loading}
				>
					{loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Agregar"}
				</button>
			</div>
		</form>
	);
}
