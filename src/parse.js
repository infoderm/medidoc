import assert from 'node:assert';
import {first} from '@iterable-iterator/select';
import {filter} from '@iterable-iterator/filter';
import * as tape from '@async-abstraction/tape';
import {asyncIterableToArray} from '@async-abstraction/tape';
import {ll1, ast} from '@formal-language/grammar';
import dateParse from 'date-fns/parse/index.js';
import dateIsValid from 'date-fns/isValid/index.js';

import tokens from './tokens.js';
import grammar from './grammar.js';
import simplify from './transform/simplify.js';
import {iter, next, map as asyncMap} from './transform/lib.js';

const parseTape = (inputTape) => {
	const parser = ll1.from(grammar);
	const inputTokens = tokens(inputTape);
	const inputTokensTape = tape.fromAsyncIterable(inputTokens);
	const tree = parser.parse(inputTokensTape);

	const ctx = {};

	return ast.transform(tree, simplify, ctx);
};

const parseString = (string) => {
	const inputCharacterTape = tape.fromString(string);
	return parseTape(inputCharacterTape);
};

const parseBlockBegin = (tree) => {
	assert(tree.type === 'leaf');
	assert(tree.terminal === '#R');
	assert(tree.lines.length === 1);
	const line = tree.lines[0].contents;
	return {
		...tree,
		parsed: {
			type: line.slice(2).trim(),
		},
	};
};

const parseBlockTitle = (tree) => {
	assert(tree.type === 'leaf');
	assert(tree.terminal === 'R-title');
	assert(tree.lines.length === 1);
	const line = tree.lines[0].contents;
	return {
		...tree,
		parsed: {
			type: line.trim(),
		},
	};
};

const parseBlockType = (type) => {
	switch (type) {
		case 'd':
			return {TimeIndication: 'Days'};
		case 'h':
			return {TimeIndication: 'Hours'};
		case 'm':
			return {TimeIndication: 'Minutes'};
		case 's':
			return {TimeIndication: 'Seconds'};
		default:
			assert(type === 'a');
			return {};
	}
};

const parseIntensity = (symbol) => {
	switch (symbol) {
		case '--':
		case 'LL':
		case '1':
			return 'GreatlyReduced';
		case '-':
		case 'L':
		case '2':
			return 'Reduced';
		case '=':
		case 'N':
		case '3':
		case '':
			return 'Normal';
		case '+':
		case 'H':
		case '4':
			return 'Increased';
		case '++':
		case 'HH':
		case '5':
			return 'GreatlyIncreased';
		default:
			return 'Unknown';
	}
};

const parseBlockComments = (comments) => {
	if (comments.length > 0 && comments[0].slice(0, 1) === '\\') {
		return {
			referenceValue: comments[0].slice(1),
			comments: comments.slice(1),
		};
	}

	return {
		comments,
	};
};

const parseBlockBody = (type, tree) => {
	assert(tree.type === 'leaf');
	assert(tree.terminal === 'R-body');
	if (type === 'c') {
		return {
			...tree,
			parsed: {
				comments: tree.lines.map(({contents}) => contents),
			},
		};
	}

	if (type === 'b') {
		return {
			...tree,
			parsed: {
				text: tree.lines.map(({contents}) => contents),
			},
		};
	}

	assert(tree.lines.length >= 3);
	const [line1, line2, line3, ...rest] = tree.lines.map(
		({contents}) => contents,
	);
	const intensitySymbol = line3.trim();
	return {
		...tree,
		parsed: {
			...parseBlockType(type),
			relation: line1.slice(0, 1),
			value: line1.slice(1).trim(),
			unit: line2.trim(),
			intensity: parseIntensity(intensitySymbol),
			intensitySymbol,
			...parseBlockComments(rest),
		},
	};
};

const parseBlock = async (block) => {
	assert(block.type === 'node');
	assert(block.nonterminal === 'R');
	const it = iter(block.children);
	const begin = parseBlockBegin(await next(it));
	const title = parseBlockTitle(await next(it));
	const contents = parseBlockBody(begin.parsed.type, await next(it));
	const end = await next(it);
	return {
		begin,
		title,
		contents,
		end,
	};
};

const parseSex = (tree) => {
	assert(tree.type === 'leaf');
	assert(tree.terminal === 'A-sex');
	assert(tree.lines.length === 1);
	const line = tree.lines[0].contents;
	const sex = line === 'X' ? 'female' : line === 'Y' ? 'male' : 'other';
	return {
		...tree,
		parsed: {
			sex,
		},
	};
};

const parseReference = (tree) => {
	assert(tree.type === 'leaf');
	assert(tree.terminal === 'A-reference');
	assert(tree.lines.length === 1);
	const line = tree.lines[0].contents;
	return {
		...tree,
		parsed: {
			reference: line.trim(),
		},
	};
};

const parseCode = (tree) => {
	assert(tree.type === 'leaf');
	assert(tree.terminal === 'A-code');
	assert(tree.lines.length === 1);
	const line = tree.lines[0].contents;
	return {
		...tree,
		parsed: {
			reference: line.trim(),
		},
	};
};

const parseReportIdentifier = (tree) => {
	assert(tree.type === 'leaf');
	assert(tree.terminal === '#A');
	assert(tree.lines.length === 1);
	const line = tree.lines[0].contents;
	const identifier = line.slice(2);
	return identifier.length === 11
		? {
				...tree,
				parsed: {
					nn: identifier,
				},
		  }
		: identifier.length === 13
		? {
				...tree,
				parsed: {
					dossier: identifier,
				},
		  }
		: {
				...tree,
				parsed: {
					identifier,
				},
		  };
};

const parseReportFooter = (tree) => {
	assert(tree.type === 'leaf');
	assert(tree.terminal === '#A/');
	assert(tree.lines.length === 1);
	return tree;
};

const parseReport = async (report) => {
	assert(report.type === 'node');
	assert(report.nonterminal === 'A');
	const it = iter(report.children);
	const identifier = parseReportIdentifier(await next(it));
	const name = parseName(await next(it));
	const birthdate = parseDate(await next(it));
	const sex = parseSex(await next(it));
	const date = parseDate(await next(it));
	const reference = parseReference(await next(it));
	const code = parseCode(await next(it));
	const extra = parseExtra(await next(it));
	const header = {
		identifier,
		name,
		birthdate,
		sex,
		date,
		reference,
		code,
		extra,
	};

	const blocks = await next(it);

	const parsedBlocks = await asyncIterableToArray(
		asyncMap(parseBlock, blocks.children),
	);

	const footer = parseReportFooter(await next(it));
	return {
		header,
		blocks: parsedBlocks,
		footer,
	};
};

const parseRiziv = (tree) => {
	assert(tree.type === 'leaf');
	assert(
		tree.terminal === 'doctor-riziv' || tree.terminal === 'requestor-riziv',
	);
	assert(tree.lines.length === 1);
	const line = tree.lines[0].contents;
	return {
		...tree,
		parsed: {
			riziv: line.replaceAll('/', ''),
		},
	};
};

const parseName = (tree) => {
	assert(tree.type === 'leaf');
	assert(
		tree.terminal === 'doctor-name' ||
			tree.terminal === 'requestor-name' ||
			tree.terminal === 'A-name',
	);
	assert(tree.lines.length === 1);
	const line = tree.lines[0].contents;
	return {
		...tree,
		parsed: {
			firstname: line.slice(24).trim(),
			lastname: line.slice(0, 24).trim(),
		},
	};
};

const parseDoctorAddress = (tree) => {
	assert(tree.type === 'leaf');
	assert(tree.terminal === 'doctor-address');
	assert(tree.lines.length === 2);
	const [line1, line2] = tree.lines.map(({contents}) => contents);
	return {
		...tree,
		parsed: {
			streetName: line1.slice(0, 35).trim(),
			streetNumber: line1.slice(35).trim(),
			postalCode: line2.slice(0, 10).trim(),
			townName: line2.slice(10).trim(),
		},
	};
};

const parseLabAddress = (tree) => {
	assert(tree.type === 'leaf');
	assert(tree.terminal === 'lab-address');
	assert(tree.lines.length === 2);
	const [line1, line2] = tree.lines.map(({contents}) => contents);
	return {
		...tree,
		parsed: {
			line1,
			line2,
		},
	};
};

const parsePhone = (tree) => {
	assert(tree.type === 'leaf');
	assert(tree.terminal === 'doctor-phone');
	assert(tree.lines.length === 1);
	const line = tree.lines[0].contents;
	return {
		...tree,
		parsed: {
			phone: line.trim(),
		},
	};
};

const parseExtra = (tree) => tree;
const parseLabIdentifier = (tree) => {
	assert(tree.type === 'leaf');
	assert(tree.terminal === 'lab-identifier');
	assert(tree.lines.length === 1);
	const line = tree.lines[0].contents;
	return {
		...tree,
		parsed: {
			identifier: line.trim(),
		},
	};
};

const parseLabName = (tree) => {
	assert(tree.type === 'leaf');
	assert(tree.terminal === 'lab-name');
	assert(tree.lines.length === 1);
	const line = tree.lines[0].contents;
	return {
		...tree,
		parsed: {
			name: line.trim(),
		},
	};
};

const parseLab = async (tree) => {
	assert(tree.type === 'node');
	assert(tree.nonterminal === 'lab');
	const it = iter(tree.children);
	const identifier = parseLabIdentifier(await next(it));
	const name = parseLabName(await next(it));
	const address = parseLabAddress(await next(it));
	const extra = parseExtra(await next(it));
	return {
		type: 'leaf',
		terminal: 'lab',
		identifier,
		name,
		address,
		extra,
	};
};

const parseDoctor = async (tree) => {
	assert(tree.type === 'node');
	assert(tree.nonterminal === 'doctor');
	const it = iter(tree.children);
	const riziv = parseRiziv(await next(it));
	const name = parseName(await next(it));
	const address = parseDoctorAddress(await next(it));
	const phone = parsePhone(await next(it));
	const extra = parseExtra(await next(it));
	return {
		type: 'leaf',
		terminal: 'doctor',
		riziv,
		name,
		address,
		phone,
		extra,
	};
};

const parsedDatetimeCandidates = function* (string) {
	yield dateParse(string, 'yyyyMMddHHmm', 0);
	yield* parsedDateCandidates(string);
};

const parsedDateCandidates = function* (string) {
	yield dateParse(string, 'yyyyMMdd', 0);
	yield dateParse(string, 'yyMMdd', 0);
	yield new Date(0);
};

const parseDatetime = (tree) => {
	assert(tree.type === 'leaf');
	assert(tree.terminal === 'date');
	assert(tree.lines.length === 1);
	return {
		...tree,
		parsed: {
			datetime: first(
				filter(dateIsValid, parsedDatetimeCandidates(tree.lines[0].contents)),
			),
		},
	};
};

const parseDate = (tree) => {
	assert(tree.type === 'leaf');
	assert(tree.terminal === 'A-birthdate' || tree.terminal === 'A-date');
	assert(tree.lines.length === 1);
	return {
		...tree,
		parsed: {
			date: first(
				filter(dateIsValid, parsedDateCandidates(tree.lines[0].contents)),
			),
		},
	};
};

const parseRequestor = async (tree) => {
	assert(tree.type === 'node');
	assert(tree.nonterminal === 'requestor');
	const it = iter(tree.children);
	const riziv = parseRiziv(await next(it));
	const name = parseName(await next(it));
	return {
		type: 'leaf',
		terminal: 'requestor',
		riziv,
		name,
	};
};

const parseDocumentFooter = (tree) => {
	assert(tree.type === 'leaf');
	assert(tree.terminal === 'footer');
	assert(tree.lines.length === 1);
	return tree;
};

const parseDocument = async (document) => {
	assert(document.type === 'node');
	assert(document.nonterminal === 'document');
	const kind = document.production;
	const it = iter(document.children);
	const requesteeKind = kind === 'lab' ? 'lab' : 'doctor';
	const parseRequestee = kind === 'lab' ? parseLab : parseDoctor;
	const requestee = await parseRequestee(await next(it));
	const date = parseDatetime(await next(it));
	const requestor = await parseRequestor(await next(it));
	const header = {
		kind,
		[requesteeKind]: requestee,
		date,
		requestor,
	};

	const reports = await next(it);

	const parsedReports = await asyncIterableToArray(
		asyncMap(parseReport, reports.children),
	);

	const footer = parseDocumentFooter(await next(it));

	return {
		header,
		reports: parsedReports,
		footer,
	};
};

const parseTree = (tree) => {
	assert(tree.type === 'node');
	assert(tree.nonterminal === 'documents');
	return asyncMap(parseDocument, tree.children);
};

const parse = async (string) => {
	const root = await parseString(string);
	const tree = await next(iter(root.children));
	return parseTree(tree);
};

export default parse;
