import {chain} from '@iterable-iterator/chain';
import {map} from '@iterable-iterator/map';

import merge from './merge.js';

const reportParts = function* ({header, blocks, footer}) {
	yield {
		meta: {
			...header.reference.parsed,
			...header.code.parsed,
			...header.extra.parsed,
		},
		patient: {
			...header.identifier.parsed,
			...header.name.parsed,
			birthdate: header.birthdate.parsed.date,
			...header.sex.parsed,
			requestDate: header.requestDate.parsed.date,
		},
		lines: [
			...header.identifier.lines,
			...header.name.lines,
			...header.birthdate.lines,
			...header.sex.lines,
			...header.requestDate.lines,
			...header.reference.lines,
			...header.code.lines,
			...header.extra.lines,
		],
	};

	for (const {begin, title, contents, end} of blocks) {
		yield {
			results: [
				{
					...begin.parsed,
					...title.parsed,
					...contents.parsed,
				},
			],
			lines: [...begin.lines, ...title.lines, ...contents.lines, ...end.lines],
		};
	}

	yield {
		lines: [...footer.lines],
	};
};

const documentHeaderParts = function* (header) {
	if (header.kind === 'lab') {
		yield {
			type: 'lab',
			lab: {
				...header.lab.identifier.parsed,
				...header.lab.name.parsed,
				...header.lab.address.parsed,
				...header.lab.extra.parsed,
			},
			lines: [
				...header.lab.identifier.lines,
				...header.lab.name.lines,
				...header.lab.address.lines,
				...header.lab.extra.lines,
			],
		};
	} else {
		yield {
			type: 'report',
			doctor: {
				...header.doctor.nihdi.parsed,
				...header.doctor.name.parsed,
				...header.doctor.address.parsed,
				...header.doctor.phone.parsed,
				...header.doctor.extra.parsed,
			},
			lines: [
				...header.doctor.nihdi.lines,
				...header.doctor.name.lines,
				...header.doctor.address.lines,
				...header.doctor.phone.lines,
				...header.doctor.extra.lines,
			],
		};
	}

	yield {
		meta: {
			...header.date.parsed,
		},
		requestor: {
			...header.requestor.nihdi.parsed,
			...header.requestor.name.parsed,
		},
		lines: [
			...header.date.lines,
			...header.requestor.nihdi.lines,
			...header.requestor.name.lines,
		],
	};
};

const splitDocument = ({header, reports, footer}) => {
	const commonBegin = merge(documentHeaderParts(header));
	const commonEnd = {
		lines: [...footer.lines],
	};
	return map(
		(report) => merge(chain([commonBegin], reportParts(report), [commonEnd])),
		reports,
	);
};

const split = async function* (documents) {
	for await (const document of documents) yield* splitDocument(document);
};

export default split;
