import { Theme, argbFromHex, themeFromImage, themeFromSourceColor, applyTheme } from "@material/material-color-utilities";
import ColorThief, { RGBColor } from 'colorthief';
import { Component } from "react";

interface ThemeSwitcherState {
	theme: Theme | null;
	themeMode: "light" | "dark";
	themeRawColorData: Theme | undefined;
}

export class AccentUtil extends Component<undefined, ThemeSwitcherState> {
	constructor() {
		super(null);
		this.state = {
			theme: null,
			themeMode: "light",
			themeRawColorData: undefined
		};
	}

	public setThemeMode(mode: "light" | "dark") {
		this.setState({ themeMode: mode });
		console.warn("SETTING THEME", this.state.theme);
		applyTheme(
			this.state.theme,
			{
				target: document.body,
				dark: this.state.themeMode === "light" ? false : true
			}
		);
	}

	/**
	 * Converts ARGB color value to RGB
	 * 
	 * Reference: https://stackoverflow.com/questions/12579598/how-can-i-convert-argb-to-hex-in-javascript
	 * @param color ARGB color
	 * @returns Hex value
	 */
	argbToRgb(color: number) {
		return '#' + ('000000' + (color & 0xFFFFFF).toString(16)).slice(-6);
	}

	rgbToHex(rgb: RGBColor): string {
		const [r, g, b] = rgb.map((color: number) => Math.round(color).toString(16).padStart(2, '0'));
		return `#${r}${g}${b}`;
	}

	setThemeRawColorData(theme: Theme) {
		this.setState({ themeRawColorData: theme });
	}

	getColorFromImage(imgElement: HTMLImageElement): Promise<RGBColor> {
		if (imgElement.complete) {
			// If the image is already loaded, directly get the color.
			const colorThief = new ColorThief();
			const color: RGBColor = colorThief.getColor(imgElement, 100);
			return Promise.resolve(color);
		} else {
			// If the image is not loaded yet, wait for the 'onload' event to get the color.
			return new Promise((resolve, reject) => {
				imgElement.onload = () => {
					const colorThief = new ColorThief();
					const color: RGBColor = colorThief.getColor(imgElement, 100);
					resolve(color);
				};

				imgElement.onerror = () => {
					// If there is an error loading the image or getting the color, reject the promise.
					reject(new Error('Failed to load the image or get the color.'));
				};
			});
		}
	}

	setMetaTagColor() {
		const metaThemeColor = document.querySelector('meta[name="theme-color"]');

		if (metaThemeColor && this.state.themeRawColorData?.schemes[this.state.themeMode].primaryContainer) {
			metaThemeColor.setAttribute('content', this.argbToRgb(
				this.state.themeRawColorData?.schemes[this.state.themeMode].primaryContainer
			));
		}
	}

	async setThemeFromM3(parentElement?: Element | HTMLElement) {
		const theme = await this.setM3ColorAndTarget(
			null,
			document.body,
			parentElement
		);
		if (theme) {
			this.setState({ themeRawColorData: theme });
			this.setThemeRawColorData(theme);
			this.setMetaTagColor();
		}
	}

	async setM3ColorAndTarget(
		parentOfImg: string | null,
		target: string | HTMLElement,
		elementClass: Element | HTMLElement | null
	) {
		console.warn("XXXXX");
		let theme: Theme | null = null;
		const parentElement = document.getElementById(parentOfImg);
		const colorThief = new ColorThief();
		const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		this.setState({ themeMode: systemDark ? 'dark' : 'light' });

		if (parentElement) {
			const imgElement = parentElement.querySelector("img");
			let color = "";

			if (imgElement) {
				color = this.rgbToHex(await this.getColorFromImage(imgElement));
				theme = themeFromSourceColor(argbFromHex(color));
				// theme = await themeFromImage(imgElement as HTMLImageElement);
			} else {
				console.error("No <img> element found within the parent element.");
				theme = themeFromSourceColor(argbFromHex("#b0b2bd"));
			}
		} else if (elementClass && elementClass !== null) {
			const imgElement = elementClass.querySelector("img");
			let color = "";

			if (imgElement) {
				imgElement.crossOrigin = "anonymous";
				color = this.rgbToHex(await this.getColorFromImage(imgElement));
				theme = themeFromSourceColor(argbFromHex(color));
			} else {
				console.error("No <img> element found within the parent element.");
				theme = themeFromSourceColor(argbFromHex("#b0b2bd"));
			}
		} else {
			console.error("Parent element with ID '" + parentOfImg + "' not found.");
			theme = themeFromSourceColor(argbFromHex("#b0b2bd"));
		}

		this.setState({ theme });
		console.warn("asaaa", this.state.theme);

		if (theme) {
			applyTheme(
				theme,
				{
					target: typeof target === "string" ? document.getElementById(target) as HTMLElement : target,
					dark: this.state.themeMode === "light" ? false : true
				}
			);
		}

		return theme;
	}
}