import assert from 'node:assert';

import Position from './Position.js';

const FIRST_LINE = 1;
const FIRST_POSITION = 1;

const CR = '\r';
const LF = '\n';

async function* _tokens(tape) {
	let line = FIRST_LINE;
	let position = FIRST_POSITION;

	let buffer = '';

	const flush = function* () {
		if (buffer !== '') {
			yield ['text', buffer, new Position(line, position)];
			position += buffer.length;
			buffer = '';
		}
	};

	while (true) {
		const c = await tape.read();

		if (c === tape.eof) break;

		if (c === '#' && position === FIRST_POSITION) {
			assert(buffer === '');
			let l = c;
			let token = '';
			while (l !== tape.eof && l !== CR && l !== LF) {
				token += l;
				++position;
				l = await tape.read();
			}

			tape.unread(l);
			const closing = token.length >= 3 && token[2] === '/';
			const kind = token.slice(0, 2) + (closing ? '/' : '');
			yield [kind, token, new Position(line, FIRST_POSITION)];
			continue;
		}

		switch (c) {
			case '0':
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9': {
				yield* flush();
				yield ['digit', c, new Position(line, position)];
				++position;
				break;
			}

			case CR:
			case '/':
			case '.':
			case '!': {
				yield* flush();
				yield [c, c, new Position(line, position)];
				++position;
				break;
			}

			case LF: {
				yield* flush();
				yield [c, c, new Position(line, position)];
				++line;
				position = FIRST_POSITION;
				break;
			}

			default: {
				buffer += c;
				break;
			}
		}
	}

	yield* flush();
}

export default async function* tokens(tape) {
	for await (const [terminal, buffer, position] of _tokens(tape)) {
		yield {
			type: 'leaf',
			terminal,
			buffer,
			position,
		};
	}
}
