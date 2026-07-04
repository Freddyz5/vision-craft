import type { AstroComponentFactory } from "astro/runtime/server/index.js";
import { Compass, Proportions, Wallpaper, ImageDown } from "lucide-astro";

export type Link = {
	id: string;
	name: string;
	href: string;
	icon?: AstroComponentFactory;
};

export const LINKS: Array<Link> = [
	{
		id: "explore",
		name: "Explora",
		href: "/explore",
		icon: Compass,
	},
	{
		id: "canvas",
		name: "Lienzo",
		href: "/canvas",
		icon: Proportions,
	},
	{
		id: "design",
		name: "Diseña",
		href: "/design",
		icon: Wallpaper,
	},
	{
		id: "export",
		name: "Exporta",
		href: "/export",
		icon: ImageDown,
	},
];
