import type React from "react";
import { useState } from "react";
import {
	ArrowRight,
	CircleCheck,
	Eye,
	EyeOff,
	ImageOff,
	Lock,
	LockOpen,
	RotateCw,
	Trash2,
	TriangleAlert,
	Type,
	X,
} from "lucide-react";
import { isTextItem, type CanvasItem } from "../../../shared/store/canvasStore";
import type { PrintListRow } from "../hooks/usePrintChecks";
import type { PrintWarningKind } from "../utils/printChecks";
import { PPI_GOOD } from "../utils/printChecks";

interface PrintListProps {
	rows: PrintListRow[];
	warningCount: number;
	selectedIds: string[];
	/** `additive`: Shift/Cmd/Ctrl+click adds the row to the selection (desktop). */
	onSelect: (id: string, additive: boolean) => void;
	onDismiss: (id: string, kind: PrintWarningKind) => void;
	onRetry: (item: CanvasItem) => void;
	onRemove: (id: string) => void;
	onToggleHidden: (id: string) => void;
	onToggleLock: (id: string) => void;
	/** New stacking order, every id front-most first (drag a row to reorder, desktop). */
	onReorder: (frontToBack: string[]) => void;
	onSave: () => void;
	onExport: () => void;
}

// Older boards stored these placeholders as the photo's description.
const GENERIC_ALTS = new Set(["Added Image", "Dropped Image", "Imagen desde enlace"]);

function rowName(item: CanvasItem): string {
	if (isTextItem(item)) return (item.text || "Texto").split("\n")[0];
	if (!item.alt || GENERIC_ALTS.has(item.alt)) return "Foto";
	return item.alt.charAt(0).toUpperCase() + item.alt.slice(1);
}

function rowDetail(row: PrintListRow): string {
	if (isTextItem(row.item)) {
		if (row.item.hidden) return "Oculto: no se imprime";
		return `${Math.round((row.item.fontSize || 24) * 0.75)} pt`;
	}
	if (row.item.hidden) return "Oculta: no se imprime";
	if (row.ppi === null) return "Cargando…";
	return `${row.ppi >= PPI_GOOD ? "Nítida" : "Aceptable"} · ${row.ppi} ppp`;
}

/**
 * The editor's right column: every item on the sheet as a row (front-most
 * first) with what would go wrong printing it, ending in the way out to
 * Export. It never blocks exporting; warnings only point at what to check.
 */
export function PrintList({
	rows,
	warningCount,
	selectedIds,
	onSelect,
	onDismiss,
	onRetry,
	onRemove,
	onToggleHidden,
	onToggleLock,
	onReorder,
	onSave,
	onExport,
}: PrintListProps) {
	// Row being dragged, and where it would land: before or after another row.
	const [dragId, setDragId] = useState<string | null>(null);
	const [dropAt, setDropAt] = useState<{ id: string; after: boolean } | null>(null);

	const dropRow = () => {
		if (dragId && dropAt && dragId !== dropAt.id) {
			const order = rows.map((r) => r.item.id).filter((id) => id !== dragId);
			const index = order.indexOf(dropAt.id) + (dropAt.after ? 1 : 0);
			order.splice(index, 0, dragId);
			onReorder(order);
		}
		setDragId(null);
		setDropAt(null);
	};

	const ready = rows.length > 0 && warningCount === 0;

	return (
		<section aria-labelledby="print-list-title" className="flex h-full min-h-0 flex-col">
			<header className="px-4 pt-4 pb-3">
				<h2 id="print-list-title" className="text-df-ink dark:text-df-ink-dark text-sm font-bold">
					Lista de impresión
				</h2>
				<p
					role="status"
					className={[
						"mt-1 flex items-center gap-1.5 text-xs font-semibold",
						warningCount > 0
							? "text-df-warning dark:text-df-warning-dark"
							: "text-df-muted dark:text-df-muted-dark",
					].join(" ")}
				>
					{warningCount > 0 ? (
						<>
							<TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
							{warningCount === 1 ? "1 aviso" : `${warningCount} avisos`}
						</>
					) : ready ? (
						<>
							<CircleCheck
								className="text-df-primary dark:text-df-primary-dark h-3.5 w-3.5"
								aria-hidden="true"
							/>
							Lista para imprimir
						</>
					) : (
						"Tu tablero está vacío"
					)}
				</p>
			</header>

			{/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- Tailwind resetea list-style; el rol explícito evita que Safari/VoiceOver pierda la semántica de lista. */}
			<ol role="list" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
				{rows.map((row) => {
					const { item } = row;
					const selected = selectedIds.includes(item.id);
					const warning = row.warnings[0];
					return (
						<li
							key={item.id}
							draggable
							onDragStart={(e) => {
								setDragId(item.id);
								e.dataTransfer.effectAllowed = "move";
							}}
							onDragOver={(e) => {
								if (!dragId) return;
								e.preventDefault();
								const box = e.currentTarget.getBoundingClientRect();
								setDropAt({ id: item.id, after: e.clientY > box.top + box.height / 2 });
							}}
							onDrop={(e) => {
								e.preventDefault();
								dropRow();
							}}
							onDragEnd={() => {
								setDragId(null);
								setDropAt(null);
							}}
							className={[
								"group relative flex items-center gap-1 rounded-xl pr-1 transition-colors duration-150",
								selected
									? "bg-df-primary/10 dark:bg-df-primary-dark/15"
									: "hover:bg-df-well dark:hover:bg-df-well-dark",
								dragId === item.id ? "opacity-50" : "",
								item.hidden ? "[&_img]:opacity-40" : "",
							].join(" ")}
						>
							{dropAt?.id === item.id && dragId !== item.id && (
								<span
									aria-hidden="true"
									className={`bg-df-primary dark:bg-df-primary-dark pointer-events-none absolute inset-x-2 h-0.5 rounded-full ${dropAt.after ? "-bottom-0.5" : "-top-0.5"}`}
								/>
							)}
							<button
								type="button"
								onClick={(e) => onSelect(item.id, e.shiftKey || e.metaKey || e.ctrlKey)}
								aria-current={selected ? "true" : undefined}
								className="focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left focus-visible:outline-2"
							>
								<span
									className={[
										"bg-df-well dark:bg-df-well-dark flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg",
										warning ? "ring-df-warning dark:ring-df-warning-dark ring-2" : "",
									].join(" ")}
								>
									{isTextItem(item) ? (
										<Type
											className="text-df-muted dark:text-df-muted-dark h-4 w-4"
											aria-hidden="true"
										/>
									) : warning?.kind === "load-error" ? (
										<ImageOff
											className="text-df-warning dark:text-df-warning-dark h-4 w-4"
											aria-hidden="true"
										/>
									) : (
										<img src={item.imageSrc} alt="" className="h-full w-full object-cover" />
									)}
								</span>
								<span className="min-w-0 flex-1">
									<span className="text-df-ink dark:text-df-ink-dark block truncate text-sm font-semibold">
										{rowName(item)}
									</span>
									<span
										className={[
											"flex items-center gap-1 truncate text-xs",
											warning
												? "text-df-warning dark:text-df-warning-dark font-semibold"
												: "text-df-muted dark:text-df-muted-dark",
										].join(" ")}
									>
										{warning && <TriangleAlert className="h-3 w-3 shrink-0" aria-hidden="true" />}
										{warning ? warning.message : rowDetail(row)}
										{row.warnings.length > 1 && ` (+${row.warnings.length - 1})`}
									</span>
								</span>
							</button>

							<RowAction
								label={
									item.locked ? `Desbloquear «${rowName(item)}»` : `Bloquear «${rowName(item)}»`
								}
								onClick={() => onToggleLock(item.id)}
								pressed={!!item.locked}
							>
								{item.locked ? (
									<Lock className="h-3.5 w-3.5" aria-hidden="true" />
								) : (
									<LockOpen className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
								)}
							</RowAction>
							<RowAction
								label={item.hidden ? `Mostrar «${rowName(item)}»` : `Ocultar «${rowName(item)}»`}
								onClick={() => onToggleHidden(item.id)}
								pressed={!!item.hidden}
							>
								{item.hidden ? (
									<EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
								) : (
									<Eye className="h-3.5 w-3.5" aria-hidden="true" />
								)}
							</RowAction>

							{warning?.kind === "load-error" ? (
								<>
									<RowAction label="Reintentar la carga" onClick={() => onRetry(item)}>
										<RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
									</RowAction>
									<RowAction label="Quitar del tablero" onClick={() => onRemove(item.id)}>
										<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
									</RowAction>
								</>
							) : (
								warning && (
									<RowAction
										label={`Descartar el aviso «${warning.message}»`}
										onClick={() => onDismiss(item.id, warning.kind)}
									>
										<X className="h-3.5 w-3.5" aria-hidden="true" />
									</RowAction>
								)
							)}
						</li>
					);
				})}
			</ol>

			<footer className="border-df-hairline dark:border-df-hairline-dark space-y-2 border-t p-4">
				{warningCount > 0 && (
					<p className="text-df-warning dark:text-df-warning-dark text-center text-xs font-semibold">
						{warningCount === 1 ? "1 aviso sin revisar" : `${warningCount} avisos sin revisar`}
					</p>
				)}
				<div className="flex flex-col gap-2">
					<button
						type="button"
						onClick={onSave}
						disabled={rows.length === 0}
						className="border-df-hairline dark:border-df-hairline-dark text-df-ink dark:text-df-ink-dark hover:bg-df-well dark:hover:bg-df-well-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark rounded-full border px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Guardar en Tableros
					</button>
					<button
						type="button"
						onClick={onExport}
						className="from-df-primary to-df-accent dark:from-df-primary-dark dark:to-df-accent-dark shadow-df-primary/30 dark:shadow-df-primary-dark/20 dark:text-df-on-primary-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r px-3 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
					>
						Exportar
						<ArrowRight className="h-4 w-4" aria-hidden="true" />
					</button>
				</div>
			</footer>
		</section>
	);
}

function RowAction({
	label,
	onClick,
	pressed,
	children,
}: {
	label: string;
	onClick: () => void;
	pressed?: boolean;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={label}
			aria-pressed={pressed}
			title={label}
			className="text-df-muted dark:text-df-muted-dark hover:text-df-ink dark:hover:text-df-ink-dark hover:bg-df-surface dark:hover:bg-df-surface-dark focus-visible:outline-df-primary dark:focus-visible:outline-df-primary-dark flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 md:h-8 md:w-8"
		>
			{children}
		</button>
	);
}
