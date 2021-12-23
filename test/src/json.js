import test from 'ava';

import {asyncIterableToArray} from '@async-iterable-iterator/async-iterable-to-array';

import {parse} from '../../src/index.js';

import {inputFiles, textInput, jsonObject} from './_fixtures.js';

const file = async (t, name) => {
	const source = await textInput(name);
	const expected = await jsonObject(name);

	const actual = {
		documents: await asyncIterableToArray(await parse(source)),
	};
	t.deepEqual(actual, expected);
};

file.title = (title, name) => title ?? name;

inputFiles().then((tests) => {
	for (const name of tests) {
		test(file, name);
	}
});
