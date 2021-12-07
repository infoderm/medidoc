import {readdir, readFile} from 'node:fs/promises';

const inputFileDir = 'test/data/input';
const jsonFileDir = 'test/data/json';

export const inputFiles = () => readdir(inputFileDir);

export const textInput = async (name) => {
	const raw = await readFile(`${inputFileDir}/${name}`);
	return raw.toString();
};

export const jsonObject = async (name) => {
	const raw = await readFile(`${jsonFileDir}/${name}`);
	return JSON.parse(raw);
};
