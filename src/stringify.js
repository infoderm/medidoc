const stringify = (document) => {
	return document.lines
		.map(({contents, newline}) => contents + newline)
		.join('');
};

export default stringify;
