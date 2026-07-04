import type React from "react";
import { FileJson, Image as ImageIcon, Save, Upload } from "lucide-react";
import type { ExportMode } from "../types";
import ExportOptionsButton from "./ExportOptionsButton";

interface ExportDownloadOptionsProps {
	exportMode: ExportMode;
	exportDpi: 150 | 300;
	onExportDpiChange: (dpi: 150 | 300) => void;
	onDownloadPng: () => void;
	onDownloadJpg: () => void;
	onSaveToBrowser: () => void;
	onExportJson: () => void;
	onImportClick: () => void;
	fileInputRef: React.RefObject<HTMLInputElement | null>;
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/** "Opciones de exportación" sidebar article: image (PNG/JPG) or data (save/JSON) tracks. */
export function ExportDownloadOptions({
	exportMode,
	exportDpi,
	onExportDpiChange,
	onDownloadPng,
	onDownloadJpg,
	onSaveToBrowser,
	onExportJson,
	onImportClick,
	fileInputRef,
	onFileChange,
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

			{exportMode === "data" && (
				<>
					<ExportOptionsButton
						name="Guardar en el Navegador"
						description="Almacenamiento Local"
						icon={<Save className="h-5 w-5 text-blue-600" aria-hidden="true" />}
						onClick={onSaveToBrowser}
					/>

					<div className="flex gap-2">
						<ExportOptionsButton
							name="Exportar como JSON"
							description="Metadatos sin procesar"
							icon={<FileJson className="h-5 w-5 text-gray-400" aria-hidden="true" />}
							onClick={onExportJson}
						/>
						<button
							title="Importar JSON"
							className="bg-df-surface dark:bg-df-surface-dark hover:border-df-primary/40 dark:hover:border-df-primary-dark/40 flex w-14 cursor-pointer items-center justify-center rounded-2xl border-2 border-gray-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700"
							onClick={onImportClick}
						>
							<Upload className="h-5 w-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
						</button>
					</div>

					<input
						type="file"
						accept="application/json"
						ref={fileInputRef}
						onChange={onFileChange}
						className="hidden"
					/>
				</>
			)}
		</article>
	);
}
