import {readdir, readFile} from 'node:fs/promises';
import test from 'ava';

import {asyncIterableToArray} from '@async-abstraction/tape';

import {parse} from '../../src/index.js';

const file = async (t, filename) => {
	const raw = await readFile(`test/data/input/${filename}`);
	const expected = JSON.parse(await readFile(`test/data/json/${filename}`));
	const source = raw.toString();

	const actual = {
		documents: await asyncIterableToArray(await parse(source)),
	};
	t.deepEqual(actual, expected);
};

file.title = (title, filename) => title ?? filename;

const testFileDir = 'test/data/input';

readdir(testFileDir).then((testFiles) => {
	for (const filename of testFiles) {
		test(file, filename);
	}
});
