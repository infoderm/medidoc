import {asyncIterableToArray, asyncIterableMap} from '@async-abstraction/tape';

const lines = async function* (documents) {
	for await (const {header, reports, footer} of documents) {
		yield* header.doctor.lines;
		yield* header.date.lines;
		yield* header.requestor.lines;
		for (const {header, blocks, footer} of reports) {
			yield* header.identifier.lines;
			yield* header.name.lines;
			yield* header.birthdate.lines;
			yield* header.sex.lines;
			yield* header.date.lines;
			yield* header.reference.lines;
			yield* header.code.lines;
			yield* header.extra.lines;
			for (const {begin, title, contents, end} of blocks) {
				yield* begin.lines;
				yield* title.lines;
				yield* contents.lines;
				yield* end.lines;
			}

			yield* footer.lines;
		}

		yield* footer.lines;
	}
};

const stringify = async (documents) => {
	return (
		await asyncIterableToArray(
			asyncIterableMap(
				({contents, newline}) => contents + newline,
				lines(documents),
			),
		)
	).join('');
};

export default stringify;
