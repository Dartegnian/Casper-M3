import React, { Component } from 'react';
import '@sass/components/ThemeSwitcher.scss';
import { Idb } from '@utils/Idb';
import { AccentUtil } from '@utils/Accent';

interface ThemeSwitcherProps { }

interface ThemeSwitcherState {
	themeMode: 'light' | 'dark';
	prefersDarkScheme: MediaQueryList | null;
	isDarkMode: boolean;
	prefersDarkSchemeFromIdb: "dark" | "light",
	idb: Idb | null;
}

class ThemeSwitcher extends Component<ThemeSwitcherProps, ThemeSwitcherState> {
	constructor(props: ThemeSwitcherProps) {
		super(props);
		this.state = {
			themeMode: 'light',
			prefersDarkScheme: null,
			isDarkMode: false,
			prefersDarkSchemeFromIdb: "light",
			idb: new Idb(),
		};
	}

	async componentDidMount(): Promise<void> {
		if (this.state.idb) {
			console.warn("IDB!!!!");
			await this.state.idb.connectToIDB();
			const prefersDarkSchemeFromIdb = await this.state.idb.getData("Material You", "preferredColorScheme");
			this.setState({ prefersDarkSchemeFromIdb });
		}


		if (this.state.prefersDarkSchemeFromIdb) {
			this.setState({ themeMode: this.state.prefersDarkSchemeFromIdb });
			this.setThemeMode(this.state.themeMode);
		} else if (this.state.isDarkMode && !this.state.prefersDarkSchemeFromIdb) {
			this.setThemeMode("dark");
		} else {
			this.setThemeMode("light");
		}
	}

	toggleThemeMode = () => {
		const accent = new AccentUtil();
		const newThemeMode = this.state.themeMode === 'light' ? 'dark' : 'light';
		console.warn(newThemeMode);
		this.setState({ themeMode: newThemeMode });

		accent.setThemeMode(newThemeMode);

		if (this.state.idb) {
			this.state.idb.writeToTheme("Material You", {
				preferredColorScheme: newThemeMode,
			})
		}
	};

	setThemeMode(mode: "light" | "dark") {
		const accent = new AccentUtil();

		switch (mode) {
			case "light":
				document.body.classList.toggle("dark-theme", false);
				document.body.classList.toggle("light-theme", true);
				this.setState({ themeMode: "light" });
				break;
			case "dark":
				document.body.classList.toggle("dark-theme", true);
				document.body.classList.toggle("light-theme", false);
				this.setState({ themeMode: "dark" });
				break;
			default:
				console.error("Invalid theme");
		}

		accent.setThemeMode(mode);

		if (this.state.idb) {
			this.state.idb.writeToTheme("Material You", {
				preferredColorScheme: mode,
			});
		}
	}

	render() {
		return (
			<button onClick={this.toggleThemeMode} className="theme-switcher">
				<span className="material-symbols-rounded theme-switcher__toggle-icon">
					{this.state.themeMode === 'light' ? 'dark_mode' : 'light_mode'}
				</span>
				Toggle theme
			</button>
		);
	}
}

export default ThemeSwitcher;
