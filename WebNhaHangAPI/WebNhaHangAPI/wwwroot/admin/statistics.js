// Biến toàn cục để lưu trữ danh sách đơn hàng phục vụ tính năng tìm kiếm
let tatCaDanhSachDonThongKe = [];

async function taiDuLieuThongKe() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // 1. Tạo bộ khung giao diện các thẻ Card và Bảng dữ liệu thống kê
    mainContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex justify-between items-center">
                <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Đơn đã hoàn thành</p>
                    <h3 id="txt-tong-don" class="text-3xl font-black text-gray-800 mt-1">0</h3>
                </div>
                <div class="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-lg">
                    <i class="fa-solid fa-circle-check"></i>
                </div>
            </div>
            <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex justify-between items-center">
                <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tổng doanh thu tích lũy</p>
                    <h3 id="txt-tong-doanh-thu" class="text-3xl font-black text-gray-800 mt-1">0 đ</h3>
                </div>
                <div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-lg">
                    <i class="fa-solid fa-wallet"></i>
                </div>
            </div>
        </div>
        
        <div class="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 font-bold text-xs text-gray-700 uppercase tracking-wider">Nhật ký hóa đơn hoàn tất</div>
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs font-semibold text-gray-600">
                    <thead>
                        <tr class="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase tracking-wider text-[10px]">
                            <th class="px-6 py-3.5">Mã Đơn</th>
                            <th class="px-6 py-3.5">Bàn Ăn</th>
                            <th class="px-6 py-3.5">Trạng thái cọc</th>
                            <th class="px-6 py-3.5">Số tiền cọc</th>
                            <th class="px-6 py-3.5">Phương thức</th>
                            <th class="px-6 py-3.5 text-center">Chi tiết món</th>
                            <th class="px-6 py-3.5 text-right">Trạng thái tổng</th>
                        </tr>
                    </thead>
                    <tbody id="container-danh-sach-don">
                        <tr>
                            <td colspan="7" class="text-center py-8 text-gray-400">
                                <i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải báo cáo dữ liệu...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // 2. Thực hiện gọi API tương đối đổ dữ liệu động vào giao diện vừa dựng
    try {
        const token = localStorage.getItem("AdminToken") || localStorage.getItem("token");

        const response = await fetch("/api/DatBan/don-da-hoan-thanh", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Không thể kết nối API hoặc quyền Admin không hợp lệ.");
        const data = await response.json();

        // Đổ số liệu vào 2 Widget tổng quan
        document.getElementById("txt-tong-don").innerText = data.tongSoDonThànhCông;
        document.getElementById("txt-tong-doanh-thu").innerText = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.tongDoanhThuDuKien);

        // Lưu danh sách đơn vào biến toàn cục để dùng cho hàm tìm kiếm
        tatCaDanhSachDonThongKe = data.danhSachDon || [];

        // Gọi hàm hiển thị bảng dữ liệu
        hienThiBangThongKe(tatCaDanhSachDonThongKe);

    } catch (err) {
        document.getElementById("container-danh-sach-don").innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-6 text-red-500 font-bold">
                    <i class="fa-solid fa-circle-exclamation mr-2"></i> Lỗi: ${err.message}
                </td>
            </tr>
        `;
    }
}

// Hàm render bảng riêng biệt để tái sử dụng khi tìm kiếm
function hienThiBangThongKe(danhSachDon) {
    const tbody = document.getElementById("container-danh-sach-don");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (danhSachDon.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-gray-400">Không tìm thấy hóa đơn nào phù hợp.</td></tr>`;
        return;
    }

    danhSachDon.forEach(don => {
        const donDataString = JSON.stringify(don).replace(/'/g, "&apos;");

        // Tạo nút bấm con mắt xem chi tiết món
        const nutXemChiTietHtml = `
            <div class="text-center">
                <button type="button" onclick='openStatDetailModal(${donDataString})' class="text-gray-400 hover:text-[#cc4e11] font-bold inline-flex items-center space-x-1 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                    <i class="fa-regular fa-eye text-sm"></i> 
                    <span>Xem món</span>
                </button>
            </div>
        `;

        // ĐỌC CHÍNH XÁC GIÁ TRỊ SỐ TIỀN CỌC THỰC TẾ TỪ C# TRẢ VỀ (TRÁNH LỖI PHÁN ĐOÁN SAI SỐ 0)
        let soTienCoc = 0;
        if (don.tienCoc !== undefined && don.tienCoc !== null) {
            soTienCoc = don.tienCoc;
        } else if (don.TienCoc !== undefined && don.TienCoc !== null) {
            soTienCoc = don.TienCoc;
        }

        const tienCocDinhDang = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(soTienCoc);

        tbody.insertAdjacentHTML("beforeend", `
            <tr class="border-b border-gray-100 hover:bg-gray-50/50 transition">
                <td class="px-6 py-4 font-bold text-gray-900">#${don.id}</td>
                <td class="px-6 py-4"><span class="bg-orange-50 text-[#cc4e11] px-2 py-0.5 rounded text-[10px] font-bold">Bàn ${don.banAnId}</span></td>
                <td class="px-6 py-4"><span class="text-emerald-600 font-bold">${don.trangThaiCoc}</span></td>
                <td class="px-6 py-4 text-gray-800 font-bold">${tienCocDinhDang}</td>
                <td class="px-6 py-4 text-gray-400">${don.phuongThucThanhToan || 'Mặc định'}</td>
                <td class="px-6 py-3">${nutXemChiTietHtml}</td>
                <td class="px-6 py-4 text-right"><span class="bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">${don.trangThai}</span></td>
            </tr>
        `);
    });
}

// XỬ LÝ TÌM KIẾM TRÊN Ô INPUT Ở HEADER CỦA TAB THỐNG KÊ
function handleStatisticsSearch() {
    const headerContext = document.getElementById('lblHeaderContext');
    if (headerContext && headerContext.innerText === "Statistical Report") {
        const tuKhoa = document.getElementById("txtOrderSearch").value.trim().toLowerCase();

        // Lọc danh sách theo tên khách hoặc SĐT
        const ketQuaLoc = tatCaDanhSachDonThongKe.filter(don => {
            const tenKhach = (don.tenKhachHang || don.TenKhachHang || "").toLowerCase();
            const sdtKhach = (don.soDienThoai || don.SoDienThoai || "").toLowerCase();
            return tenKhach.includes(tuKhoa) || sdtKhach.includes(tuKhoa);
        });

        hienThiBangThongKe(ketQuaLoc);
    }
}

// 3. Hàm kích hoạt đổi trạng thái giao diện menu khi Click vào mục Thống Kê
function moTabThongKe(element) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');

    document.getElementById('lblHeaderContext').innerText = "Statistical Report";

    // 1. HIỂN THỊ NÚT EXCEL KHI VÀO TAB THỐNG KÊ
    const btnExcel = document.getElementById("btnExportExcel");
    if (btnExcel) btnExcel.classList.remove("hidden");

    const searchArea = document.getElementById('divHeaderSearchArea');
    if (searchArea) {
        searchArea.style.display = "block";
        const inputSearch = document.getElementById("txtOrderSearch");
        if (inputSearch) {
            inputSearch.value = "";
            inputSearch.placeholder = "Tìm kiếm báo cáo theo khách, SĐT...";
        }
    }

    taiDuLieuThongKe();
}

// HÀM MỞ MODAL VÀ ĐỔ DỮ LIỆU ĐƠN HÀNG + MÓN ĂN VÀO POPUP
function openStatDetailModal(don) {
    const modal = document.getElementById("statInvoiceDetailModal");
    if (!modal) return;

    const idDon = don.id || don.Id || "---";
    document.getElementById("lblModalOrderCode").innerText = `#BK-${idDon}`;
    document.getElementById("lblModalClientName").innerText = don.tenKhachHang || don.TenKhachHang || "Khách vô danh";
    document.getElementById("lblModalClientPhone").innerText = don.soDienThoai || don.SoDienThoai || "---";
    document.getElementById("lblModalNotes").innerText = don.ghiChu || don.GhiChu || "Không có";
    document.getElementById("lblModalDepositStatus").innerText = don.trangThaiCoc || don.TrangThaiCoc || "Đã cọc";

    const dishesContainer = document.getElementById("divModalDishesContainer");
    dishesContainer.innerHTML = "";

    const mangMonAn = don.chiTietGoiMons || don.ChiTietGoiMons || [];

    if (mangMonAn.length === 0) {
        dishesContainer.innerHTML = `<p class="text-gray-400 italic font-medium py-1 text-center w-full">Đơn đặt bàn suông, khách chưa chọn món trước.</p>`;
    } else {
        mangMonAn.forEach(ct => {
            const monAnObj = ct.monAn || ct.MonAn;
            const tenMon = monAnObj ? (monAnObj.tenMon || monAnObj.TenMon || monAnObj.ten || monAnObj.Ten) : "Món ăn hệ thống";
            const giaMon = monAnObj ? (monAnObj.gia || monAnObj.Gia) : 0;
            const soLuong = ct.soLuong || ct.SoLuong || 1;

            const divRow = document.createElement("div");
            divRow.className = "flex justify-between items-center pt-2 first:pt-0 pb-2 border-b border-gray-50 last:border-0";
            divRow.innerHTML = `
                <div class="space-y-0.5">
                    <p class="text-gray-800 font-extrabold text-left">${tenMon}</p>
                    <p class="text-[10px] text-gray-400 font-medium text-left">Đơn giá: ${Number(giaMon).toLocaleString('vi-VN')}đ</p>
                </div>
                <div class="text-right">
                    <span class="bg-orange-50 text-[#a13d06] px-2 py-0.5 rounded-md font-black text-[11px]">x${soLuong}</span>
                    <p class="text-[10px] text-gray-900 font-black mt-0.5">${Number(giaMon * soLuong).toLocaleString('vi-VN')}đ</p>
                </div>
            `;
            dishesContainer.appendChild(divRow);
        });
    }

    modal.classList.remove("hidden");
    setTimeout(() => {
        modal.classList.remove("opacity-0");
        modal.querySelector('.transform').classList.remove('scale-95');
    }, 10);
}

// HÀM ĐÓNG MODAL
function closeStatDetailModal() {
    const modal = document.getElementById("statInvoiceDetailModal");
    if (!modal) return;

    modal.classList.add("opacity-0");
    modal.querySelector('.transform').classList.add('scale-95');
    setTimeout(() => modal.classList.add("hidden"), 300);
}