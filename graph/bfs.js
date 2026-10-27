const assert = require('node:assert');

// S = xuất phát, E = đích, # = tường. Đường đi là danh sách ô [hàng, cột] từ S tới E (tính cả S và E).

// Đường ngắn nhất duy nhất: 7 bước.
assert.deepStrictEqual(findPath([
    'S..#.',
    '.#.#.',
    '.#...',
    '...#E',
]), [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 3], [2, 4], [3, 4]]);

// S nằm ngay cạnh E.
assert.deepStrictEqual(findPath(['SE']), [[0, 0], [0, 1]]);

// Không có đường: E bị tường bao kín.
assert.deepStrictEqual(findPath([
    'S.#.',
    '..#E',
    '..##',
]), []);

// Có nhiều đường cùng ngắn nhất → chỉ kiểm tra độ dài (4 bước = 5 ô), vì đường cụ thể tùy thứ tự duyệt hàng xóm.
assert.strictEqual(findPath([
    'S..',
    '...',
    '..E',
]).length, 5);

// Phải đi vòng xuống dưới để qua tường: 7 bước = 8 ô.
assert.strictEqual(findPath([
    'S.#E',
    '..#.',
    '....',
]).length, 8);

/**
 * @param {Array<string>} grid
 * @returns {Array<[number, number]>} đường đi từ S tới E, hoặc [] nếu không có đường
 */
function findPath(grid) {

    let queue = [];
    let cell = {};
    let visited = grid.map(row => Array(row.length)).fill(false);

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {

        }
    }

}

module.exports = findPath;
