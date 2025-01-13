import { Theme, argbFromHex, themeFromImage, themeFromSourceColor, applyTheme } from "@material/material-color-utilities";
// import ColorThief, { RGBColor } from 'colorthief';

export class AccentUtil {
	themeMode: "light" | "dark" = "light";
	themeRawColorData: Theme | undefined;
	private imageThemeCache = new Map<string, Theme>();
	private themeWorker: Worker;

	constructor() {
		this.themeWorker = new Worker(new URL('./themeWorker.ts', import.meta.url));
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

	setThemeRawColorData(theme: Theme) {
		this.themeRawColorData = theme;
	}

	/*
	rgbToHex(rgb: RGBColor): string {
		const [r, g, b] = rgb.map((color) => Math.round(color).toString(16).padStart(2, '0'));
		return `#${r}${g}${b}`;
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
	*/

	public setThemeMode(mode: "light" | "dark") {
		this.themeMode = mode;
		const articleImage = document.querySelector('.article-image');
		let authorPageElement = document.getElementById("react-author");
		let tagPageElement = document.getElementById("react-tag");
		let authorHeaderImage;

		if (authorPageElement || tagPageElement) {
			authorHeaderImage = document.querySelector('.post-card-image-link');
		}

		if (articleImage || authorHeaderImage) {
			this.setThemeFromM3(
				articleImage ?? authorHeaderImage
			);
		} else {
			const metaThemeColor = document.querySelector('meta[name="theme-color"]');

			if (metaThemeColor && mode === "light") {
				metaThemeColor.setAttribute('content', "#cee5ff");
			} else if (metaThemeColor && mode === "dark") {
				metaThemeColor.setAttribute('content', "#004b74");
			}
		}
	}

	setMetaTagColor() {
		const metaThemeColor = document.querySelector('meta[name="theme-color"]');

		if (metaThemeColor && this.themeRawColorData?.schemes[this.themeMode].primaryContainer) {
			metaThemeColor.setAttribute('content', this.argbToRgb(
				this.themeRawColorData?.schemes[this.themeMode].primaryContainer
			));
		}
	}

	async setThemeFromM3(parentElement: Element | HTMLElement) {
		const theme = await this.setM3ColorAndTarget(
			null,
			document.body,
			parentElement
		);
		if (theme) {
			this.themeRawColorData = theme;
			this.setThemeRawColorData(theme);
			this.setMetaTagColor();
		}
	}

	private getArrayBufferFromImage(imgElement: HTMLImageElement): Promise<{ arrayBuffer: ArrayBuffer, width: number, height: number }> {
		return new Promise((resolve, reject) => {
			const canvas = document.createElement('canvas');
			canvas.width = imgElement.width;
			canvas.height = imgElement.height;
			const ctx = canvas.getContext('2d');

			if (ctx) {
				imgElement.crossOrigin = "anonymous";
				ctx.drawImage(imgElement, 0, 0);
				canvas.toBlob((blob) => {
					if (blob) {
						const reader = new FileReader();
						reader.onloadend = () => {
							resolve({ arrayBuffer: reader.result as ArrayBuffer, width: imgElement.width, height: imgElement.height });
						};
						reader.onerror = reject;
						reader.readAsArrayBuffer(blob);
					} else {
						reject(new Error('Failed to convert canvas to blob.'));
					}
				});
			} else {
				reject(new Error('Canvas context is not available.'));
			}
		});
	}

	private getThemeFromImageWorker(arrayBuffer: ArrayBuffer, width: number, height: number): Promise<string> {
		return new Promise((resolve, reject) => {
			this.themeWorker.onmessage = (event) => {
				resolve(event.data);
			};
			this.themeWorker.onerror = (error) => {
				reject(error);
			};
			this.themeWorker.postMessage({ arrayBuffer, width, height });
		});
	}

	private async getThemeFromImageCached(imgElement: HTMLImageElement): Promise<Theme> {
		const src = imgElement.src;
		if (this.imageThemeCache.has(src)) {
			return this.imageThemeCache.get(src) as Theme;
		} else {
			const { arrayBuffer, width, height } = await this.getArrayBufferFromImage(imgElement);
			const imageUrl = await this.getThemeFromImageWorker(arrayBuffer, width, height);
			const theme = await this.createImageElementAndExtractTheme(imageUrl);
			this.imageThemeCache.set(src, theme);
			return theme;
		}
	}

	private createImageElementAndExtractTheme(imageUrl: string): Promise<Theme> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = async () => {
				try {
					const theme = await themeFromImage(img);
					resolve(theme);
				} catch (error) {
					reject(error);
				}
			};
			img.onerror = reject;
			img.src = imageUrl;
		});
	}

	async setM3ColorAndTarget(
		parentOfImg: string | null,
		target: string | HTMLElement,
		elementClass: Element | HTMLElement | null
	) {
		// console.time('setM3ColorAndTarget');
	
		let theme: Theme | null = null;
		const parentElement = document.getElementById(parentOfImg);
	
		// console.time('parentElementCheck');
		if (parentElement) {
			// console.timeEnd('parentElementCheck');
	
			// console.time('imgElementCheck');
			const imgElement = parentElement.querySelector("img");
			let color = "";
	
			if (imgElement) {
				imgElement.crossOrigin = "anonymous";
				// console.timeEnd('imgElementCheck');
	
				// Wait for the image to fully load
				await new Promise<void>((resolve, reject) => {
					if (imgElement.complete) {
						resolve();
					} else {
						imgElement.onload = () => resolve();
						imgElement.onerror = () => reject(new Error('Image failed to load'));
					}
				});
	
				// console.time('themeFromImage');
				theme = await this.getThemeFromImageCached(imgElement as HTMLImageElement);
				// console.timeEnd('themeFromImage');
			} else {
				// console.timeEnd('imgElementCheck');
				console.error("No <img> element found within the parent element.");
				theme = themeFromSourceColor(argbFromHex("#b0b2bd"));
			}
		} else if (elementClass && elementClass !== null) {
			// console.timeEnd('parentElementCheck');
	
			// console.time('elementClassCheck');
			const imgElement = elementClass.querySelector("img");
			let color = "";
	
			if (imgElement) {
				// console.timeEnd('elementClassCheck');
	
				// console.time('imgElementCrossOrigin');
				imgElement.crossOrigin = "anonymous";
				// console.timeEnd('imgElementCrossOrigin');
	
				// Wait for the image to fully load
				await new Promise<void>((resolve, reject) => {
					if (imgElement.complete) {
						resolve();
					} else {
						imgElement.onload = () => resolve();
						imgElement.onerror = () => reject(new Error('Image failed to load'));
					}
				});
	
				// console.time('themeFromImage');
				theme = await this.getThemeFromImageCached(imgElement as HTMLImageElement);
				// console.timeEnd('themeFromImage');
			} else {
				// console.timeEnd('elementClassCheck');
				console.error("No <img> element found within the parent element.");
				theme = themeFromSourceColor(argbFromHex("#b0b2bd"));
			}
		} else {
			// console.timeEnd('parentElementCheck');
			console.error("Parent element with ID '" + parentOfImg + "' not found.");
			theme = themeFromSourceColor(argbFromHex("#b0b2bd"));
		}
	
		if (theme) {
			// console.time('applyTheme');
			applyTheme(
				theme,
				{
					target: typeof target === "string" ? document.getElementById(target) as HTMLElement : target,
					dark: this.themeMode === "light" ? false : true
				}
			);
			// console.timeEnd('applyTheme');
		}
	
		// console.timeEnd('setM3ColorAndTarget');
	
		return theme;
	}
	
}