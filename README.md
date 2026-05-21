# 📚 Thư Viện Truyện V3 - Premium AI Novel Reader 🎧

Một ứng dụng web đọc truyện chữ (Light Novel/Web Novel) thế hệ mới được thiết kế với giao diện **Cyberpunk Premium**, tối ưu hóa trải nghiệm đọc và tích hợp hệ thống **Hybrid TTS (Text-To-Speech) kép** thông minh (Microsoft Edge-TTS + Lõi AI NghiTTS chạy Offline cục bộ qua WebAssembly).

---

## 🌟 Tính Năng Nổi Bật (Key Features)

### 1. Trải Nghiệm Đọc Cao Cấp & Tùy Biến Chuyên Sâu (Reading & Layout Customization)
*   **Giao Diện Premium Sleek Dark Mode:** Kết hợp hiệu ứng **Glassmorphism**, tản sáng mượt mà và các hiệu ứng động như mưa sao băng hạt (`Meteors`), làm mờ hình dạng (`ShapeBlur`), vòng tròn ma thuật (`MagicRings`) mang đậm tính thẩm mỹ Gaming/Cyberpunk.
*   **Gooey Liquid Menu Navigation:** Nút menu chất lỏng tự chọn siêu mượt trên Mobile, tối ưu hóa các thao tác chạm vuốt.
*   **Làm Đẹp Lời Thoại (Dialogue Beautifier):** 
    *   Tự động tách và chuyển hóa các câu hội thoại (nằm trong ký tự `“...”`, `"..."`, `«...»`) thành dạng bong bóng chat.
    *   **Preset Hiện Đại (Modern):** Kiểu bong bóng tin nhắn bo viền cong mượt mà của các ứng dụng chat thế hệ mới.
    *   **Preset Cổ Điển (Classic):** Khung viền dạng cổ thư với hoa văn 4 góc mộc mạc và sang trọng.
*   **Khung Hệ Thống (System Log Parser):** Rất thích hợp cho thể loại truyện Hệ thống/Võng du/LitRPG. Nhận diện các dấu ngoặc vuông hệ thống `【...】` và hiển thị nổi bật dưới dạng khung viền ánh kim lấp lánh.
*   **Hệ Thống Phối Màu Nâng Cao:** Cho phép thay đổi màu nền thông qua Color Picker đa dạng dải màu, lưu trữ danh sách các màu vừa chọn gần đây (`Recent Colors`).
*   **Tùy Biến Typography & Khung Chứa:** Tải lên Font chữ tùy chỉnh (`.ttf`, `.otf`), tùy chỉnh khoảng cách dòng, thụt lề đoạn văn, căn lề và độ rộng khung chứa văn bản thoải mái nhất cho mắt.

### 2. Thư Viện Lưu Trữ & Đồng Bộ Hóa (Smart Library)
*   **Hỗ Trợ Định Dạng Đa Dạng:** Tải lên trực tiếp sách định dạng **EPUB** hoặc tệp tin **TXT** phẳng.
*   **Đồng Bộ Đám Mây:** Đồng bộ hóa tiến trình đọc truyện lên **Google Drive** hoặc lưu trữ cục bộ qua Local Storage.
*   **Trình Quản Lý Tiến Độ:** Theo dõi tổng số chương, đếm số từ của từng chương, ghi lại thời gian đọc cuối cùng của từng đầu truyện.

---

## 🎧 Phân Tích Chuyên Sâu Hệ Thống Hybrid TTS (Dual TTS Engine)

Đây là tính năng độc quyền và mạnh mẽ nhất của Thư Viện Truyện V3. Hệ thống kết hợp nhuần nhuyễn hai động cơ giọng đọc hoàn toàn khác nhau để đem lại trải nghiệm nghe không ngắt quãng.

| Tính Năng | 🌐 Microsoft Edge-TTS (Server-Side) | 💻 NghiTTS (Local Offline AI Engine) |
| :--- | :--- | :--- |
| **Cơ Chế Hoạt Động** | Gửi văn bản lên Server Microsoft thông qua API trung gian Express để nhận lại luồng âm thanh nén chất lượng cao. | Nạp mô hình AI Piper/VITS ngay trên trình duyệt và tự sinh âm thanh cục bộ bằng sức mạnh CPU thiết bị. |
| **Danh Sách Giọng** | `Hoài My (Nữ)`, `Nam Minh (Nam)` cực kỳ tự nhiên, ngữ điệu hoàn hảo. | `Ngọc Huyền (Nữ)` giọng đọc trầm ấm độc quyền. |
| **Sự Phụ Thuộc Mạng** | Bắt buộc phải có kết nối Internet liên tục để tải file âm thanh. | **100% Offline** sau lần đầu tải mô hình (Cache qua IndexedDB). |
| **Thiết Bị Phù Hợp** | Hoạt động mượt mà trên tất cả thiết bị (kể cả điện thoại đời cũ). | Yêu cầu thiết bị có cấu hình tốt (PC/Laptop hoặc Android tầm trung trở lên). |

### 🛠️ Các Công Nghệ Độc Đáo Tối Ưu TTS Playback:

#### 1. Hệ Thống Chuyển Câu Siêu Tốc & Không Khe Hở (Seamless Sentence Transition)
Thông thường, khi đọc hết câu A, người nghe sẽ phải đợi 1-2 giây để máy tải và phát tiếp câu B. Thư Viện Truyện V3 đã giải quyết triệt để vấn đề này bằng phương pháp **Seamless Early Trigger**:
*   Sử dụng Web API **`requestAnimationFrame`** để liên tục giám sát chính xác đến từng mili-giây thời gian phát của câu hiện tại.
*   Khi câu đang phát còn lại đúng **0.05 giây** (đối với NghiTTS) hoặc **0.45 giây** (đối với Edge-TTS), hệ thống sẽ chủ động kích hoạt trình phát phát ngay câu tiếp theo.
*   Kết quả thu được là một luồng đọc liền mạch, tự nhiên như người thật đang đọc sách, hoàn toàn không có cảm giác bị khựng lại giữa các câu.

#### 2. Bộ Đệm Nạp Trước Chủ Động (Active Prefetch Buffer)
*   Hệ thống liên tục chạy ngầm bộ đệm tải trước 2 câu tiếp theo (`index + 1` và `index + 2`).
*   Đối với NghiTTS, AI sẽ tranh thủ thời gian người dùng đang nghe câu hiện tại để biên dịch (inference) sẵn câu tiếp theo dưới nền thông qua **Web Worker** riêng biệt (`tts-worker.js`), giải phóng hoàn toàn luồng giao diện (Main UI Thread), giúp trang web không bao giờ bị đơ hay giật lag.

#### 3. Bộ Nhớ Đệm Lưu Trữ Mô Hình (Model Caching)
*   Mô hình AI NghiTTS (`.onnx` nặng ~70MB) và các tệp âm thanh được tải về sẽ tự động được lưu trữ vào bộ nhớ trình duyệt thông qua **IndexedDB** cục bộ (`model-cache.js`).
*   Kể từ lần truy cập thứ hai, mô hình sẽ được nạp tức thì trong vòng chưa đầy **0.5 giây** từ đĩa cứng của bạn mà không tốn một Byte băng thông mạng nào.

#### 4. Hệ Thống Âm Lượng Độc Lập (Decoupled Volume System)
*   Âm lượng được tách biệt hoàn toàn khỏi chu kỳ tạo âm thanh của AI. Người dùng có thể kéo chỉnh âm lượng nóng từ 0% đến 100% ngay khi đang phát mà không làm ngắt quãng, khựng hay tải lại luồng sinh giọng đọc của mô hình.

#### 5. Điều Chỉnh Tốc Độ Siêu Mịn (Fine Playback Rate)
*   Thanh trượt điều chỉnh tốc độ đọc cho phép tinh chỉnh siêu mịn với bước nhảy cực nhỏ **`0.05x`** (ví dụ: `1.00x -> 1.05x -> 1.10x...`), giúp người dùng dễ dàng tìm được tốc độ nghe thoải mái nhất.

#### 6. Bộ Phát Hiện Thiết Bị Thông Minh (OS & Device Detector)
*   Bộ nhớ của các tab Safari trên hệ điều hành **iOS** bị Apple giới hạn vô cùng nghiêm ngặt. Việc nạp mô hình AI trực tiếp trên WebAssembly dễ dẫn đến tình trạng trình duyệt tự động giải phóng RAM và gây crash tab (trắng trang).
*   Hệ thống tích hợp bộ lọc **`deviceDetector.ts`** để tự động kiểm tra: nếu là iOS, tùy chọn giọng đọc "Ngọc Huyền - NghiTTS" sẽ tự động được làm mờ (disable), kèm cảnh báo lý do an toàn.
*   Nếu người dùng lưu cấu hình NghiTTS từ thiết bị khác và đồng bộ sang iOS, hệ thống sẽ tự động phát hiện xung đột cấu hình và an toàn kích hoạt cơ chế tự phục hồi (**Auto-Fallback**) chuyển ngay về giọng đọc Edge-TTS để đảm bảo ứng dụng hoạt động thông suốt không bao giờ bị sập.

---

## 📁 Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
├── public/                       # Thư mục chứa tài nguyên tĩnh công cộng
│   ├── onnx-runtime/             # Bộ máy WebAssembly của ONNX Runtime Web
│   ├── tts-model/                # Chứa mô hình AI cục bộ và tệp cấu hình giọng đọc
│   ├── acronyms.csv              # Từ điển dịch nghĩa các từ viết tắt tiếng Việt
│   └── non-vietnamese-words.csv  # Từ điển phiên âm chuẩn cho các từ tiếng Anh/Nước ngoài
├── src/
│   ├── components/               # Các component React cấu thành giao diện
│   │   ├── ReadViewDesktop.tsx   # Giao diện đọc truyện tối ưu cho máy tính
│   │   ├── ReadViewMobile.tsx    # Giao diện đọc truyện tối ưu cho điện thoại
│   │   ├── TTSPlayerDesktop.tsx  # Trình phát TTS trên máy tính
│   │   ├── TTSPlayerMobile.tsx   # Trình phát TTS trên điện thoại
│   │   ├── DialogueLine.tsx      # Xử lý làm đẹp lời thoại & hệ thống
│   │   └── CustomDropdown.tsx    # Bảng chọn tùy biến hỗ trợ khóa mục thông minh
│   ├── lib/
│   │   └── nghitts/              # Thư viện NghiTTS tích hợp
│   │       └── utils/
│   │           ├── model-cache.js          # Hệ quản lý bộ nhớ đệm mô hình IndexedDB
│   │           └── vietnamese-processor.js # Bộ tiền xử lý chữ Việt (làm sạch, sửa lỗi đọc)
│   ├── utils/
│   │   └── deviceDetector.ts     # Bộ phát hiện thiết bị và hệ điều hành (iOS/Android/PC)
│   ├── workers/
│   │   └── tts-worker.js         # Web Worker chạy ngầm tính toán AI (Inference Engine)
│   ├── App.tsx                   # Điểm khởi đầu trạng thái chính của ứng dụng
│   └── index.css                 # File style chính của hệ thống với các hiệu ứng Cyberpunk
├── server.ts                     # Express Server xử lý API Edge-TTS trong môi trường Dev/Prod
├── package.json                  # Tệp quản lý các thư viện và tập lệnh dự án
└── tsconfig.json                 # Cấu hình dự án TypeScript
```

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Local Installation)

### Yêu Cầu Cấu Hình (Prerequisites):
*   Đã cài đặt sẵn **Node.js** (Phiên bản v18 trở lên được khuyến nghị).

### Các Bước Thực Hiện:

1.  **Tải mã nguồn về máy:**
    ```bash
    git clone <url-repository-cua-ban>
    cd <ten-thu-muc-du-an>
    ```

2.  **Cài đặt các thư viện cần thiết:**
    ```bash
    npm install
    ```

3.  **Thiết lập các biến môi trường:**
    *   Tạo file `.env` tại thư mục gốc của dự án (hoặc sao chép từ `.env.example`).
    *   Điền API Key của bạn (nếu có yêu cầu dịch hoặc dùng các API AI bổ trợ):
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    PORT=3000
    ```

4.  **Khởi động chế độ phát triển (Development Mode):**
    ```bash
    npm run dev
    ```
    *   Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000) để trải nghiệm ứng dụng.

---

## 🚀 Hướng Dẫn Đóng Gói & Deploy Lên Netlify

Để chuẩn bị đưa trang web này lên chạy công khai trên **Netlify**, bạn thực hiện theo các bước tối ưu sau đây:

### ⚠️ Lưu ý Cực Kỳ Quan Trọng về Netlify:
*   Netlify là môi trường **Serverless** tĩnh. Điều này đồng nghĩa với việc Server Express (`server.ts`) sẽ **không hoạt động** trên Netlify.
*   **Hệ quả:** Tính năng Edge-TTS (cần Server API `/api/tts`) sẽ không hoạt động trên Netlify trừ khi bạn cấu hình sang *Netlify Functions*. 
*   **Tuy nhiên:** Động cơ **NghiTTS chạy hoàn toàn Client-Side** sẽ hoạt động vô cùng xuất sắc và mượt mà mà không gặp bất kỳ giới hạn nào!

### Các Bước Thực Hiện Deploy Thủ Công (Drag & Drop):

1.  **Tiến hành Build tối ưu hóa ứng dụng:**
    Chạy lệnh đóng gói sản phẩm của Vite tại thư mục gốc:
    ```bash
    npm run build
    ```
2.  **Nhận kết quả:**
    Sau khi chạy xong, Vite sẽ tạo ra một thư mục sạch sẽ tên là **`dist`** chứa toàn bộ các file tĩnh đã được nén và tối ưu dung lượng cực nhỏ.
3.  **Tải lên Netlify:**
    *   Đăng nhập vào tài khoản Netlify của bạn.
    *   Kéo thả trực tiếp duy nhất thư mục **`dist`** này vào khu vực Deploy của Netlify.
    *   Trang web của bạn sẽ hoạt động công khai chỉ sau vài giây!

### Hướng Dẫn Push Lên Github để Tự Động Build:
Nếu bạn liên kết Github với Netlify để tự động cập nhật web mỗi khi đẩy code mới, hãy lưu ý **không được bỏ** file sau:
*   **`phonemizer-1.2.2.tgz`**: Đây là gói thư viện cài đặt offline cục bộ được khai báo trong `package.json`. File này **bắt buộc** phải tồn tại song song với `package.json` khi đẩy lên Github để trình quản lý Netlify có thể tìm thấy dữ liệu và cài đặt thành công.

---

Chúc bạn có những trải nghiệm đọc và nghe truyện tuyệt vời nhất cùng với **Thư Viện Truyện V3**! 🚀
