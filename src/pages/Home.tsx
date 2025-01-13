import React, { Component } from 'react';
import { AccentUtil } from '@utils/Accent';

class Home extends Component {
	constructor(props: {} | Readonly<{}>) {
		super(props);
		this.state = {};
	}

	async componentDidMount(): Promise<void> {
		// const accentUtil = new AccentUtil();
		// const headerImage = document.querySelector('.site-header-content');

		// if (headerImage) {
		// 	await accentUtil.setThemeFromM3(
		// 		headerImage
		// 	);
		// }
	}

	render(): React.ReactNode {
		return (
			null
		);
	}
}

export default Home;
