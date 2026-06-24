// File xử lý tính toán hóa đơn, hiện QR VietQR và gửi đơn đặt bàn lên DB
const token = localStorage.getItem("token");
let bookingInfo = JSON.parse(localStorage.getItem("checkout_booking")) || null;
let dishesInfo = JSON.parse(localStorage.getItem("checkout_dishes")) || {};
let rawDishPrice = parseFloat(localStorage.getItem("checkout_total_dish_price")) || 0;

// CẤU HÌNH TÀI KHOẢN NGÂN HÀNG CỦA BẠN TẠI ĐÂY
const BANK_ID = "mbbank";
const ACCOUNT_NO = "0123456789";
const ACCOUNT_NAME = "NGUYEN VAN A";
const SO_TIEN_COC_CO_DINH = 50000;

document.addEventListener("DOMContentLoaded", function () {
    if (!token || !bookingInfo) {
        alert("Dữ liệu trống hoặc phiên làm việc của bạn đã hết hạn!");
        window.location.href = "/order.html";
        return;
    }
    renderCheckoutInvoice();
    fetch("/api/MonAn")
        .then(res => res.json())
        .then(data => { window.rawDishesList = data; })
        .catch(err => console.error(err));
});

// Hàm tính toán và hiển thị hóa đơn lên giao diện
function renderCheckoutInvoice() {
    const dateParts = bookingInfo.ngayDen.split("-");
    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    document.getElementById("lblBookingSchedule").innerText = `${formattedDate} lúc ${bookingInfo.khungGio}`;
    document.getElementById("lblBookingTableName").innerText = bookingInfo.tenBan;

    const container = document.getElementById("divCheckoutDishesList");
    if (!container) return;
    container.innerHTML = "";

    const entries = Object.entries(dishesInfo);
    if (entries.length === 0) {
        container.innerHTML = `<p class="text-gray-400 italic font-medium py-2">Bạn không chọn đặt trước món ăn nào kèm theo.</p>`;
    } else {
        entries.forEach(([name, qty]) => {
            const div = document.createElement("div");
            div.className = "flex justify-between items-center py-2";
            div.innerHTML = `
                <div>
                    <p class="text-gray-800 text-xs">${name}</p>
                    <span class="text-[10px] text-gray-400 font-semibold">Số lượng: ${qty} phần</span>
                </div>
            `;
            container.appendChild(div);
        });
    }

    // ĐOẠN CODE MỚI: BỎ HOÀN TOÀN PHÍ VAT VÀ DỊCH VỤ - TỔNG CỘNG BẰNG ĐÚNG TIỀN MÓN ĂN
    const grandTotal = rawDishPrice;

    // Đảm bảo các ID thẻ này tồn tại trong checkout.html để không bị lỗi gán thuộc tính text
    if (document.getElementById("lblSubTotal")) {
        document.getElementById("lblSubTotal").innerText = rawDishPrice.toLocaleString('vi-VN') + "đ";
    }
    if (document.getElementById("lblGrandTotal")) {
        document.getElementById("lblGrandTotal").innerText = grandTotal.toLocaleString('vi-VN') + "đ";
    }
}

// Bước 1: Ngăn chặn chuyển trang mặc định và mở Modal QR động
function handleConfirmBookingClick(event) {
    if (event) event.preventDefault(); // Chặn đứng hành động submit tự chuyển trang của form/button

    const clientName = document.getElementById("txtClientName").value.trim();
    const clientPhone = document.getElementById("txtClientPhone").value.trim();

    if (!clientName || !clientPhone) {
        showToast("Vui lòng điền đầy đủ Họ tên và Số điện thoại liên hệ!", "error");
        return;
    }

    const modal = document.getElementById("qrPaymentModal");
    if (!modal) return;

    // Tạo mã đơn hàng ngẫu nhiên và link VietQR
    const maDonHang = "BK" + Math.floor(1000 + Math.random() * 9000);
    const noiDungChuyenKhoan = `GourmetBooking ${maDonHang}`;

    // SỬA LỖI: Tính toán tổng tiền hóa đơn thực tế (Đã bỏ sạch VAT và phí phục vụ)
    const tongTienPhaiQuet = rawDishPrice;

    // Nếu khách không gọi món (tiền món ăn = 0) thì tự động lấy số tiền cọc giữ bàn cố định (50k)
    const soTienThucTe = tongTienPhaiQuet > 0 ? tongTienPhaiQuet : SO_TIEN_COC_CO_DINH;

    // Gán số tiền động này lên chữ hiển thị trong modal QR
    document.getElementById("lblModalAmount").innerText = soTienThucTe.toLocaleString('vi-VN') + " đ";

    // Truyền biến soTienThucTe vào API VietQR động
    const vietQrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.jpg?amount=${soTienThucTe}&addInfo=${encodeURIComponent(noiDungChuyenKhoan)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

    const qrImage = modal.querySelector("img");
    if (qrImage) qrImage.src = vietQrUrl;

    // Lưu tạm số tiền thực tế này vào window để hàm xác nhận lưu chuẩn số tiền vào DB
    window.soTienThucTeDonNay = soTienThucTe;

    // Hiển thị modal
    modal.classList.remove("hidden");
    setTimeout(() => {
        modal.classList.remove("opacity-0");
        modal.querySelector('.transform').classList.remove('scale-95');
    }, 10);
}

// Hàm đóng modal QR
function dongModalQR() {
    const modal = document.getElementById("qrPaymentModal");
    if (!modal) return;

    modal.classList.add("opacity-0");
    modal.querySelector('.transform').classList.add('scale-95');
    setTimeout(() => modal.classList.add("hidden"), 300);
}

// Bước 2: Bấm nút đã chuyển khoản -> Thực hiện POST dữ liệu thật lên API C#
async function xacNhanDaChuyenKhoan() {
    dongModalQR();

    const clientName = document.getElementById("txtClientName").value.trim();
    const clientPhone = document.getElementById("txtClientPhone").value.trim();
    const dateTimeString = `${bookingInfo.ngayDen}T${bookingInfo.khungGio}:00`;

    // 1. CHUẨN HÓA DANH SÁCH MÓN ĂN TỪ LOCALSTORAGE ĐỂ GỬI LÊN BACK-END
    let chiTietGoiMonsPayload = [];

    if (dishesInfo && Object.keys(dishesInfo).length > 0) {
        Object.entries(dishesInfo).forEach(([tenMonDaChon, soLuong]) => {
            const matchDish = rawDishesList ? rawDishesList.find(d => (d.tenMon || d.TenMon) === tenMonDaChon) : null;

            if (matchDish) {
                chiTietGoiMonsPayload.push({
                    MonAnId: parseInt(matchDish.id || matchDish.Id),
                    SoLuong: parseInt(soLuong)
                });
            }
        });
    }

    // 2. Lấy số tiền thực tế quét QR để đẩy lên bảng Database
    const tienLuuDatabase = window.soTienThucTeDonNay || SO_TIEN_COC_CO_DINH;

    // ĐÓNG GÓI PAYLOAD HOÀN CHỈNH GỬI SANG C# CÓ CHỨA MẢNG CHI TIẾT
    const finalPayload = {
        TenKhachHang: clientName,
        SoDienThoai: clientPhone,
        NgayDat: new Date(dateTimeString).toISOString(),
        SoLuongKhach: parseInt(bookingInfo.soLuongKhach) || 1,
        GhiChu: bookingInfo.ghiChu || "",
        BanAnId: parseInt(bookingInfo.banAnId),
        TienCoc: tienLuuDatabase, // 👈 Ghi nhận số tiền thực tế khách đã quét vào database
        ChiTietGoiMons: chiTietGoiMonsPayload
    };

    try {
        const res = await fetch("/api/DatBan", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(finalPayload)
        });

        const data = await res.json();

        if (res.ok) {
            showToast("Đã gửi thông tin chuyển khoản thành công! Đang chuyển hướng...", "success");

            // Xóa sạch giỏ hàng tạm sau khi đã lưu database thành công
            localStorage.removeItem("checkout_booking");
            localStorage.removeItem("checkout_dishes");
            localStorage.removeItem("checkout_total_dish_price");

            setTimeout(() => { window.location.href = "/history.html"; }, 1500);
        } else {
            showToast(data.message || "Gửi đơn hàng thất bại!", "error");
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        showToast("Không thể kết nối đến máy chủ Web API nhà hàng!", "error");
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-rose-500';
    const icon = type === 'success' ? '<i class="fa-solid fa-circle-check text-lg"></i>' : '<i class="fa-solid fa-circle-xmark text-lg"></i>';

    const toast = document.createElement("div");
    toast.className = `flex items-center space-x-3 ${bgColor} text-white text-sm font-bold px-5 py-3.5 rounded-xl shadow-lg transition-all duration-300 min-w-[280px] pointer-events-auto`;
    toast.innerHTML = `<span>${icon}</span><span class="flex-1">${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => { toast.remove(); }, 300);
    }, 3000);
}

function openLogoutModal() { const m = document.getElementById("logoutModal"); if (m) { m.classList.remove("hidden"); setTimeout(() => { m.classList.remove("opacity-0"); }, 10); } }
function closeLogoutModal() { const m = document.getElementById("logoutModal"); if (m) { m.classList.add("opacity-0"); setTimeout(() => m.classList.add("hidden"), 300); } }
function confirmLogout() { closeLogoutModal(); localStorage.removeItem("token"); window.location.href = "/"; }