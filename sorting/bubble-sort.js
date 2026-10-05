sort([5, 1, 4, 2, 8]);
sort([3, 5, 1]);
sort([3, 2, 1]);
sort([1, 2, 3, 4, 5]);

function sort(array) {
    let n = array.length;

    for (let i = n - 1; i > 0; i--) {
        let swapped = false;
        for (let j = 0; j < i; j++) {
            if (array[j] > array[j + 1]) {
                let tmp = array[j + 1];
                array[j + 1] = array[j];
                array[j] = tmp;
                swapped = true;
            }
        }
        if (!swapped) {
            break;
        }
    }

    console.log(array);
    return array
}

module.exports = sort;
