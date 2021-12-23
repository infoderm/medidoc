// eslint-disable-next-line import/no-unassigned-import
import 'regenerator-runtime/runtime.js';

import process from 'node:process';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {asyncIterableToArray} from '@async-iterable-iterator/async-iterable-to-array';
import {list} from '@iterable-iterator/list';
import {map} from '@iterable-iterator/map';

import {parse} from '../../src/index.js';

const init = async (filepath) => {
	console.info('processing', filepath);
	const filename = path.basename(filepath);
	const raw = await readFile(filepath);
	const source = raw.toString();
	const documents = await asyncIterableToArray(await parse(source));
	const blob = JSON.stringify({documents}, null, 2) + '\n';
	await writeFile(`json/${filename}`, blob);
};

const testFiles = process.argv.slice(2);

Promise.allSettled(list(map(init, testFiles))).then(() => {
	console.info('DONE');
});
