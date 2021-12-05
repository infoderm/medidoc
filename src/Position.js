export default class Position {
	constructor(line, column) {
		this.line = line;
		this.column = column;
	}

	toString() {
		return `${this.line}:${this.column}`;
	}
}
