import React, { useRef } from "react";
import { useStore } from "@nanostores/react";
import { LayoutGrid, Upload } from "lucide-react";
import { importCanvasToLibrary, savedCanvasesStore } from "../../../shared/store/canvasStore";
import { useToast } from "../../../shared/hooks/useToast";
import { Toast } from "../../../shared/components/Toast";
import BoardCard from "./BoardCard";

/**
 * Boards library: lists every board the user has saved, lets them download any
 * of them as JSON, and import a board from a JSON file back into the library.
 * This is the new home for the data (save / JSON) actions that used to live in
 * the Export module.
 */
export default function BoardsManager() {
	const boards = useStore(savedCanvasesStore);
	const { toastMessage, showToast } = useToast();

	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImportClick = () => fileInputRef.current?.click();

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			const imported = await importCanvasToLibrary(file);
			showToast(`"${imported.name}" importado a tus tableros.`);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Archivo inválido.";
			showToast("Error al importar: " + message);
		}
		// Reset so importing the same file twice fires onChange again.
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	return (
		<section className="flex flex-1 flex-col gap-6 px-8 pb-10">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<p className="text-df-muted dark:text-df-muted-dark text-[10px] font-bold tracking-[0.22em] uppercase">
					Mis Tableros ({boards.length})
				</p>

				<button
					onClick={handleImportClick}
					className="bg-df-primary flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
				>
					<Upload className="h-4 w-4" aria-hidden="true" />
					Importar JSON
				</button>

				<input
					type="file"
					accept="application/json"
					ref={fileInputRef}
					onChange={handleFileChange}
					className="hidden"
				/>
			</div>

			{boards.length === 0 ? (
				<div className="border-df-primary/30 dark:border-df-primary-dark/30 text-df-muted dark:text-df-muted-dark flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-20 text-center">
					<LayoutGrid className="h-10 w-10 opacity-60" aria-hidden="true" />
					<p className="text-base font-semibold">Aún no tienes tableros guardados.</p>
					<p className="max-w-sm text-sm">
						Crea uno en el editor y pulsa <span className="font-semibold">Guardar</span>, o importa
						un tablero desde un archivo JSON.
					</p>
					<div className="mt-2 flex gap-3">
						<a
							href="/design"
							className="bg-df-primary cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
						>
							Ir al editor
						</a>
						<button
							onClick={handleImportClick}
							className="text-df-ink dark:text-df-ink-dark cursor-pointer rounded-full border px-5 py-2.5 text-sm font-semibold shadow-sm transition-opacity hover:opacity-70"
						>
							Importar JSON
						</button>
					</div>
				</div>
			) : (
				/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Tailwind resetea list-style; el rol explícito evita que Safari/VoiceOver pierda la semántica de lista. */
				<ul
					role="list"
					className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
				>
					{boards.map((board) => (
						<BoardCard key={board.id} board={board} onNotify={showToast} />
					))}
				</ul>
			)}

			<Toast message={toastMessage} />
		</section>
	);
}
