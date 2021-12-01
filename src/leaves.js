import {ast} from '@formal-language/grammar';

const leaves = async function* (tree) {
	if (tree.type === 'leaf') {
		yield tree;
		return;
	}

	const flattened = ast.flatten(tree);

	for await (const leaf of flattened) {
		yield leaf;
	}
};

export default leaves;
