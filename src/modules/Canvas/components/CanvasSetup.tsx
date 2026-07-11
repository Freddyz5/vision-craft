"use client";
import { useState } from "react";
import { useStore } from "@nanostores/react";
import { activeCanvasConfigStore, type CanvasConfig } from "../../../shared/store/canvasStore";
import { PRESETS } from "../constants/presets";
import type { DimensionUnit } from "../types";
import CustomDimensions from "./CustomDimensions";
import CanvasLivePreview from "./CanvasLivePreview";
import { buildDefaultName } from "../utils/buildDefaultName";
import PresetCard from "./PresetCard";

export default function CanvasSetup() {
	const savedConfig = useStore(activeCanvasConfigStore);

	// Local form state (mirrors the store, only committed on "Ir al Editor")
	const [config, setConfig] = useState<CanvasConfig>(() => ({
		...savedConfig,
		name: savedConfig.name || buildDefaultName(),
	}));
	const [unit, setUnit] = useState<DimensionUnit>("mm");

	// Keep in sync if another tab changes the store. Adjusted during render
	// instead of in an effect to avoid setState-in-effect cascading renders
	// (react-hooks/set-state-in-effect); same pattern as ImagesGallery.tsx.
	const [prevSavedConfig, setPrevSavedConfig] = useState(savedConfig);
	if (savedConfig !== prevSavedConfig) {
		setPrevSavedConfig(savedConfig);
		setConfig((prev) => ({ ...prev, ...savedConfig }));
	}

	// ── handlers ───────────────────────────────────────────────────────────────
	function handlePresetSelect(presetId: string) {
		const preset = PRESETS.find((p) => p.id === presetId);
		if (!preset) return;
		setConfig((prev) => ({
			...prev,
			presetId: preset.id,
			widthMm: preset.widthMm,
			heightMm: preset.heightMm,
			orientation: preset.widthMm >= preset.heightMm ? "landscape" : "portrait",
		}));
	}

	const handleDimChange = (widthMm: number, heightMm: number) => {
		setConfig((prev) => ({
			...prev,
			presetId: "custom",
			widthMm,
			heightMm,
			orientation: widthMm >= heightMm ? "landscape" : "portrait",
		}));
	};

	const handleOrientationToggle = () => {
		setConfig((prev) => ({
			...prev,
			widthMm: prev.heightMm,
			heightMm: prev.widthMm,
			orientation: prev.orientation === "portrait" ? "landscape" : "portrait",
		}));
	};

	return (
		<section className="flex flex-1 flex-col gap-8 px-4 pb-10 sm:px-8 lg:flex-row lg:items-start">
			{/* ════ LEFT: config form ════ */}
			<div className="min-w-0 flex-1 space-y-8">
				{/* Preset grid */}
				<article aria-labelledby="presets-heading">
					<h2
						id="presets-heading"
						className="text-df-muted dark:text-df-muted-dark mb-4 text-[10px] font-bold tracking-[0.2em] uppercase"
					>
						Tamaños estándar
					</h2>
					<div className="grid grid-cols-3 gap-3">
						{PRESETS.map((preset) => (
							<PresetCard
								key={preset.id}
								preset={preset}
								isSelected={config.presetId === preset.id}
								onSelect={handlePresetSelect}
							/>
						))}
					</div>
				</article>

				{/* Custom dimensions */}
				<CustomDimensions
					config={config}
					unit={unit}
					onUnitChange={setUnit}
					onDimChange={handleDimChange}
					onOrientationToggle={handleOrientationToggle}
				/>
			</div>

			{/* ════ RIGHT: live preview ════ */}
			<CanvasLivePreview
				config={config}
				setConfig={setConfig}
				activeCanvasConfigStore={activeCanvasConfigStore}
				unit={unit}
			/>
		</section>
	);
}
