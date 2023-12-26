import React, { Component } from 'react';
import '@sass/components/App.scss';

import Author from '@components/Author';
import Post from '@components/Post';
import Home from '@components/Home';

import ThemeSwitcher from '@components/ThemeSwitcher';
import { Idb } from '@utils/Idb';

interface AppState {
	onPage: string | null;
}

class App extends Component<{}, AppState> {
	pageTypes: string[];

	constructor(props: {}) {
		super(props);

		this.state = {
			onPage: null
		}

		this.pageTypes = [
			"home",
			"post",
			"author"
		];

		const idb = new Idb();
		idb.connectToIDB();
	}

	componentDidMount(): void {
		this.pageTypes.map((type) => {
			if (document.getElementById("react-" + type)) {
				this.setState({ onPage: type }, () => {
					// console.warn(this.state.onPage);
				});
			}
		});
	}

	renderDynamicComponent(): React.JSX.Element | null {
		switch (this.state.onPage) {
			case 'home':
				return <Home />;
			case 'post':
				return <Post />;
			case 'author':
				return <Author />
			default:
				return null;
		}
	}

	render(): React.ReactNode {
		return (
			<div className="app">
				{this.renderDynamicComponent()}
				<ThemeSwitcher></ThemeSwitcher>
			</div>
		);
	}
}

export default App;