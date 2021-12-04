import {readdir, readFile} from 'node:fs/promises';
import test from 'ava';

import {parse, stringify} from '../../src/index.js';

const file = async (t, filename, options) => {
	const raw = await readFile(`test/data/input/${filename}`);
	const source = raw.toString();

	const documents = await parse(source, options);
	const result = await stringify(documents, options);
	t.is(result, source);
};

file.title = (title, filename) => title ?? filename;

const testFileDir = 'test/data/input';

readdir(testFileDir).then((testFiles) => {
	for (const filename of testFiles) {
		const options = {
			lang: /nl/.test(filename) ? 'nl' : 'fr',
			kind: /lab/.test(filename) ? 'lab' : 'report',
		};
		test(file, filename, options);
	}
});
