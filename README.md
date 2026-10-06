# Ôn thuật toán

Mỗi thuật toán: ý tưởng 1 câu + câu tự kiểm tra (đáp án giấu trong mục "Đáp án") + bài LeetCode luyện thêm.
Thứ tự từ dễ đến khó.
Cài đặt bằng JavaScript, chạy bằng Node 24, debug trong VS Code (F5 + breakpoint).

## Sorting

Vì sao O(n²) và O(n log n) khác nhau, log là gì: [đọc trước](sorting/complexity.md).

### 1. Bubble Sort — [chi tiết](sorting/bubble-sort.md)
- [ ] **Ý tưởng:** Duyệt mảng nhiều lượt, đổi chỗ hai phần tử kề nhau nếu sai thứ tự; sau mỗi lượt phần tử lớn nhất "nổi" về cuối.
- [ ] Độ phức tạp best / avg / worst?
- [ ] Stable không? In-place không?
- [ ] Làm sao để best case đạt O(n)?

<details><summary>Đáp án</summary>

- O(n) / O(n²) / O(n²); bộ nhớ O(1).
- Stable: có (chỉ đổi khi `a[i] > a[i+1]`). In-place: có.
- Dùng cờ `swapped`: một lượt không đổi chỗ lần nào → mảng đã sắp, dừng.
</details>

LeetCode: 283 (Move Zeroes).

### 2. Selection Sort — [chi tiết](sorting/selection-sort.md)
- [ ] **Ý tưởng:** Mỗi lượt tìm phần tử nhỏ nhất trong phần chưa sắp rồi đổi nó về đầu phần đó.
- [ ] Độ phức tạp best / avg / worst?
- [ ] Stable không? In-place không?
- [ ] Điểm mạnh so với Bubble/Insertion?

<details><summary>Đáp án</summary>

- O(n²) / O(n²) / O(n²) — luôn phải quét hết để tìm min; bộ nhớ O(1).
- Stable: không (phép đổi xa có thể nhảy qua phần tử bằng nó). In-place: có.
- Số lần swap tối đa n−1 — hợp khi thao tác ghi tốn kém.
</details>

LeetCode: 912 (Sort an Array — tự cài để luyện).

### 3. Insertion Sort — [chi tiết](sorting/insertion-sort.md)
- [ ] **Ý tưởng:** Lấy từng phần tử, dịch các phần tử lớn hơn trong phần đã sắp sang phải rồi chèn nó vào đúng chỗ (như xếp bài trên tay).
- [ ] Độ phức tạp best / avg / worst? Best case xảy ra khi nào?
- [ ] Stable không? In-place không?
- [ ] Vì sao thực tế hay dùng cho mảng nhỏ / gần sắp?

<details><summary>Đáp án</summary>

- O(n) / O(n²) / O(n²); bộ nhớ O(1). Best khi mảng đã sắp sẵn, worst khi sắp ngược.
- Stable: có. In-place: có.
- Chi phí tỉ lệ với số cặp nghịch thế, hằng số nhỏ — nên các thư viện (Timsort, introsort) chuyển sang insertion cho đoạn nhỏ.
</details>

LeetCode: 147 (Insertion Sort List).

### 4. Merge Sort — [chi tiết](sorting/merge-sort.md)
- [ ] **Ý tưởng:** Chia đôi mảng, sắp từng nửa đệ quy, rồi trộn hai nửa đã sắp thành một.
- [ ] Độ phức tạp best / avg / worst?
- [ ] Stable không? In-place không? Tốn bao nhiêu bộ nhớ phụ?
- [ ] Bước trộn (merge) hoạt động thế nào và tốn bao nhiêu?

<details><summary>Đáp án</summary>

- O(n log n) cả ba trường hợp (log n tầng, mỗi tầng trộn O(n)).
- Stable: có (khi bằng nhau lấy bên trái trước). In-place: không — cần O(n) mảng phụ.
- Hai con trỏ ở đầu hai nửa, mỗi bước lấy phần tử nhỏ hơn đưa vào kết quả; O(n).
</details>

LeetCode: 88 (Merge Sorted Array), 21 (Merge Two Sorted Lists).

### 5. Quick Sort — [chi tiết](sorting/quick-sort.md)
- [ ] **Ý tưởng:** Chọn một pivot, phân hoạch để bên trái ≤ pivot và bên phải > pivot, rồi đệ quy hai bên.
- [ ] Độ phức tạp best / avg / worst? Worst xảy ra khi nào, tránh thế nào?
- [ ] Stable không? In-place không?
- [ ] Phân biệt Lomuto và Hoare partition?

<details><summary>Đáp án</summary>

- O(n log n) / O(n log n) / O(n²). Worst khi pivot luôn là min/max (vd mảng đã sắp + chọn phần tử đầu/cuối) → chọn pivot ngẫu nhiên hoặc median-of-three.
- Stable: không. In-place: có (chỉ tốn O(log n) stack đệ quy trung bình).
- Lomuto: pivot ở cuối, một con trỏ đánh dấu vùng ≤ pivot, dễ viết. Hoare: hai con trỏ đi từ hai đầu vào giữa, ít swap hơn.
</details>

LeetCode: 75 (Sort Colors), 215 (Kth Largest Element — quickselect).

## Graph (trên lưới có tường)

### 6. BFS (Breadth-First Search)
- [ ] **Ý tưởng:** Loang từ ô xuất phát ra theo từng lớp — thăm hết các ô cách 1 bước, rồi 2 bước, rồi 3 bước…
- [ ] Frontier dùng cấu trúc dữ liệu gì?
- [ ] Có tìm được đường ngắn nhất không? Vì sao?
- [ ] Độ phức tạp? Đánh dấu "đã thăm" lúc nào để không trùng?

<details><summary>Đáp án</summary>

- Queue (FIFO).
- Có, nếu mọi bước đi có cùng chi phí: ô được lấy ra theo thứ tự khoảng cách tăng dần, nên lần đầu chạm đích chính là ngắn nhất.
- O(V + E), trên lưới là O(số ô). Đánh dấu ngay khi đưa vào queue (không đợi lúc lấy ra).
</details>

LeetCode: 200 (Number of Islands), 1091 (Shortest Path in Binary Matrix).

### 7. DFS (Depth-First Search)
- [ ] **Ý tưởng:** Đi thẳng một hướng sâu nhất có thể, gặp ngõ cụt thì quay lui (backtrack) thử hướng khác.
- [ ] Frontier dùng cấu trúc dữ liệu gì?
- [ ] Có tìm được đường ngắn nhất không? Vì sao?
- [ ] Độ phức tạp? Dùng DFS khi nào?

<details><summary>Đáp án</summary>

- Stack (LIFO) — tường minh, hoặc ngầm qua đệ quy.
- Không: nó trả về đường đầu tiên tìm thấy, thường ngoằn ngoèo, phụ thuộc thứ tự duyệt hướng.
- O(V + E). Hợp cho: kiểm tra có đường hay không, đếm vùng liên thông, sinh mê cung, backtracking.
</details>

LeetCode: 200 (Number of Islands — giải lại bằng DFS), 79 (Word Search).

### 8. Dijkstra
- [ ] **Ý tưởng:** Như BFS nhưng ô mỗi bước có chi phí khác nhau; luôn mở rộng ô có tổng chi phí từ nguồn nhỏ nhất trước.
- [ ] Frontier dùng cấu trúc dữ liệu gì?
- [ ] Có tìm được đường ngắn nhất không? Vì sao? Điều kiện gì?
- [ ] Độ phức tạp? Khác BFS ở đâu?

<details><summary>Đáp án</summary>

- Priority queue (min-heap) theo `dist[u]`.
- Có, với điều kiện trọng số không âm: khi một ô được lấy ra khỏi heap, không còn đường nào rẻ hơn tới nó (mọi đường khác đi qua ô có dist ≥ dist hiện tại).
- O((V + E) log V) với binary heap. Nếu mọi trọng số bằng nhau, Dijkstra suy biến thành BFS.
</details>

LeetCode: 743 (Network Delay Time), 1631 (Path With Minimum Effort).

### 9. A* (A-star)
- [ ] **Ý tưởng:** Dijkstra có "la bàn": ưu tiên ô có `f = g + h` nhỏ nhất, trong đó `g` là chi phí đã đi, `h` là ước lượng còn lại tới đích.
- [ ] Frontier dùng cấu trúc dữ liệu gì?
- [ ] Có tìm được đường ngắn nhất không? Vì sao? Điều kiện gì với `h`?
- [ ] Heuristic nào cho lưới 4 hướng / 8 hướng? `h = 0` thì thành gì?

<details><summary>Đáp án</summary>

- Priority queue theo `f = g + h`.
- Có, nếu `h` admissible (không bao giờ ước lượng quá chi phí thật). Nhờ `h` hướng về đích nên mở ít ô hơn Dijkstra.
- 4 hướng: Manhattan `|dx| + |dy|`. 8 hướng: Chebyshev / Octile. `h = 0` → chính là Dijkstra.
</details>

LeetCode: 1091 (Shortest Path in Binary Matrix — giải lại bằng A*), 773 (Sliding Puzzle).
