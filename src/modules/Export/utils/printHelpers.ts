import type { CanvasConfig, CanvasItem } from '../../../shared/store/canvasStore';
import type { PrintConfig } from '../types';
import { MM_TO_PX } from '../../Canvas/constants/presets';

// Items in the store are positioned in "logical Stage pixels" on a 96dpi
// basis (see CanvasItem doc-comment in canvasStore.ts). To render reliably
// across browsers/printers we convert everything to mm ONCE here and emit
// only mm-based CSS — never px — inside the printable HTML. px↔mm rounding
// and DPI assumptions are what caused Bug 2 (wrong-sized / shifted prints).
const PX_TO_MM = 1 / MM_TO_PX;

function pxToMm(px: number): number {
    return px * PX_TO_MM;
}

function escapeHtml(text: string): string {
    return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function escapeAttr(text: string): string {
    return escapeHtml(text).replaceAll('`', '&#096;');
}

function getCanvasHtml(
    config: CanvasConfig,
    items: CanvasItem[],
    offsetXMm = 0,
    offsetYMm = 0,
    scale = 1,
): string {
    const widthMm = config.widthMm * scale;
    const heightMm = config.heightMm * scale;
    
    // Sort items by zIndex ascending so the highest zIndex is rendered last
    const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

    const itemsHtml = sortedItems.map((item) => {
        const xMm = pxToMm(item.x) * scale;
        const yMm = pxToMm(item.y) * scale;
        const wMm = pxToMm(item.width) * scale;
        const hMm = pxToMm(item.height) * scale;

        if (item.type === 'text' || (!!item.text && !item.imageSrc)) {
            const text = escapeHtml(item.text ?? '');
            const fontSizeMm = pxToMm(item.fontSize ?? 24) * scale;
            const fillColor = escapeAttr(item.fillColor ?? '#111827');
            const fontFamily = escapeAttr(item.fontFamily ?? 'Inter');
            const fontStyle = escapeAttr(item.fontStyle ?? 'normal');
            return `
                <div
                    style="
                        position: absolute;
                        left: ${xMm}mm;
                        top: ${yMm}mm;
                        width: ${wMm}mm;
                        height: ${hMm}mm;
                        transform: rotate(${item.rotation}deg);
                        transform-origin: center center;
                        font-size: ${fontSizeMm}mm;
                        font-family: ${fontFamily};
                        font-style: ${fontStyle};
                        color: ${fillColor};
                        white-space: pre-wrap;
                        line-height: 1.1;
                    "
                >${text}</div>
            `;
        }

        if (!item.imageSrc) return '';

        const src = escapeAttr(item.imageSrc);
        const alt = escapeAttr(item.alt ?? '');
        return `
            <img
                src="${src}"
                alt="${alt}"
                style="
                    position: absolute;
                    left: ${xMm}mm;
                    top: ${yMm}mm;
                    width: ${wMm}mm;
                    height: ${hMm}mm;
                    transform: rotate(${item.rotation}deg);
                    transform-origin: center center;
                    object-fit: contain;
                "
            />
        `;
    }).join('');

    return `
        <div style="
            position: absolute;
            left: ${-offsetXMm}mm;
            top: ${-offsetYMm}mm;
            width: ${widthMm}mm;
            height: ${heightMm}mm;
            background-color: white;
            overflow: hidden;
            pointer-events: none;
        ">
            ${itemsHtml}
        </div>
    `;
}

export type DirectPrintMode = 'trueSize' | 'fitToPaper';
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

export function buildDirectPrintHtml(
    config: CanvasConfig,
    items: CanvasItem[],
    options: DirectPrintRenderOptions = {},
): string {
    const mode: DirectPrintMode = options.mode ?? 'trueSize';
    const htmlCanvas = getCanvasHtml(config, items, 0, 0, 1);

    const canvasWidthMm = config.widthMm;
    const canvasHeightMm = config.heightMm;

    const paperWidthMm = options.paperWidthMm ?? config.widthMm;
    const paperHeightMm = options.paperHeightMm ?? config.heightMm;

    // fitToPaper scales the whole canvas down (never up) to fit a single sheet.
    const scale = mode === 'fitToPaper'
        ? Math.min(paperWidthMm / canvasWidthMm, paperHeightMm / canvasHeightMm, 1)
        : 1;

    const autoPrint = options.autoPrint ?? false;
    const closeAfterPrint = options.closeAfterPrint ?? false;

    const script = `
        ${buildWaitForAssetsFunctionScript()}
        window.addEventListener('load', () => {
            if (!${autoPrint ? 'true' : 'false'}) return;
            Promise.resolve()
                .then(() => window.__waitForAssets?.())
                .then(() => {
                    try { window.focus(); } catch {}
                    try { window.print(); } catch {}
                });
        });
        window.addEventListener('afterprint', () => {
            if (!${closeAfterPrint ? 'true' : 'false'}) return;
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

export interface TiledPrintRenderOptions extends PrintBehaviorOptions {}

export function buildTiledPrintHtml(
    config: CanvasConfig,
    items: CanvasItem[],
    printConfig: PrintConfig,
    options: TiledPrintRenderOptions = {},
): string {
    let pagesHtml = '';

    const paperWidthMm = printConfig.paperWidthMm;
    const paperHeightMm = printConfig.paperHeightMm;
    const canvasScale = printConfig.canvasScale ?? 1;

    // Only used for the on-screen preview viewport-fit math (JS reads
    // window.innerWidth in px). Never used for the actual @page sizing.
    const paperWidthPx = paperWidthMm * MM_TO_PX;
    const paperHeightPx = paperHeightMm * MM_TO_PX;

    printConfig.tiles.forEach((tile, index) => {
        const pageInner = `
            <div class="page" style="
                width: ${paperWidthMm}mm; 
                height: ${paperHeightMm}mm; 
                overflow: hidden; 
                position: relative;
                background: white;
            ">
                ${getCanvasHtml(config, items, tile.offsetXMm, tile.offsetYMm, canvasScale)}
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
            if (!${autoPrint ? 'true' : 'false'}) return;
            Promise.resolve()
                .then(() => window.__waitForAssets?.())
                .then(() => {
                    try { window.focus(); } catch {}
                    try { window.print(); } catch {}
                });
        });
        window.addEventListener('afterprint', () => {
            if (!${closeAfterPrint ? 'true' : 'false'}) return;
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
        : '';

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

                    ${isPreview ? `
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
                    ` : ''}
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
        return window.open('', '_blank', 'popup=yes');
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

export function createDirectPrintIframe(
    config: CanvasConfig,
    items: CanvasItem[],
    options: DirectPrintOptions = {},
) : boolean {
    const html = buildDirectPrintHtml(config, items, {
        ...options,
        autoPrint: true,
        closeAfterPrint: true,
    });

    const printWindow = tryOpenPrintWindow();
    if (printWindow) {
        writeHtmlToWindow(printWindow, html);
        return true;
    }

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
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

export function createTiledPrintIframe(config: CanvasConfig, items: CanvasItem[], printConfig: PrintConfig): boolean {
    const html = buildTiledPrintHtml(config, items, printConfig, {
        autoPrint: true,
        closeAfterPrint: true,
    });

    const printWindow = tryOpenPrintWindow();
    if (printWindow) {
        writeHtmlToWindow(printWindow, html);
        return true;
    }

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
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
