import {ast} from '@formal-language/grammar';

import grammar from './grammar.js';
import leaves from './leaves.js';

const buffers = (tree) =>
	ast.cmap(
		(leaf) => (leaf.terminal === grammar.eof ? '' : leaf.buffer),
		leaves(tree),
	);

export default buffers;
