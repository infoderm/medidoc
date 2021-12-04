import assert from 'node:assert';
import {ast} from '@formal-language/grammar';

import leaves from '../leaves.js';
import {visitor, extend} from './visitor.js';

import {iter, next, StopIteration} from './lib.js';

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

const t = ast.transform;

const tailRecurse = async function* (tree, match, ctx) {
	while (tree.type === 'node') {
		let n = tree.children.length;
		assert(Number.isInteger(n));
		if (n === 0) return;
		const it = iter(tree.children);
		while (--n !== 0) {
			const child = await next(it);
			yield child.type === 'leaf' ? child : await t(child, match, ctx);
		}

		tree = await next(it);
	}

	yield tree;
};

const prunefn = async (tree) => ({
	type: 'leaf',
	terminal: tree.nonterminal,
	lines: await lines(tree),
});

const prune = (...keys) =>
	Object.fromEntries(keys.map((key) => [key, prunefn]));

const simplify = extend(visitor, {
	documents: {
		add: (tree, match, ctx) => ({
			type: 'node',
			nonterminal: 'documents',
			production: 'main',
			children: tailRecurse(tree, match, ctx),
		}),
	},
	'A*': {
		add: (tree, match, ctx) => ({
			type: 'node',
			nonterminal: 'A*',
			production: 'main',
			children: tailRecurse(tree, match, ctx),
		}),
	},
	'R*': {
		add: (tree, match, ctx) => ({
			type: 'node',
			nonterminal: 'R*',
			production: 'main',
			children: tailRecurse(tree, match, ctx),
		}),
	},
	'doctor-riziv': prune('0'),
	'doctor-name': prune('0'),
	'doctor-address': prune('0'),
	'doctor-phone': prune('0'),
	'doctor-extra': prune('0'),
	'lab-identifier': prune('0'),
	'lab-name': prune('0'),
	'lab-address': prune('0'),
	'lab-extra': prune('0'),
	date: prune('0'),
	'requestor-riziv': prune('0'),
	'requestor-name': prune('0'),
	'#A': prune('0'),
	'A-name': prune('0'),
	'A-birthdate': prune('0'),
	'A-sex': prune('0'),
	'A-date': prune('0'),
	'A-reference': prune('0'),
	'A-code': prune('0'),
	'A-extra': prune('0'),
	'#A/': prune('0'),
	'#R': prune('0'),
	'R-title': prune('free', 'code'),
	'R-body': prune('0'),
	'#R/': prune('0'),
	footer: prune('0'),
});

export default simplify;
