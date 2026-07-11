import { useState } from "react";
import { ImagePlus } from "lucide-react";
import type { NormalizedImage } from "../types";
import { uploadToCloudinary, validateImageFile } from "../services/cloudinary";

interface Props {
	onUploaded: (image: NormalizedImage) => void;
	onError: (message: string) => void;
	className?: string;
}

/** Card visual + lógica de subida usada por HeaderAddImages. */
export default function UploadDropzone({
	onUploaded,
	onError,
	className = "h-full w-full",
}: Props) {
	const [uploading, setUploading] = useState(false);

	const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const validationError = validateImageFile(file);
		if (validationError) {
			onError(validationError);
			e.target.value = "";
			return;
		}

		setUploading(true);
		try {
			const image = await uploadToCloudinary(file);
			onUploaded(image);
		} catch (err) {
			onError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
		} finally {
			setUploading(false);
			e.target.value = "";
		}
	};

	return (
		<label
			className={[
				"group relative flex flex-col overflow-hidden rounded-2xl",
				"transition-all duration-200 ease-out",
				"bg-df-surface dark:bg-df-surface-dark",
				"ring-df-muted dark:ring-df-muted-dark border-dashed ring-1",
				uploading
					? "cursor-wait opacity-70"
					: "hover:ring-df-primary/40 dark:hover:ring-df-primary-dark/40 cursor-pointer hover:z-10 hover:-translate-y-1 hover:shadow-lg",
				"focus-within:outline-df-primary dark:focus-within:outline-df-primary-dark focus-within:outline-2 focus-within:outline-offset-2",
				className,
			].join(" ")}
			aria-busy={uploading}
		>
			<input
				type="file"
				accept="image/*"
				onChange={handleChange}
				disabled={uploading}
				className="sr-only"
				aria-label={uploading ? "Subiendo imagen..." : "Subir imagen"}
			/>
			<div className="flex h-full w-full flex-1 flex-col items-center justify-center gap-2 border-2 border-dashed border-transparent p-3 text-center">
				{uploading ? (
					<div className="relative h-6 w-6" aria-hidden="true">
						<div className="border-df-border dark:border-df-border-dark absolute inset-0 rounded-full border-2"></div>
						<div className="border-t-df-primary dark:border-t-df-primary-dark absolute inset-0 animate-spin rounded-full border-2 border-transparent"></div>
					</div>
				) : (
					<ImagePlus
						className="text-df-muted dark:text-df-muted-dark group-hover:text-df-primary dark:group-hover:text-df-primary-dark h-6 w-6 transition-colors"
						strokeWidth={2}
						aria-hidden="true"
					/>
				)}
				<span className="text-df-muted dark:text-df-muted-dark group-hover:text-df-ink dark:group-hover:text-df-ink-dark text-xs font-semibold transition-colors">
					{uploading ? "Subiendo..." : "O sube tu propia imagen"}
				</span>
			</div>
		</label>
	);
}
