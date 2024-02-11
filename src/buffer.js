import * as tape from '@async-abstraction/tape';

import buffers from './buffers.js';

const buffer = (transformed) =>
	tape.toString(tape.fromAsyncIterable(buffers(transformed)));

export default buffer;
