import {grammar} from '@formal-language/grammar';

const root = 'root';
const start = 'start';
const eof = '$';
const productions = {
	root: {
		start: ['&documents', '=$'],
	},
	documents: {
		add: ['&document', '&documents'],
		end: [],
	},
	document: {
		report: ['&doctor', '&date', '&requestor', '&A*', '&footer'],
		lab: ['&lab', '&date', '&requestor', '&A*', '&footer'],
	},
	doctor: {
		doctor: [
			'&riziv',
			'&newline',
			'&free-text-or-empty',
			'&newline',
			'&free-text-or-empty',
			'&newline',
			'&free-text-or-empty',
			'&newline',
			'&free-text-or-empty',
			'&newline',
			'&free-text-or-empty',
			'&newline',
		],
	},
	lab: {
		lab: [
			'&medidoc-lab-id',
			'&newline',
			'&free-text-or-empty',
			'&newline',
			'&free-text-or-empty',
			'&newline',
			'&free-text-or-empty',
			'&newline',
			'&free-text-or-empty',
			'&newline',
			'&free-text-or-empty',
			'&newline',
		],
	},
	riziv: {
		riziv: ['&digits', '=/', '&digits', '=/', '&digits', '=/', '&digits'],
	},
	'medidoc-lab-id': {
		id: ['=text', '=digit', '=digit', '=digit'],
	},
	date: {
		date: ['&free-text-or-empty', '&newline'],
	},
	requestor: {
		requestor: ['&riziv', '&newline', '&free-text-or-empty', '&newline'],
	},
	'A*': {
		add: ['&A', '&A*'],
		end: [],
	},
	A: {
		A: [
			'&#A',
			'&free-line',
			'&free-line',
			'&free-line',
			'&free-line',
			'&free-line',
			'&free-line',
			'&extra-free-lines',
			'&R*',
			'&#A/',
		],
	},
	'#A': {
		'#A': ['=#A', '&newline'],
	},
	'#A/': {
		'#A/': ['=#A/', '&newline'],
	},
	'free-line': {
		'free-line': ['&free-text-or-empty', '&newline'],
	},
	footer: {
		footer: ['=#/', '&newline'],
	},
	'R*': {
		add: ['&R', '&R*'],
		end: [],
	},
	R: {
		R: ['&#R', '&title', '&free-lines', '&#R/'],
	},
	'#R': {
		'#R': ['=#R', '&newline'],
	},
	'#R/': {
		'#R/': ['=#R/', '&newline'],
	},
	title: {
		free: ['=!', '&free-text-or-empty', '&newline'],
		code: ['&not-a-bang', '&free-text-or-empty', '&newline'],
	},
	'free-text': {
		'start-any': ['&any', '&free-text-end'],
	},
	'free-text-end': {
		'add-any': ['&any', '&free-text-end'],
		end: [],
	},
	'free-text-or-empty': {
		'free-text': ['&free-text'],
		empty: [],
	},
	'not-a-bang': {
		text: ['=text'],
		'/': ['=/'],
		digit: ['=digit'],
	},
	any: {
		text: ['=text'],
		'/': ['=/'],
		'!': ['=!'],
		digit: ['=digit'],
	},
	newline: {
		crlf: ['=\r', '=\n'],
		lf: ['=\n'],
	},
	digits: {
		start: ['=digit', '&digits-end'],
	},
	'digits-end': {
		add: ['=digit', '&digits-end'],
		end: [],
	},
	'free-lines': {
		add: ['&free-line', '&free-lines'],
		end: [],
	},
};

export default grammar.from({root, start, eof, productions});
