const assert = require('node:assert');

assert.deepStrictEqual(sort([5, 1, 4, 2, 8]), [1, 2, 4, 5, 8]);
assert.deepStrictEqual(sort([3, 5, 1]), [1, 3, 5]);
assert.deepStrictEqual(sort([3, 2, 1]), [1, 2, 3]);
assert.deepStrictEqual(sort([1, 2, 3, 4, 5]), [1, 2, 3, 4, 5]);
assert.deepStrictEqual(sort([]), []);
assert.deepStrictEqual(sort([3, 1, 3, 2, 1]), [1, 1, 2, 3, 3]);

function sort(array) {
    let n = array.length;

    for (let i = 1; i < n; i++) {
        let key = array[i];
        let j;
        for (j = i - 1; j >= 0; j--) {
            if (array[j] > key) {
                array[j + 1] = array[j];
            } else {
                break;
            }
        }
        array[j + 1] = key;
    }

    console.log(array);
    return array
}

module.exports = sort;
