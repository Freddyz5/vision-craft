import type { AstroComponentFactory } from "astro/runtime/server/index.js";
import Compass from "../icons/Compass.astro";
import Proportions from "../icons/Proportions.astro";
import Wallpaper from "../icons/Wallpaper.astro";
import ImageDown from "../icons/ImageDown.astro";

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
