import mergeWith from 'lodash.mergewith/index.js';

const customizer = (objectValue, srcValue) => {
	if (Array.isArray(objectValue)) {
		return objectValue.concat(srcValue);
	}
};

const merge = (parts) => mergeWith({}, ...Array.from(parts), customizer);

export default merge;
