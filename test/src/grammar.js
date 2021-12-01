import test from 'ava';

import {ll1} from '@formal-language/grammar';

import {grammar} from '../../src/index.js';

test('Grammar is LL1', (t) => {
	t.true(ll1.is(grammar));
});
