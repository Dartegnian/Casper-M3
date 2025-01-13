import React, { Component } from 'react';
import '@sass/components/App.scss';

import Author from '@pages/Author';
import Post from '@pages/Post';
import Home from '@pages/Home';

import ThemeSwitcher from '@components/ThemeSwitcher';

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
			case 'tag':
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