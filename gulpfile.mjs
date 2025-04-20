// gulpfile.mjs
import gulpPkg from 'gulp';
const { series, watch, src, dest, parallel } = gulpPkg;

import pump from 'pump';
import path from 'path';
import * as releaseUtils from '@tryghost/release-utils';
import inquirer from 'inquirer';

import livereload from 'gulp-livereload';
import postcss from 'gulp-postcss';
import gulpZip from 'gulp-zip';
import concat from 'gulp-concat';
import uglify from 'gulp-uglify';
import beeper from 'beeper';
import * as fs from 'fs';

import autoprefixer from 'autoprefixer';
import colorFunction from 'postcss-color-mod-function';
import cssnano from 'cssnano';
import easyimport from 'postcss-easy-import';

import dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);

import webpackStream from 'webpack-stream';
import webpackConfig from './webpack.config.js';

const REPO = 'TryGhost/Casper';
const REPO_READONLY = 'TryGhost/Casper';
const CHANGELOG_PATH = path.join(process.cwd(), '.', 'changelog.md');

function serve(done) {
  livereload.listen();
  done();
}

const handleError = (done) => (err) => {
  if (err) beeper();
  return done(err);
};

function hbs(done) {
  pump(
    [ src(['*.hbs', 'partials/**/*.hbs']), livereload() ],
    handleError(done)
  );
}

function css(done) {
  pump(
    [
      src('assets/css/*.css', { sourcemaps: true }),
      postcss([easyimport, colorFunction(), autoprefixer(), cssnano()]),
      dest('assets/built/', { sourcemaps: '.' }),
      livereload(),
    ],
    handleError(done)
  );
}

function scss(done) {
  pump(
    [
      src('assets/sass/*.scss', { sourcemaps: true }),
      sass(),
      dest('assets/built/', { sourcemaps: '.' }),
      livereload(),
    ],
    handleError(done)
  );
}

function js(done) {
  pump(
    [
      src(['assets/js/lib/*.js', 'assets/js/*.js'], { sourcemaps: true }),
      concat('casper.js'),
      uglify(),
      dest('assets/built/', { sourcemaps: '.' }),
      livereload(),
    ],
    handleError(done)
  );
}

function zipper(done) {
  const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url)));
  const filename = pkg.name + '.zip';

  pump(
    [
      src([
        '**',
        '!node_modules', '!node_modules/**',
        '!dist', '!dist/**',
        '!yarn-error.log',
        '!yarn.lock',
        '!gulpfile.js'
      ]),
      gulpZip(filename),
      dest('dist/'),
    ],
    handleError(done)
  );
}

function webpack(done) {
  pump(
    [
      src('assets/built'),
      webpackStream(webpackConfig),
      dest('assets/built'),
      livereload(),
    ],
    handleError(done)
  );
}

const scssWatcher    = () => watch('assets/sass/**', scss);
const cssWatcher     = () => watch('assets/css/**', css);
const jsWatcher      = () => watch('assets/js/**', js);
const webpackWatcher = () => watch('src/**', webpack);
const hbsWatcher     = () => watch(['*.hbs', 'partials/**/*.hbs'], hbs);

const watcher = parallel(cssWatcher, hbsWatcher, scssWatcher, jsWatcher, webpackWatcher);
const build   = series(css, js, scss, webpack);

export { build };
export const zip = series(build, zipper);
export default series(build, serve, watcher);

export async function release() {
  const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url)));
  const newVersion = pkg.version;
  if (!newVersion) {
    console.log(`Invalid version: ${newVersion}`);
    return;
  }

  console.log(`\nCreating release for ${newVersion}...`);
  const githubToken = process.env.GST_TOKEN;
  if (!githubToken) {
    console.log('Please configure your environment with a GitHub token in GST_TOKEN');
    return;
  }

  try {
    const { compatibleWithGhost } = await inquirer.prompt([{
      type:    'input',
      name:    'compatibleWithGhost',
      message: 'Which version of Ghost is it compatible with?',
      default: '5.0.0'
    }]);

    const releasesResponse = await releaseUtils.releases.get({
      userAgent: 'Casper',
      uri:       `https://api.github.com/repos/${REPO_READONLY}/releases`
    });

    if (!releasesResponse) {
      console.log('No releases found. Skipping...');
      return;
    }

    const previousVersion = releasesResponse[0].tag_name || releasesResponse[0].name;
    console.log(`Previous version: ${previousVersion}`);

    const changelog = new releaseUtils.Changelog({
      changelogPath: CHANGELOG_PATH,
      folder:        path.join(process.cwd(), '.')
    });

    changelog
      .write({
        githubRepoPath: `https://github.com/${REPO}`,
        lastVersion:    previousVersion
      })
      .sort()
      .clean();

    const newReleaseResponse = await releaseUtils.releases.create({
      draft:         true,
      preRelease:    false,
      tagName:       'v' + newVersion,
      releaseName:   newVersion,
      userAgent:     'Casper',
      uri:           `https://api.github.com/repos/${REPO}/releases`,
      github:        { token: githubToken },
      content:       [`**Compatible with Ghost ≥ ${compatibleWithGhost}**\n\n`],
      changelogPath: CHANGELOG_PATH
    });

    console.log(`\nRelease draft generated: ${newReleaseResponse.releaseUrl}\n`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
