import React, { Component } from 'react';
import '@sass/components/ThemeSwitcher.scss';
import { Idb } from '@utils/Idb';

interface ThemeSwitcherProps { }

interface ThemeSwitcherState {
	themeMode: 'light' | 'dark';
	idb: Idb | null;
}

class ThemeSwitcher extends Component<ThemeSwitcherProps, ThemeSwitcherState> {
	constructor(props: ThemeSwitcherProps) {
		super(props);
		this.state = {
			themeMode: 'light',
			idb: null,
		};
	}

	async componentDidMount(): Promise<void> {
		const idb = new Idb();
		this.setState({ idb });
		idb.connectToIDB();

		idb.writeToTheme("Material You", {
			preferredColorScheme: this.state.themeMode,
		});
	}

	toggleThemeMode = () => {
		const newThemeMode = this.state.themeMode === 'light' ? 'dark' : 'light';
		console.warn(newThemeMode);
		this.setState({ themeMode: newThemeMode });

		this.state.idb.writeToTheme("Material You", {
			preferredColorScheme: newThemeMode,
		})
	};

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
