import {ast} from '@formal-language/grammar';

import {map} from '@iterable-iterator/map';
import {any} from '@iterable-iterator/reduce';

import grammar from '../grammar.js';

const t = ast.transform;
const cmap = ast.cmap;
const recurse = (nonterminal, production) => (tree, match, ctx) => ({
	type: 'node',
	nonterminal,
	production,
	children: cmap(
		async (x) => (x.type === 'leaf' ? x : t(x, match, ctx)),
		tree.children,
	),
});

const skip = (tree) => tree;

// Move to @formal-languague/grammar/ast.visitor
function generateVisitor(grammar) {
	const transform = {};

	for (const [nonterminal, productions] of grammar.productions.entries()) {
		const nonterminalTransform = {};

		for (const [key, rules] of productions.entries()) {
			if (any(map((x) => x.type === 'node', rules))) {
				nonterminalTransform[key] = recurse(nonterminal, key);
			} else {
				// TODO test if this actually is faster
				nonterminalTransform[key] = skip;
			}
		}

		transform[nonterminal] = nonterminalTransform;
	}

	return transform;
}

export const extend = (transform, extension) => {
	const result = {};
	for (const key in transform) {
		if (Object.prototype.hasOwnProperty.call(transform, key)) {
			result[key] = Object.assign({}, transform[key], extension[key]);
		}
	}

	return result;
};

export const visitor = generateVisitor(grammar);
