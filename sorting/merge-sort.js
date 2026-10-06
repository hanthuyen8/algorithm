const assert = require('node:assert');

assert.deepStrictEqual(sort([5, 1, 4, 2, 8]), [1, 2, 4, 5, 8]);
assert.deepStrictEqual(sort([3, 5, 1]), [1, 3, 5]);
assert.deepStrictEqual(sort([3, 2, 1]), [1, 2, 3]);
assert.deepStrictEqual(sort([1, 2, 3, 4, 5]), [1, 2, 3, 4, 5]);
assert.deepStrictEqual(sort([]), []);
assert.deepStrictEqual(sort([3, 1, 3, 2, 1]), [1, 1, 2, 3, 3]);

/**
 * @param {Array<number>} array
 */
function sort(array) {
    let sorted = mergeSort(array);

    console.log(sorted);
    return sorted;
}

/**
 * @param {Array<number>} array
 */
function mergeSort(array) {
    let n = array.length;
    if (n <= 1) {
        return array;
    }
    let mid = Math.floor(n / 2);
    let left = array.slice(0, mid);
    let right = array.slice(mid, n);
    let leftArray = mergeSort(left);
    let rightArray = mergeSort(right);
    let sorted = merge(leftArray, rightArray);
    return sorted;
}

/**
 * @param {Array<number>} left
 * @param {Array<number>} right
 */
function merge(left, right) {
    let result = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) {
            result.push(left[i]);
            i++;
        } else {
            result.push(right[j]);
            j++;
        }
    }

    result.push(...left.slice(i));
    result.push(...right.slice(j));

    return result;
}

module.exports = sort;
