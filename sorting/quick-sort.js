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
    quickSort(array, 0, array.length - 1);
    console.log(array);
    return array;
}

/**
 * @param {Array<number>} array
 * @param {number} lo
 * @param {number} hi
 */
function quickSort(array, lo, hi) {
    if (lo >= hi) return;

    let pivotIndex = partition(array, lo, hi);
    quickSort(array, lo, pivotIndex - 1);
    quickSort(array, pivotIndex + 1, hi);
}

/**
 * @param {Array<number>} array
 * @param {number} lo
 * @param {number} hi
 * @returns {number} pivotIndex
 */
function partition(array, lo, hi) {
    // Chọn mốc ngẫu nhiên rồi đưa nó về cuối nhóm, phần còn lại giữ nguyên Lomuto.
    // Lý do: nếu luôn lấy phần tử cuối làm mốc, mảng đã sắp sẵn sẽ có mốc luôn là phần tử
    // lớn nhất → mỗi lượt nhóm chỉ bớt 1 phần tử → O(n²) và đệ quy sâu n tầng
    // (20.000 phần tử đã sắp → "Maximum call stack size exceeded").
    // Mốc ngẫu nhiên thì gần như luôn chia nhóm tương đối đều → O(n log n) với mọi kiểu đầu vào.
    let randIndex = randomIntInclusive(lo, hi);
    swap(array, randIndex, hi);

    let pivot = array[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
        if (array[j] < pivot) {
            swap(array, i, j);
            i++;
        }
    }

    swap(array, i, hi);

    return i;
}

/**
 * 
 * @param {Array<*>} array 
 * @param {number} i 
 * @param {number} j 
 */
function swap(array, i, j) {
    let tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
}

/**
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
function randomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1) + min);
}

module.exports = sort;
