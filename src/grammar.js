import {grammar} from '@formal-language/grammar';

const root = 'root';
const start = '0';
const eof = '$';
const productions = {
	root: [['&documents', '=$']],
	documents: {
		add: ['&document', '&documents'],
		end: [],
	},
	document: {
		report: ['&doctor', '&date', '&requestor', '&A*', '&footer'],
		lab: ['&lab', '&date', '&requestor', '&A*', '&footer'],
	},
	doctor: [
		[
			'&doctor-nihdi',
			'&doctor-name',
			'&doctor-address',
			'&doctor-phone',
			'&doctor-extra',
		],
	],
	'doctor-nihdi': [['&nihdi', '&newline']],
	'doctor-name': [['&free-line']],
	'doctor-address': [['&free-line', '&free-line']],
	'doctor-phone': [['&free-line']],
	'doctor-extra': [['&free-line']],
	lab: [['&lab-identifier', '&lab-name', '&lab-address', '&lab-extra']],
	'lab-identifier': [['&medidoc-lab-id', '&newline']],
	'lab-name': [['&free-line']],
	'lab-address': [['&free-line', '&free-line']],
	'lab-extra': [['&free-line', '&free-line']],
	nihdi: [
		[
			'=digit',
			'&nihdi-sep',
			'=digit',
			'=digit',
			'=digit',
			'=digit',
			'=digit',
			'&nihdi-sep',
			'=digit',
			'=digit',
			'&nihdi-sep',
			'=digit',
			'=digit',
			'=digit',
		],
	],
	'nihdi-sep': [[], ['=/'], ['=.']], // NOTE Should not be optional.
	'medidoc-lab-id': [['=text', '=digit', '=digit', '&serieno']],
	serieno: [['=digit'], ['=text']], // NOTE Should be only digit.
	date: [['&free-line']],
	requestor: [['&requestor-nihdi', '&requestor-name']],
	'requestor-nihdi': [['&nihdi', '&newline']],
	'requestor-name': [['&free-line']],
	'A*': {
		add: ['&A', '&A*'],
		end: [],
	},
	A: [
		[
			'&#A',
			'&A-name',
			'&A-birthdate',
			'&A-sex',
			'&A-date',
			'&A-reference',
			'&A-code',
			'&A-extra',
			'&R*',
			'&#A/',
		],
	],
	'#A': [['=#A', '&newline']],
	'A-name': [['&free-line']],
	'A-birthdate': [['&free-line']],
	'A-sex': [['&free-line']],
	'A-date': [['&free-line']],
	'A-reference': [['&free-line']],
	'A-code': [['&free-line']],
	'A-extra': [['&free-lines']],
	'#A/': [['=#A/', '&newline']],
	'free-line': [['&free-text-or-empty', '&newline']],
	footer: [['=#/', '&newline']],
	'R*': {
		add: ['&R', '&R*'],
		end: [],
	},
	R: [['&#R', '&R-title', '&R-body', '&#R/']],
	'#R': [['=#R', '&newline']],
	'#R/': [['=#R/', '&newline']],
	'R-title': {
		free: ['=!', '&free-line'],
		code: ['&not-a-bang', '&free-line'],
		empty: ['&newline'],
	},
	'R-body': [['&free-lines']],
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
		'.': ['=.'],
		digit: ['=digit'],
	},
	any: {
		text: ['=text'],
		'/': ['=/'],
		'.': ['=.'],
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
