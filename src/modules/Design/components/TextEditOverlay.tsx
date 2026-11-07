import { useEffect, useRef } from "react";
import { TEXT_DEFAULTS, type CanvasItem } from "../../../shared/store/canvasStore";
import { fontStack } from "../../../shared/utils/fonts";

interface TextEditOverlayProps {
	item: CanvasItem;
	/** Stage px per logical px. */
	scale: number;
	onCommit: (text: string) => void;
	onCancel: () => void;
}

function fitToContent(textarea: HTMLTextAreaElement) {
	textarea.style.height = "auto";
	textarea.style.height = `${textarea.scrollHeight}px`;
}

/**
 * Edits a text item in place: a textarea laid exactly over the text on the
 * sheet (same box, font and rotation) while the Konva node is hidden.
 * Enter or clicking away keeps the change, Shift+Enter adds a line, Esc cancels.
 */
export function TextEditOverlay({ item, scale, onCommit, onCancel }: TextEditOverlayProps) {
	const ref = useRef<HTMLTextAreaElement>(null);
	const cancelled = useRef(false);

	useEffect(() => {
		if (!ref.current) return;
		ref.current.focus();
		ref.current.select();
		fitToContent(ref.current);
	}, []);

	return (
		<textarea
			ref={ref}
			defaultValue={item.text || ""}
			aria-label="Texto"
			// Grows with the text, so every line stays in view while typing.
			onInput={(e) => fitToContent(e.currentTarget)}
			onKeyDown={(e) => {
				if (e.key === "Enter" && !e.shiftKey) {
					e.preventDefault();
					ref.current?.blur();
				} else if (e.key === "Escape") {
					cancelled.current = true;
					onCancel();
				}
			}}
			onBlur={(e) => {
				if (!cancelled.current) onCommit(e.currentTarget.value);
			}}
			className="outline-df-primary absolute z-30 m-0 resize-none overflow-hidden border-0 bg-white/85 p-0 outline-2 outline-offset-2"
			style={{
				left: item.x * scale,
				top: item.y * scale,
				width: item.width * scale,
				minHeight: item.height * scale,
				transform: `rotate(${item.rotation}deg)`,
				transformOrigin: "0 0",
				fontSize: (item.fontSize || TEXT_DEFAULTS.fontSize) * scale,
				fontFamily: fontStack(item.fontFamily),
				textAlign: item.align || TEXT_DEFAULTS.align,
				fontStyle: item.fontStyle || TEXT_DEFAULTS.fontStyle,
				color: item.fillColor || TEXT_DEFAULTS.fillColor,
				lineHeight: TEXT_DEFAULTS.lineHeight,
			}}
		/>
	);
}
