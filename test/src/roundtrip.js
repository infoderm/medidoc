import test from 'ava';

import {parseBundle, stringifyBundle} from '../../src/index.js';

import {inputFiles, textInput} from './_fixtures.js';

const file = async (t, name, options) => {
	const source = await textInput(name);

	const documents = await parseBundle(source, options);
	const result = await stringifyBundle(documents, options);
	t.is(result, source);
};

file.title = (title, name) => title ?? name;

inputFiles().then((tests) => {
	for (const name of tests) {
		const options = {
			lang: /nl/.test(name) ? 'nl' : 'fr',
			kind: /lab/.test(name) ? 'lab' : 'report',
		};
		test(file, name, options);
	}
});
