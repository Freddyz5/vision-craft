import type { CanvasConfig } from "../../../shared/store/canvasStore";
import type { PrintConfig } from "../types";
import { MM_TO_PX } from "../../Canvas/constants/presets";

// Each printed page is an image captured from the Export stage, which draws
// items with the same CanvasItemShape as the editor: crops, shapes and every
// later property print exactly as designed instead of being re-created in
// CSS. Page and image sizes are emitted in mm only — never px — because px↔mm
// rounding and DPI assumptions are what caused wrong-sized / shifted prints.

function escapeAttr(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

/** One captured page image, sized in mm. */
function pageImageHtml(src: string, widthMm: number, heightMm: number): string {
	return `<img src="${escapeAttr(src)}" alt="" style="display: block; width: ${widthMm}mm; height: ${heightMm}mm;" />`;
}

export type DirectPrintMode = "trueSize" | "fitToPaper";
export interface DirectPrintOptions {
	mode?: DirectPrintMode;
	paperWidthMm?: number;
	paperHeightMm?: number;
}

function buildWaitForAssetsScript(): string {
	return `
        (() => {
            const imgs = Array.from(document.images || []);
            const waitForImage = (img) => {
                if (!img) return Promise.resolve();
                if (img.complete && img.naturalWidth > 0) return Promise.resolve();
                if (typeof img.decode === 'function') {
                    return img.decode().catch(() => {});
                }
                return new Promise((resolve) => {
                    const done = () => resolve();
                    img.addEventListener('load', done, { once: true });
                    img.addEventListener('error', done, { once: true });
                });
            };
            return Promise.all(imgs.map(waitForImage));
        })()
    `;
}

function buildWaitForAssetsFunctionScript(): string {
	return `
        window.__waitForAssets = () => (${buildWaitForAssetsScript()});
    `;
}

export interface PrintBehaviorOptions {
	autoPrint?: boolean;
	closeAfterPrint?: boolean;
}

export interface DirectPrintRenderOptions extends DirectPrintOptions, PrintBehaviorOptions {}

/** `pageImage`: the whole canvas captured from the stage. */
export function buildDirectPrintHtml(
	pageImage: string,
	config: CanvasConfig,
	options: DirectPrintRenderOptions = {},
): string {
	const mode: DirectPrintMode = options.mode ?? "trueSize";
	const htmlCanvas = pageImageHtml(pageImage, config.widthMm, config.heightMm);

	const canvasWidthMm = config.widthMm;
	const canvasHeightMm = config.heightMm;

	const paperWidthMm = options.paperWidthMm ?? config.widthMm;
	const paperHeightMm = options.paperHeightMm ?? config.heightMm;

	// fitToPaper scales the whole canvas down (never up) to fit a single sheet.
	const scale =
		mode === "fitToPaper"
			? Math.min(paperWidthMm / canvasWidthMm, paperHeightMm / canvasHeightMm, 1)
			: 1;

	const autoPrint = options.autoPrint ?? false;
	const closeAfterPrint = options.closeAfterPrint ?? false;

	const script = `
        ${buildWaitForAssetsFunctionScript()}
        window.addEventListener('load', () => {
            if (!${autoPrint ? "true" : "false"}) return;
            Promise.resolve()
                .then(() => window.__waitForAssets?.())
                .then(() => {
                    try { window.focus(); } catch {}
                    try { window.print(); } catch {}
                });
        });
        window.addEventListener('afterprint', () => {
            if (!${closeAfterPrint ? "true" : "false"}) return;
            try { window.close(); } catch {}
            if (window.frameElement && window.frameElement.parentNode) {
                try { window.frameElement.parentNode.removeChild(window.frameElement); } catch {}
            }
        });
    `;

	return `
        <html>
            <head>
                <meta charset="utf-8" />
                <style>
                    * { box-sizing: border-box; }
                    html, body { width: 100%; height: 100%; }
                    @media print {
                        @page { margin: 0; size: ${paperWidthMm}mm ${paperHeightMm}mm; }
                        body { margin: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <div style="
                    position: relative;
                    width: ${paperWidthMm}mm;
                    height: ${paperHeightMm}mm;
                    overflow: hidden;
                    background: white;
                ">
                    <div style="
                        position: absolute;
                        left: 50%;
                        top: 50%;
                        width: ${canvasWidthMm}mm;
                        height: ${canvasHeightMm}mm;
                        transform: translate(-50%, -50%) scale(${scale});
                        transform-origin: center center;
                    ">
                        ${htmlCanvas}
                    </div>
                </div>
                <script>${script}</script>
            </body>
        </html>
    `;
}

export type TiledPrintRenderOptions = PrintBehaviorOptions;

/** `tileImages`: one capture per printConfig tile, in the same order. */
export function buildTiledPrintHtml(
	tileImages: string[],
	printConfig: PrintConfig,
	options: TiledPrintRenderOptions = {},
): string {
	let pagesHtml = "";

	const paperWidthMm = printConfig.paperWidthMm;
	const paperHeightMm = printConfig.paperHeightMm;

	// Only used for the on-screen preview viewport-fit math (JS reads
	// window.innerWidth in px). Never used for the actual @page sizing.
	const paperWidthPx = paperWidthMm * MM_TO_PX;
	const paperHeightPx = paperHeightMm * MM_TO_PX;

	printConfig.tiles.forEach((_tile, index) => {
		const pageInner = `
            <div class="page" style="
                width: ${paperWidthMm}mm; 
                height: ${paperHeightMm}mm; 
                overflow: hidden; 
                position: relative;
                background: white;
            ">
                ${pageImageHtml(tileImages[index], paperWidthMm, paperHeightMm)}
            </div>
        `;

		const isPreview = (options.autoPrint ?? false) === false;
		if (isPreview) {
			pagesHtml += `
                <section class="sheet">
                    <div class="sheet-label">Hoja ${index + 1} de ${printConfig.tiles.length} • ${printConfig.paperPresetId.toUpperCase()}</div>
                    ${pageInner}
                </section>
            `;
			return;
		}

		pagesHtml += pageInner;
	});

	const autoPrint = options.autoPrint ?? false;
	const closeAfterPrint = options.closeAfterPrint ?? false;
	const isPreview = autoPrint === false;

	const script = `
        ${buildWaitForAssetsFunctionScript()}
        window.addEventListener('load', () => {
            if (!${autoPrint ? "true" : "false"}) return;
            Promise.resolve()
                .then(() => window.__waitForAssets?.())
                .then(() => {
                    try { window.focus(); } catch {}
                    try { window.print(); } catch {}
                });
        });
        window.addEventListener('afterprint', () => {
            if (!${closeAfterPrint ? "true" : "false"}) return;
            try { window.close(); } catch {}
            if (window.frameElement && window.frameElement.parentNode) {
                try { window.frameElement.parentNode.removeChild(window.frameElement); } catch {}
            }
        });
    `;

	const previewScript = isPreview
		? `
            (function () {
                const paperW = ${paperWidthPx};
                const paperH = ${paperHeightPx};
                const pad = 32;
                const availableW = Math.max(320, window.innerWidth - pad * 2);
                const scale = Math.min(1, availableW / paperW);
                document.documentElement.style.setProperty('--preview-scale', String(scale));
                document.documentElement.style.setProperty('--paper-w', String(paperW));
                document.documentElement.style.setProperty('--paper-h', String(paperH));
            })();
            window.addEventListener('resize', () => {
                const paperW = ${paperWidthPx};
                const paperH = ${paperHeightPx};
                const pad = 32;
                const availableW = Math.max(320, window.innerWidth - pad * 2);
                const scale = Math.min(1, availableW / paperW);
                document.documentElement.style.setProperty('--preview-scale', String(scale));
                document.documentElement.style.setProperty('--paper-w', String(paperW));
                document.documentElement.style.setProperty('--paper-h', String(paperH));
            });
        `
		: "";

	return `
        <html>
            <head>
                <meta charset="utf-8" />
                <style>
                    * { box-sizing: border-box; }
                    @page { 
                        size: ${printConfig.paperWidthMm}mm ${printConfig.paperHeightMm}mm; 
                        margin: 0; 
                    }
                    body { 
                        margin: 0; 
                        background: white;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .page {
                        page-break-after: always;
                    }
                    @media print {
                        .page:last-child {
                            page-break-after: auto;
                        }
                    }

                    :root {
                        --preview-scale: 1;
                        --paper-w: ${paperWidthPx};
                        --paper-h: ${paperHeightPx};
                    }

                    ${
											isPreview
												? `
                        /* ── Screen-only preview styles ─────────────────────────────────────────
                           MUST be inside @media screen so they never bleed into printing.
                           Bug: transform:scale + page-break-after:auto were leaking into
                           the print stylesheet, causing shrunken tiles and missing page breaks.
                        ─────────────────────────────────────────────────────────────────────── */
                        @media screen {
                            body {
                                background: #f3f4f6;
                                padding: 24px;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                gap: 18px;
                            }

                            .sheet {
                                width: calc(var(--paper-w) * var(--preview-scale));
                                height: calc(var(--paper-h) * var(--preview-scale));
                                position: relative;
                                border-radius: 12px;
                                background: white;
                                box-shadow: 0 18px 60px rgba(0,0,0,0.22);
                                overflow: hidden;
                                border: 1px solid rgba(0,0,0,0.12);
                            }

                            .sheet-label {
                                position: absolute;
                                top: 12px;
                                left: 12px;
                                z-index: 2;
                                padding: 6px 10px;
                                border-radius: 999px;
                                background: rgba(17,24,39,0.85);
                                color: white;
                                font: 600 12px/1.1 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif;
                                letter-spacing: 0.02em;
                                backdrop-filter: blur(6px);
                            }

                            /* Scale page content to fit the viewport — screen preview only.        */
                            /* This transform must NEVER apply during printing (would shrink tiles). */
                            .sheet > .page {
                                position: absolute;
                                left: 0;
                                top: 0;
                                transform: scale(var(--preview-scale));
                                transform-origin: top left;
                                box-shadow: none;
                            }

                            /* Override page-break for scrollable screen preview only.              */
                            /* During print, the non-media-queried rule above applies instead:      */
                            /* .page { page-break-after: always; }                                  */
                            .page { page-break-after: auto; }
                        }

                        @media print {
                            /* Hide the screen-only badges from the printed output. */
                            .sheet-label { display: none; }
                            /* Make the .sheet wrapper transparent so .page elements  */
                            /* are logical children of body — page-break-after:always */
                            /* only works reliably when the breakable element is a    */
                            /* direct descendant of the block-formatting context.     */
                            .sheet { display: contents; }
                        }
                    `
												: ""
										}
                </style>
            </head>
            <body>
                ${pagesHtml}
                <script>${previewScript}${script}</script>
            </body>
        </html>
    `;
}

function tryOpenPrintWindow(): Window | null {
	try {
		return window.open("", "_blank", "popup=yes");
	} catch {
		return null;
	}
}

function writeHtmlToWindow(targetWindow: Window, html: string) {
	const doc = targetWindow.document;
	doc.open();
	doc.write(html);
	doc.close();
}

/**
 * Open `html` (built with autoPrint) in a print window, or in a hidden
 * iframe when pop-ups are blocked. False if neither could be created.
 */
export function printHtml(html: string): boolean {
	const printWindow = tryOpenPrintWindow();
	if (printWindow) {
		writeHtmlToWindow(printWindow, html);
		return true;
	}

	const iframe = document.createElement("iframe");
	iframe.style.display = "none";
	document.body.appendChild(iframe);

	const doc = iframe.contentDocument ?? iframe.contentWindow?.document ?? null;
	if (!doc) {
		if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
		return false;
	}

	doc.open();
	doc.write(html);
	doc.close();
	return true;
}
