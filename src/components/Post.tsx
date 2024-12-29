import React, { Component, Fragment, ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';

interface PostState {
	title: string;
	author: string;
	published: string;
	content: string;
	isDataLoaded: boolean; // Track whether data has been loaded;
	copyLinkText: string;
	canWebShare: boolean;
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
			copyLinkText: 'Copy link',
			canWebShare: false
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
			const canWebShare = typeof navigator?.canShare === 'function' &&
				navigator.canShare({
					title: "Everything but the Kitchen Sink - A Meaningful Struggle",
					text: "Read \"Everything but the Kitchen Sink\" by Dartegnian",
					url: "https://blog.dartegnian.com/everything-but-the-kitchen-sink/",
				});

			console.log('Extracted Data:', { title, author, published, content });

			// Update state with extracted data
			this.setState({
				title,
				author,
				published,
				content,
				isDataLoaded: true, // Mark as loaded
				canWebShare
			}, this.mountByline); // Callback after state is updated
		}
	}

	// Function to render the article byline
	renderByline(): ReactElement<any, any> {
		const { author, published } = this.state;
		const currentUrl = window.location.href;

		// Safely format the date
		let formattedDate = 'Invalid Date';
		if (published) {
			const date = new Date(published);
			if (!isNaN(date.getTime())) {
				formattedDate = date.toLocaleDateString();
			}
		}

		if (this.state.canWebShare) {
			return (
				<Fragment>
					ASAAA{currentUrl}
					<p>By {author}</p>
					<p>Published on {formattedDate}</p>
				</Fragment>
			);
		} else {
			return (
				<button
					className="react-byline-element"
					onClick={() => { this.copyLinkToClipboard() }}
				>
					<span className="material-symbols-rounded">content_copy</span> {this.state.copyLinkText}
				</button>

			);
		}

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

				// Create a root and render the React element
				const root = createRoot(bylineContainer);
				root.render(this.renderByline());
			}
		}
	};

	copyLinkToClipboard = (): void => {
		const currentUrl = window.location.href;

		navigator.clipboard.writeText(currentUrl)
			.then(() => {
				console.log('Link copied to clipboard!');
				this.setState({ copyLinkText: "Link copied!" }, () => {
					console.log('Updated copyLinkText:', this.state.copyLinkText);
				});

				setTimeout(() => {
					this.setState({ copyLinkText: "Copy link" }, () => {
						console.log('Reset copyLinkText:', this.state.copyLinkText);
					});
				}, 2000);
			})
			.catch(err => {
				console.error('Failed to copy link: ', err);
				this.setState({ copyLinkText: "Copy failed!" });
			});
	};

	async webShareEntry(): Promise<void> {
		const url = window.location.href;
		const title = this.state.title + " - A Meaningful Struggle";

		const shareData = {
			title,
			text: `Here's a link to Dartegnian's blog post: ${this.state.title}.`,
			url,
		};

		try {
			await navigator.share(shareData);
		} catch (err) {
			console.error(err);
			throw new Error(`${err}`);
		}
	}

	render(): React.ReactNode {
		return null;
	}
}

export default Post;
