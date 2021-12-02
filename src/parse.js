import assert from 'node:assert';
import * as tape from '@async-abstraction/tape';
import {ll1, ast} from '@formal-language/grammar';

import tokens from './tokens.js';
import grammar from './grammar.js';
import leaves from './leaves.js';
import simplify from './transform/simplify.js';
import {iter, next, StopIteration} from './transform/lib.js';

const parseTape = (inputTape) => {
	const parser = ll1.from(grammar);
	const inputTokens = tokens(inputTape);
	const inputTokensTape = tape.fromAsyncIterable(inputTokens);
	const tree = parser.parse(inputTokensTape);

	const ctx = {};

	return ast.transform(tree, simplify, ctx);
};

const parseString = (string) => {
	const inputCharacterTape = tape.fromString(string);
	return parseTape(inputCharacterTape);
};

const r = async (it) => {
	const tree = await next(it);
	return tree.type === 'leaf' ? tree : ast.materialize(tree);
};

const lines = async (tree) => {
	// TODO use depth first traversal or make newline a terminal
	const result = [];
	const it = iter(leaves(tree));
	let position = null;
	let contents = [];
	let newline = '';
	for (;;) {
		try {
			const leaf = await next(it);
			const current = leaf.buffer;
			if (position === null) position = leaf.position;
			if (current === '\r') {
				assert(newline === '');
				newline += '\r';
			} else if (current === '\n') {
				assert(newline === '' || newline === '\r');
				newline += '\n';
				result.push({
					position,
					contents: contents.join(''),
					newline,
				});
				position = null;
				contents = [];
				newline = '';
			} else {
				contents.push(current);
			}
		} catch (error) {
			if (error instanceof StopIteration) {
				if (position !== null) {
					result.push({
						position,
						contents: contents.join(''),
						newline,
					});
				}

				return result;
			}

			throw error;
		}
	}
};

const parseBlock = async (block) => {
	assert(block.type === 'node');
	assert(block.nonterminal === 'A');
	const it = iter(block.children);
	const blockBegin = await r(it);
	const title = await r(it);
	const contents = await r(it);
	const blockEnd = await r(it);
	return {
		begin: {
			lines: await lines(blockBegin),
		},
		title: {
			lines: await lines(title),
		},
		contents: {
			lines: await lines(contents),
		},
		end: {
			lines: await lines(blockEnd),
		},
	};
};

const parseReport = async (report) => {
	assert(report.type === 'node');
	assert(report.nonterminal === 'A');
	const it = iter(report.children);
	const identifier = await r(it);
	const name = await r(it);
	const birthdate = await r(it);
	const sex = await r(it);
	const date = await r(it);
	const reference = await r(it);
	const code = await r(it);
	const extra = await r(it);
	const header = {
		identifier: {
			lines: await lines(identifier),
		},
		name: {
			lines: await lines(name),
		},
		birthdate: {
			lines: await lines(birthdate),
		},
		sex: {
			lines: await lines(sex),
		},
		date: {
			lines: await lines(date),
		},
		reference: {
			lines: await lines(reference),
		},
		code: {
			lines: await lines(code),
		},
		extra: {
			lines: await lines(extra),
		},
	};
	const parsedBlocks = [];
	const blocks = await r(it);
	for await (const block of blocks.children) {
		parsedBlocks.push(await parseBlock(block));
	}

	const reportEnd = await r(it);
	return {
		header,
		blocks: parsedBlocks,
		footer: {
			lines: await lines(reportEnd),
		},
	};
};

const parseDocument = async (document) => {
	assert(document.type === 'node');
	assert(document.nonterminal === 'document');
	const kind = document.production;
	const it = iter(document.children);
	const doctor = await r(it);
	const date = await r(it);
	const requestor = await r(it);
	const meta = {
		kind,
		doctor: {
			lines: await lines(doctor),
		},
		date: {
			lines: await lines(date),
		},
		requestor: {
			lines: await lines(requestor),
		},
	};
	const parsedReports = [];
	const reports = await r(it);
	for await (const report of reports.children) {
		parsedReports.push(await parseReport(report));
	}

	const footer = await r(it);

	return {
		header: meta,
		reports: parsedReports,
		footer: {
			lines: await lines(footer),
		},
	};
};

const parseTree = async function* (tree) {
	assert(tree.type === 'node');
	assert(tree.nonterminal === 'documents');
	for await (const document of tree.children) {
		yield await parseDocument(document);
	}
};

const parse = async (string) => {
	const root = await parseString(string);
	const tree = await next(iter(root.children));
	return parseTree(tree);
};

export default parse;
