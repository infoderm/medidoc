import assert from 'node:assert';
import {ast} from '@formal-language/grammar';

import visitor from './visitor.js';

import {iter, next} from './lib.js';

function extend(transform, extension) {
	const result = {};
	for (const key in transform) {
		if (Object.prototype.hasOwnProperty.call(transform, key)) {
			result[key] = Object.assign({}, transform[key], extension[key]);
		}
	}

	return result;
}

const optimizedVisitor = extend(visitor, {
	newline: {
		crlf: (tree) => tree,
		lf: (tree) => tree,
	},
});

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

const simplify = extend(optimizedVisitor, {
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
	'free-lines': {
		'add-line': (tree, match, ctx) => ({
			type: 'node',
			nonterminal: 'free-lines',
			production: 'add-line',
			children: tailRecurse(tree, match, ctx),
		}),
		'add-empty-line': (tree, match, ctx) => ({
			type: 'node',
			nonterminal: 'free-lines',
			production: 'add-empty-line',
			children: tailRecurse(tree, match, ctx),
		}),
	},
	digits: {
		start: (tree, match, ctx) => ({
			type: 'node',
			nonterminal: 'digits',
			production: 'main',
			children: tailRecurse(tree, match, ctx),
		}),
	},
	'extra-free-text': {
		add: (tree, match, ctx) => ({
			type: 'node',
			nonterminal: 'extra-free-text',
			production: 'main',
			children: tailRecurse(tree, match, ctx),
		}),
	},
	'free-text-or-empty': {
		'free-text': (tree, match, ctx) => ({
			type: 'node',
			nonterminal: 'free-text-or-empty',
			production: 'free-text',
			children: tailRecurse(tree, match, ctx),
		}),
	},
	'free-text-no-prefix': {
		start: (tree, match, ctx) => ({
			type: 'node',
			nonterminal: 'free-text-no-prefix',
			production: 'main',
			children: tailRecurse(tree, match, ctx),
		}),
	},
	'free-text-no-hash-prefix': {
		start: (tree, match, ctx) => ({
			type: 'node',
			nonterminal: 'free-text-no-hash-prefix',
			production: 'main',
			children: tailRecurse(tree, match, ctx),
		}),
	},
	title: {
		code: (tree, match, ctx) => ({
			type: 'node',
			nonterminal: 'title',
			production: 'code',
			children: tailRecurse(tree, match, ctx),
		}),
	},
});

export default simplify;
