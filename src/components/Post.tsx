import React, { Component, ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

interface PostState {
	title: string;
	author: string;
	published: string;
	content: string;
	isDataLoaded: boolean; // Track whether data has been loaded
}

class Post extends Component<{}, PostState> {
	constructor(props: {}) {
		super(props);
		this.state = {
			title: '',
			author: '',
			published: '',
			content: '',
			isDataLoaded: false,
		};
	}

	async componentDidMount(): Promise<void> {
		// Extract data from the global source
		const rootElement = document.querySelector('#react-root');
		if (rootElement) {
			const title = rootElement.getAttribute('data-title') || '';
			const author = rootElement.getAttribute('data-author') || '';
			const published = rootElement.getAttribute('data-published') || '';
			const content = rootElement.getAttribute('data-content') || '';

			console.log('Extracted Data:', { title, author, published, content });

			// Update state with extracted data
			this.setState({
				title,
				author,
				published,
				content,
				isDataLoaded: true, // Mark as loaded
			}, this.mountByline); // Callback after state is updated
		}
	}

	// Function to render the article byline
	renderByline(): ReactElement<any, any> {
		const { author, published } = this.state;

		// Safely format the date
		let formattedDate = 'Invalid Date';
		if (published) {
			const date = new Date(published);
			if (!isNaN(date.getTime())) {
				formattedDate = date.toLocaleDateString();
			}
		}

		return (
			<div className="byline">
				<p>By {author}</p>
				<p>Published on {formattedDate}</p>
			</div>
		);
	}

	// Function to mount the byline into the DOM
	mountByline = (): void => {
		if (this.state.isDataLoaded) {
			const bylineTarget = document.querySelector('.byline-meta-content');
			if (bylineTarget && !bylineTarget.querySelector('.react-byline-container')) {
				// Create a container div for the byline
				const bylineContainer = document.createElement('div');
				bylineContainer.className = 'react-byline-container';

				// Append the container as a child of the byline target
				bylineTarget.appendChild(bylineContainer);

				// Render only the byline
				const bylineContent = this.renderByline();

				// Convert JSX to static HTML
				const html = renderToStaticMarkup(bylineContent);
				bylineContainer.innerHTML = html; // Add the rendered content as HTML
			}
		}
	};

	render(): React.ReactNode {
		return null;
	}
}

export default Post;
