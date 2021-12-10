import {asyncIterableToArray, asyncIterableMap} from '@async-abstraction/tape';

const lines = async function* (documents) {
	for await (const {header, reports, footer} of documents) {
		console.debug(JSON.stringify({header, reports, footer}, undefined, 2));
		if (header.kind === 'lab') {
			yield* header.lab.identifier.lines;
			yield* header.lab.name.lines;
			yield* header.lab.address.lines;
			yield* header.lab.extra.lines;
		} else {
			yield* header.doctor.nihdi.lines;
			yield* header.doctor.name.lines;
			yield* header.doctor.address.lines;
			yield* header.doctor.phone.lines;
			yield* header.doctor.extra.lines;
		}

		yield* header.date.lines;
		yield* header.requestor.nihdi.lines;
		yield* header.requestor.name.lines;
		for (const {header, blocks, footer} of reports) {
			yield* header.identifier.lines;
			yield* header.name.lines;
			yield* header.birthdate.lines;
			yield* header.sex.lines;
			yield* header.requestDate.lines;
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

const stringifyBundle = async (documents) => {
	const buffers = await asyncIterableToArray(
		asyncIterableMap(
			({contents, newline}) => contents + newline,
			lines(documents),
		),
	);
	return buffers.join('');
};

export default stringifyBundle;
