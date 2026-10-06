# O(n²) và O(n log n) khác nhau thế nào

Tóm một câu: **O(n²) "nhìn gần", O(n log n) "chia để trị".**

## log là gì (không cần toán)

**log₂ n = chia đôi n bao nhiêu lần thì còn 1.**

```
8 → 4 → 2 → 1          chia 3 lần   → log₂ 8 = 3
16 → 8 → 4 → 2 → 1     chia 4 lần   → log₂ 16 = 4
1.000 → 500 → … → 1    chia ~10 lần → log₂ 1.000 ≈ 10
1.000.000 → … → 1      chia ~20 lần → log₂ 1.000.000 ≈ 20
```

Nhìn ngược lại cũng được: log₂ n là **số lần nhân đôi từ 1 để đạt tới n** (1 → 2 → 4 → 8: 3 lần).

Điều cần nhớ: **log tăng cực chậm.** n tăng từ một nghìn lên một triệu (gấp 1000 lần) mà log₂ n chỉ tăng từ 10 lên 20. Trong lập trình, cứ thấy "chia đôi liên tục" (binary search, merge sort, cây cân bằng) là có log.

## Nhóm O(n²): Bubble, Selection, Insertion

- Mỗi lượt chỉ đưa **một phần tử** về đúng chỗ; mỗi bước chỉ so/di chuyển với hàng xóm hoặc một vị trí.
- n lượt × mỗi lượt quét ~n phần tử = **n × n**.
- Bubble và Insertion di chuyển phần tử **từng ô một**: phần tử ở sai chỗ xa phải đi qua từng ô. Mảng sắp ngược có ~n²/2 cặp sai thứ tự, mỗi lần đổi/dịch chỉ sửa đúng 1 cặp.

## Nhóm O(n log n): Merge, Quick

- **Chia đôi bài toán** liên tục: n → n/2 → n/4 → … → 1, tức là **log₂ n tầng** (đúng định nghĩa log ở trên).
- Mỗi tầng tổng công việc chỉ **~n** (Merge: trộn lại; Quick: phân hoạch).
- **n việc mỗi tầng × log₂ n tầng = n log n.**
- Phần tử có thể **nhảy xa** trong một bước → một thao tác sửa được nhiều chỗ sai cùng lúc.

```
Merge Sort với 8 phần tử:
[5 1 4 2 8 3 7 6]           ← tầng 0: trộn 8 phần tử
[5 1 4 2]  [8 3 7 6]        ← tầng 1: trộn 4 + 4
[5 1] [4 2] [8 3] [7 6]     ← tầng 2: trộn 2+2+2+2
3 tầng (log₂ 8) × 8 phần tử mỗi tầng ≈ 24 bước   (O(n²) ≈ 64)
```

## Chênh lệch lớn cỡ nào

| n | n² | n log₂ n |
|---|---|---|
| 10 | 100 | ~33 |
| 1.000 | 1.000.000 | ~10.000 |
| 1.000.000 | 10¹² (hàng chục phút trở lên) | ~2 × 10⁷ (vài chục ms) |

10 phần tử thì gần như ngang nhau; một triệu phần tử thì O(n²) không dùng được.

## Ý hay để nói khi phỏng vấn

O(n log n) là **giới hạn tốt nhất** cho mọi thuật toán sort **dựa trên so sánh**:
- n phần tử có n! cách sắp xếp, thuật toán phải phân biệt được tất cả.
- Mỗi phép so sánh chỉ trả lời có/không → loại được tối đa một nửa số khả năng.
- Chia đôi n! cho đến khi còn 1 cần log₂(n!) ≈ n log n lần → cần ít nhất ngần ấy phép so sánh. Merge Sort đã chạm mức này.

## Có khó hơn không?

Khó hơn chút, chủ yếu vì **đệ quy**, còn ý tưởng không rắc rối:
- **Merge Sort:** "chia đôi, sắp từng nửa, trộn lại". Phần mới là trộn hai mảng đã sắp — khá trực quan (LeetCode 88, 21).
- **Quick Sort:** "chọn pivot, nhỏ sang trái, lớn sang phải, làm lại cho từng bên". Phần dễ sai là partition (chỉ số lệch một).

Đổi lại có những đánh đổi nhóm O(n²) không có:
- **Merge Sort** cần thêm O(n) bộ nhớ — không in-place.
- **Quick Sort** có worst case O(n²) nếu chọn pivot kém, và không stable.
- Với mảng nhỏ, cả hai **chậm hơn** Insertion Sort vì tốn công đệ quy → Timsort (`sort` của JS) dùng Merge cho mảng lớn, Insertion cho đoạn nhỏ.
