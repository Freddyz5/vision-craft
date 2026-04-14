import { getPexelsImg } from '../services/pexels';
import { getUnsplashImg } from '../services/unsplash';

export const providers = [
	{
		label: "Unsplash",
		value: "unsplash",
		getImages: getUnsplashImg,
	},
	{
		label: "Pexels",
		value: "pexels",
		getImages: getPexelsImg,
	},
];
