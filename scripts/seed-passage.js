// Simple seeder script to create a composite passage with embedded questions
// Usage:
//   BASE_URL=http://localhost:3000 TOKEN=YOUR_JWT node scripts/seed-passage.js

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000/api';
const TOKEN = process.env.TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZDJiMmE0M2U1OTg3ZGNhYzJkZmUxYSIsInJvbGUiOiJ0ZWFjaGVyIiwiaWF0IjoxNzU4NzI5ODM1LCJleHAiOjE3NTkzMzQ2MzV9.RDGHKMX2HzA7Lx591jwZpJvZudZImxfbt05TbTazzgE';

if (!TOKEN) {
    console.warn('Warning: TOKEN is empty. If your API requires auth, set TOKEN env var.');
}

const payload = {
    title: 'Passage Tổng Hợp Dạng Câu Hỏi',
    content: 'Bài đọc về các chủ đề tổng hợp: môi trường, lịch sử, công nghệ, và sức khỏe.',
    type: 'reading',
    sections: [
        {
            name: 'Câu 1–5: True/False/Not Given',
            instructions: 'Đánh dấu Yes/No/Not Given theo nội dung bài.',
            range: { start: 1, end: 5 },
            questions: [
                { number: 1, type: 'true-false-not-given', prompt: 'Khí hậu ảnh hưởng trực tiếp đến hành vi di cư của động vật.', correctAnswer: 'yes', points: 1 },
                { number: 2, type: 'true-false-not-given', prompt: 'Bài đọc khẳng định rằng mọi loài đều thích nghi với biến đổi khí hậu.', correctAnswer: 'no', points: 1 },
                { number: 3, type: 'true-false-not-given', prompt: 'Có số liệu về mức tăng nhiệt độ cụ thể.', correctAnswer: 'not given', points: 1 }
            ]
        },
        {
            name: 'Câu 6–8: Matching Information',
            instructions: 'Nối thông tin với đoạn văn (A–C).',
            range: { start: 6, end: 8 },
            questions: [
                { number: 6, type: 'matching-information', paragraphRef: 'A', prompt: 'Nêu tác động của đô thị hóa lên đa dạng sinh học.', correctAnswer: 'A', points: 1 },
                { number: 7, type: 'matching-information', paragraphRef: 'B', prompt: 'Đưa ví dụ về giải pháp công nghệ xanh.', correctAnswer: 'B', points: 1 }
            ]
        },
        {
            name: 'Câu 9–11: Matching Headings',
            instructions: 'Nối tiêu đề phù hợp với từng đoạn (I–III).',
            range: { start: 9, end: 11 },
            questions: [
                { number: 9, type: 'matching-headings', prompt: 'Đoạn nói về lịch sử phát triển năng lượng tái tạo.', correctAnswer: 'II', points: 1 },
                { number: 10, type: 'matching-headings', prompt: 'Đoạn nói về thách thức triển khai trên diện rộng.', correctAnswer: 'III', points: 1 }
            ]
        },
        {
            name: 'Câu 12–14: Multiple Choice',
            instructions: 'Chọn đáp án đúng (A–D).',
            range: { start: 12, end: 14 },
            questions: [
                {
                    number: 12,
                    type: 'multiple-choice',
                    prompt: 'Yếu tố nào được nhấn mạnh như giải pháp bền vững?',
                    options: ['A. Nhiên liệu hóa thạch', 'B. Tái chế và tái sử dụng', 'C. Mở rộng khai thác rừng', 'D. Tăng tiêu thụ'],
                    correctAnswer: 'B',
                    points: 1
                }
            ]
        },
        {
            name: 'Câu 15–17: Fill in the Blank',
            instructions: 'Điền 1 từ/ cụm từ vào chỗ trống.',
            range: { start: 15, end: 17 },
            questions: [
                { number: 15, type: 'fill-blank', prompt: 'Công nghệ pin giúp lưu trữ _______ hiệu quả hơn.', correctAnswer: 'năng lượng', points: 1 }
            ]
        },
        {
            name: 'Câu 18–20: Sentence Completion',
            instructions: 'Hoàn thành câu theo nội dung bài.',
            range: { start: 18, end: 20 },
            questions: [
                { number: 18, type: 'sentence-completion', prompt: 'Sự hợp tác quốc tế là cần thiết để _______.', correctAnswer: 'giải quyết biến đổi khí hậu', points: 1 }
            ]
        },
        {
            name: 'Câu 21–23: Summary Completion',
            instructions: 'Hoàn thành tóm tắt bằng cách điền từ.',
            range: { start: 21, end: 23 },
            questions: [
                { number: 21, type: 'summary-completion', prompt: 'Tóm tắt nêu bật vai trò của _______ trong bảo tồn.', correctAnswer: 'giáo dục', points: 1 }
            ]
        },
        {
            name: 'Câu 24–25: Diagram Completion',
            instructions: 'Điền nhãn còn thiếu vào sơ đồ.',
            range: { start: 24, end: 25 },
            questions: [
                { number: 24, type: 'diagram-completion', prompt: 'Điền nhãn còn thiếu trong chu trình nước: _______.', correctAnswer: 'bốc hơi', points: 1 }
            ]
        },
        {
            name: 'Câu 26–27: Yes/No/Not Given',
            instructions: 'Đánh dấu Yes/No/Not Given.',
            range: { start: 26, end: 27 },
            questions: [
                { number: 26, type: 'yes-no-not-given', prompt: 'Tác giả đồng tình rằng công nghệ là giải pháp duy nhất.', correctAnswer: 'no', points: 1 },
                { number: 27, type: 'yes-no-not-given', prompt: 'Bài viết đề cập chi phí kinh tế cụ thể của ô nhiễm.', correctAnswer: 'not given', points: 1 }
            ]
        },
        {
            name: 'Câu 28–30: Short Answer',
            instructions: 'Trả lời ngắn gọn (tối đa 3 từ).',
            range: { start: 28, end: 30 },
            questions: [
                { number: 28, type: 'short-answer', prompt: 'Một lợi ích chính của trồng rừng là gì?', correctAnswer: 'hấp thụ carbon', points: 1 }
            ]
        }
    ]
};

(async () => {
    const res = await fetch(`${BASE_URL}/passages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {})
        },
        body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    console.log('Status:', res.status);
    console.dir(data, { depth: null });
    if (!res.ok) process.exit(1);
})();


