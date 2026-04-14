import Compass from "../icons/Compass.astro";
import PlusCircle from "../icons/PlusCircle.astro";
import Blocks from "../icons/Blocks.astro";
import Archive from "../icons/Archive.astro";

export type Link = {
  id: string;
  name: string;
  href: string;
  icon?: any;
}

export const LINKS: Array<Link> = [
  {
    id: 'discover',
    name: 'Descubre',
    href: '/',
    icon: Compass
  },
  {
    id: 'create',
    name: 'Crea',
    href: '/canvas',
    icon: PlusCircle
  },
  {
    id: 'my-boards',
    name: 'Mis tableros',
    href: '/boards',
    icon: Blocks
  },
  {
    id: 'archive',
    name: 'Archivo',
    href: '/archive',
    icon: Archive
  }
];