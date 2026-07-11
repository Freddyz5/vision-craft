"use client";
import { type CanvasConfig } from "../../../shared/store/canvasStore";
import type { WritableAtom } from "nanostores";
import { mmToInch, mmToPx } from "../constants/presets";
import type { DimensionUnit } from "../types";
import { PRESETS } from "../constants/presets";
import ImagesBadge from "./ImagesBadge";
import { useState } from "react";
import { buildDefaultName } from "../utils/buildDefaultName";
import { Sparkles, ArrowRight } from "lucide-react";

interface Props {
	config: CanvasConfig;
	unit: DimensionUnit;
	setConfig: React.Dispatch<React.SetStateAction<CanvasConfig>>;
	activeCanvasConfigStore: WritableAtom<CanvasConfig>;
}

const InfoTile = ({ label, value }: { label: string; value: string }) => {
	return (
		<article className="bg-df-surface dark:bg-df-surface-dark rounded-xl border border-gray-200/50 p-3 dark:border-gray-700/50">
			<p className="text-df-muted dark:text-df-muted-dark text-[9px] font-bold tracking-[0.15em] uppercase">
				{label}
			</p>
			<p className="text-df-ink dark:text-df-ink-dark mt-1 truncate text-xs leading-tight font-bold">
				{value}
			</p>
		</article>
	);
};

export default function CanvasLivePreview({
	config,
	unit,
	setConfig,
	activeCanvasConfigStore,
}: Props) {
	const [nameError, setNameError] = useState("");

	// ── Proportional preview box ──────────────────────────────────────────────
	// Fit inside a 200×260 px container
	const maxW = 200;
	const maxH = 260;
	const ratio = config.widthMm / config.heightMm;

	let previewW: number;
	let previewH: number;
	if (ratio >= maxW / maxH) {
		previewW = maxW;
		previewH = Math.round(maxW / ratio);
	} else {
		previewH = maxH;
		previewW = Math.round(maxH * ratio);
	}

	const presetLabel = PRESETS.find((p) => p.id === config.presetId)?.label ?? "Personalizado";

	const fmt = (mm: number, unit: DimensionUnit): string => {
		if (unit === "px") return `${mmToPx(mm)} px`;
		if (unit === "in") return `${mmToInch(mm).toFixed(1)} in`;
		return `${Math.round(mm * 10) / 10} mm`;
	};

	const handleGoToEditor = () => {
		if (!config.name.trim()) {
			setNameError("Dale un nombre a tu lienzo");
			return;
		}
		setNameError("");
		activeCanvasConfigStore.set(config);
		window.location.href = "/design";
	};

	return (
		<aside
			className="border-df-primary/30 w-full shrink-0 space-y-4 rounded-3xl border-2 bg-gray-100 p-5 lg:sticky lg:top-24 lg:-mt-75 lg:w-96 dark:bg-[#161f30]"
			aria-label="Vista previa del lienzo"
		>
			{/* Label */}
			<p className="text-df-muted dark:text-df-muted-dark text-center text-[9px] font-bold tracking-[0.22em] uppercase">
				Vista previa
			</p>

			{/* Canvas proportional mockup */}
			<section className="flex items-center justify-center" style={{ minHeight: maxH + 32 }}>
				<article
					className="border-df-primary/30 dark:border-df-primary-dark/30 relative flex flex-col items-center justify-center overflow-hidden rounded-xl border-2 bg-white shadow-lg transition-all duration-300 ease-in-out dark:bg-gray-800"
					style={{ width: previewW, height: previewH }}
					aria-label={`Vista previa: ${fmt(config.widthMm, unit)} × ${fmt(config.heightMm, unit)}`}
				>
					{/* Grid lines overlay */}
					<div
						className="absolute inset-0 opacity-[0.06]"
						style={{
							backgroundImage:
								"repeating-linear-gradient(0deg, #6c63ff 0, #6c63ff 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #6c63ff 0, #6c63ff 1px, transparent 1px, transparent 20px)",
						}}
					/>
					{/* Center icon */}
					<Sparkles
						className="text-df-primary/40 dark:text-df-primary-dark/40 mb-1.5 h-6 w-6"
						strokeWidth={1.5}
						aria-hidden="true"
					/>
					<p className="text-df-primary/50 dark:text-df-primary-dark/50 px-2 text-center text-[9px] font-semibold tracking-widest uppercase">
						Tu lienzo
					</p>
				</article>
			</section>

			{/* Info tiles */}
			<article className="grid grid-cols-2 gap-2">
				<InfoTile label="Ancho" value={fmt(config.widthMm, unit)} />
				<InfoTile label="Alto" value={fmt(config.heightMm, unit)} />
				<InfoTile label="Formato" value={presetLabel} />
				<InfoTile
					label="Orientación"
					value={config.orientation === "portrait" ? "Portrait" : "Landscape"}
				/>
			</article>

			{/* Images badge */}
			<ImagesBadge />

			<section aria-labelledby="name-heading">
				<h2
					id="name-heading"
					className="text-df-muted dark:text-df-muted-dark mb-3 text-[10px] font-bold tracking-[0.2em] uppercase"
				>
					Nombre del lienzo
				</h2>
				<input
					id="canvas-name"
					type="text"
					value={config.name}
					onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
					placeholder={buildDefaultName()}
					className="text-df-ink dark:text-df-ink-dark focus:border-df-primary dark:focus:border-df-primary-dark w-full border-b-2 border-gray-200 bg-transparent py-1.5 text-xl font-semibold transition-colors duration-150 outline-none placeholder:text-gray-300 dark:border-gray-700 dark:placeholder:text-gray-600"
				/>
				{nameError && <p className="mt-1.5 text-xs font-medium text-red-500">{nameError}</p>}
			</section>

			<button
				id="go-to-editor-btn"
				type="button"
				onClick={handleGoToEditor}
				className="from-df-primary to-df-accent dark:from-df-primary-dark dark:to-df-accent-dark shadow-df-primary/30 dark:shadow-df-primary-dark/20 inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r px-8 py-2.5 text-base font-bold text-white shadow-md transition-all duration-150 hover:opacity-90 active:scale-95"
			>
				Ir al Editor
				<ArrowRight className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
			</button>
		</aside>
	);
}
