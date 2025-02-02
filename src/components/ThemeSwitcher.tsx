import React, { Component } from 'react';
// import '@sass/components/ThemeSwitcher.scss';

import { Idb } from '@utils/Idb';
import { AccentUtil } from '@utils/Accent';

interface ThemeSwitcherProps { }

interface ThemeSwitcherState {
	themeMode: 'light' | 'dark';
	isDarkMode: boolean;
	idb: Idb;
	top: string | null;
}

class ThemeSwitcher extends Component<ThemeSwitcherProps, ThemeSwitcherState> {
	constructor(props: ThemeSwitcherProps) {
		super(props);
		this.state = {
			themeMode: 'light',
			isDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
			idb: new Idb(),
			top: null
		};

		this.state.idb.connectToIDB();
		this.readSetThemeFromIdb();
	}

	componentDidMount() {
		window.addEventListener('scroll', this.handleScroll);
	}

	componentWillUnmount() {
		window.removeEventListener('scroll', this.handleScroll);
	}

	handleScroll = () => {
		const scrollTop = window.scrollY;
		const newTop = window.innerWidth <= 767 ? (scrollTop > 64 ? '32px' : undefined) : (scrollTop > 88 ? '32px' : undefined);
		this.setState({ top: newTop });
	};

	async readSetThemeFromIdb() {
		const preferredColorScheme = await this.state.idb.getData("Material You", "preferredColorScheme")

		if (preferredColorScheme) {
			this.setThemeMode(preferredColorScheme);
			this.setState({ themeMode: preferredColorScheme });
		} else {
			this.setThemeMode(this.state.isDarkMode ? "dark" : "light");
			this.setState({ themeMode: this.state.isDarkMode ? "dark" : "light" });
		}
	}

	toggleThemeMode = () => {
		if (this.state.themeMode === "light") {
			this.setThemeMode("dark");
		} else {
			this.setThemeMode("light");
		}
	};

	setThemeMode(mode: "light" | "dark") {
		const accentUtil = new AccentUtil();
		const isDark = mode === "dark";

		document.body.classList.toggle("dark-theme", isDark);
		document.body.classList.toggle("light-theme", !isDark);

		accentUtil.setThemeMode(mode);

		this.setState({ themeMode: isDark ? "dark" : "light" });

		this.state.idb.writeToTheme("Material You", {
			preferredColorScheme: mode,
		});
	}

	render() {
		const { top } = this.state;
		return (
			<button
				onClick={this.toggleThemeMode}
				className="theme-switcher" 
				style={ top ? { top } : undefined }
			>
				<span className="material-symbols-rounded theme-switcher__toggle-icon">
					{this.state.themeMode === 'light' ? 'dark_mode' : 'light_mode'}
				</span>
				Toggle theme
			</button>
		);
	}
}

export default ThemeSwitcher;
