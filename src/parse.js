import parseBundle from './parseBundle.js';
import split from './split.js';

const parse = async (string) => split(await parseBundle(string));

export default parse;
