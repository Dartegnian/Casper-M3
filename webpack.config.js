const path = require('path');

module.exports = {
	mode: 'production',
	entry: {
		main: "./src/index.tsx",
	},
	resolve: {
		alias: {
			'@components': path.resolve(__dirname, 'src/components'),
			'@pages': path.resolve(__dirname, 'src/pages'),
			'@sass': path.resolve(__dirname, 'assets/sass'),
			'@utils': path.resolve(__dirname, 'src/utils'),
		},
		extensions: ['.js', '.jsx', '.ts', '.tsx'], // Add .ts and .tsx extensions
		modules: ['node_modules', path.resolve(__dirname, 'assets/sass')],
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/, // Keep the existing rule for JavaScript/JSX files
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/env', '@babel/preset-react'],
					},
				},
			},
			{
				test: /\.(ts|tsx)$/, // Add a new rule for TypeScript/TSX files
				exclude: /(node_modules|bower_components)/,
				use: 'ts-loader',
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.scss$/,
				use: ['style-loader', 'css-loader', 'sass-loader'],
			},
		],
	},
	output: {
		filename: "[name].bundle.js",
		path: path.resolve(__dirname, "assets/built"),
	},
};
