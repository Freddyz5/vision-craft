import { Image as ImageIcon } from "lucide-react";
import type { ExportMode } from "../types";
import ExportOptionsButton from "./ExportOptionsButton";

interface ExportDownloadOptionsProps {
	exportMode: ExportMode;
	exportDpi: 150 | 300;
	onExportDpiChange: (dpi: 150 | 300) => void;
	onDownloadPng: () => void;
	onDownloadJpg: () => void;
}

/** "Opciones de exportación" sidebar article: image (PNG/JPG) download track. */
export function ExportDownloadOptions({
	exportMode,
	exportDpi,
	onExportDpiChange,
	onDownloadPng,
	onDownloadJpg,
}: ExportDownloadOptionsProps) {
	return (
		<article className="flex flex-col gap-2">
			<p className="text-df-muted dark:text-df-muted-dark pb-2 text-center text-[9px] font-bold tracking-[0.22em] uppercase">
				Opciones de exportación
			</p>

			{exportMode === "image" && (
				<>
					<div className="bg-df-surface dark:bg-df-surface-dark rounded-2xl border-2 border-gray-200 p-4 dark:border-gray-700">
						<div className="flex items-center justify-between">
							<span className="text-df-ink dark:text-df-ink-dark text-xs font-semibold">
								DPI de exportación
							</span>
							<select
								className="select select-bordered select-sm bg-base-100 dark:bg-df-bg-dark"
								value={exportDpi}
								onChange={(e) => onExportDpiChange(parseInt(e.target.value) as 150 | 300)}
							>
								<option value={150}>150</option>
								<option value={300}>300</option>
							</select>
						</div>
					</div>

					<ExportOptionsButton
						name="Descargar como PNG"
						description="Imagen sin pérdida"
						icon={<ImageIcon className="h-5 w-5 text-[#20d4a4]" aria-hidden="true" />}
						onClick={onDownloadPng}
					/>

					<ExportOptionsButton
						name="Descargar como JPG"
						description="Más liviano para compartir"
						icon={<ImageIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />}
						onClick={onDownloadJpg}
					/>
				</>
			)}
		</article>
	);
}
