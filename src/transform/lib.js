import {StopIteration} from '@iterable-iterator/next';

export {StopIteration} from '@iterable-iterator/next';

// TODO create library with those
export function iter(object) {
	// Maybe we do not even need the second case
	if (object[Symbol.asyncIterator]) return object[Symbol.asyncIterator]();
	return object[Symbol.iterator]();
}

// TODO create library with those
export async function next(iterator, dflt = undefined) {
	const x = await iterator.next();

	if (x.done) {
		if (dflt === undefined) throw new StopIteration();
		else return dflt;
	}

	return x.value;
}
