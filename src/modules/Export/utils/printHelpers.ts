import type { CanvasConfig, CanvasItem } from '../../../shared/store/canvasStore';
import type { PrintConfig } from '../types';
import { MM_TO_PX } from '../../Canvas/constants/presets';

function getCanvasHtml(config: CanvasConfig, items: CanvasItem[], offsetX = 0, offsetY = 0): string {
    const logicalWidth = config.widthMm * MM_TO_PX;
    const logicalHeight = config.heightMm * MM_TO_PX;
    
    // Sort items by zIndex ascending so the highest zIndex is rendered last
    const sortedItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

    const itemsHtml = sortedItems.map(item => `
        <img 
            src="${item.imageSrc}" 
            style="
                position: absolute;
                left: ${item.x}px;
                top: ${item.y}px;
                width: ${item.width}px;
                height: ${item.height}px;
                transform: rotate(${item.rotation}deg);
                transform-origin: center center;
                object-fit: contain;
            " 
        />
    `).join('');

    return `
        <div style="
            position: absolute;
            left: ${-offsetX}px;
            top: ${-offsetY}px;
            width: ${logicalWidth}px;
            height: ${logicalHeight}px;
            background-color: white;
            overflow: hidden;
            pointer-events: none;
        ">
            ${itemsHtml}
        </div>
    `;
}

export function createDirectPrintIframe(config: CanvasConfig, items: CanvasItem[]) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const htmlCanvas = getCanvasHtml(config, items);
    
    iframe.contentWindow?.document.write(`
        <html>
            <head>
                <style>
                    @media print {
                        @page { margin: 0; size: ${config.widthMm}mm ${config.heightMm}mm; }
                        body { margin: 0; background: white; -webkit-print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                ${htmlCanvas}
                <script>
                    window.onload = () => {
                        // Allow images to load properly before triggering print dialog
                        setTimeout(() => {
                            window.print();
                            // Wait a short delay before removing iframe if print dialogue closes
                            setTimeout(() => {
                                if (window.frameElement && window.frameElement.parentNode) {
                                    window.frameElement.parentNode.removeChild(window.frameElement);
                                }
                            }, 500);
                        }, 800);
                    };
                </script>
            </body>
        </html>
    `);
    iframe.contentWindow?.document.close();
}

export function createTiledPrintIframe(config: CanvasConfig, items: CanvasItem[], printConfig: PrintConfig) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    let pagesHtml = '';
    
    const paperWidthPx = printConfig.paperWidthMm * MM_TO_PX;
    const paperHeightPx = printConfig.paperHeightMm * MM_TO_PX;
    
    printConfig.tiles.forEach(tile => {
        const offsetXPx = tile.offsetXMm * MM_TO_PX;
        const offsetYPx = tile.offsetYMm * MM_TO_PX;
        
        pagesHtml += `
            <div class="page" style="
                width: ${paperWidthPx}px; 
                height: ${paperHeightPx}px; 
                overflow: hidden; 
                position: relative;
            ">
                ${getCanvasHtml(config, items, offsetXPx, offsetYPx)}
            </div>
        `;
    });
    
    iframe.contentWindow?.document.write(`
        <html>
            <head>
                <style>
                    @page { 
                        size: ${printConfig.paperWidthMm}mm ${printConfig.paperHeightMm}mm; 
                        margin: 0; 
                    }
                    body { 
                        margin: 0; 
                        background: white;
                        -webkit-print-color-adjust: exact;
                    }
                    .page {
                        page-break-after: always;
                    }
                    @media print {
                        .page:last-child {
                            page-break-after: auto;
                        }
                    }
                </style>
            </head>
            <body>
                ${pagesHtml}
                <script>
                    window.onload = () => {
                        setTimeout(() => {
                            window.print();
                            setTimeout(() => {
                                if (window.frameElement && window.frameElement.parentNode) {
                                    window.frameElement.parentNode.removeChild(window.frameElement);
                                }
                            }, 500);
                        }, 1200);
                    };
                </script>
            </body>
        </html>
    `);
    iframe.contentWindow?.document.close();
}
