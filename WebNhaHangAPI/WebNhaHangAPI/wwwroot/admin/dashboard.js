// Biến toàn cục hệ thống chia sẻ giữa các file
const token = localStorage.getItem("token");
let globalCategories = [];
let globalDishes = [];
let globalTables = [];
let globalLocations = [];
let adminOrdersList = [];
let currentAdminLocationId = null;
let mangToanCucNhanVien = [];
let emailNhanVienDangChon = "";

// Hàm hiển thị thông báo Toast
function showToast(message, type = 'success') {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-rose-500';
    const icon = type === 'success' ? '<i class="fa-solid fa-circle-check text-lg"></i>' : '<i class="fa-solid fa-circle-xmark text-lg"></i>';
    const toast = document.createElement("div");
    toast.className = `flex items-center space-x-3 ${bgColor} text-white text-sm font-bold px-5 py-3.5 rounded-xl shadow-lg transition-all duration-300 pointer-events-auto min-w-[280px]`;
    toast.innerHTML = `<span>${icon}</span><span class="flex-1">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

// Hàm nạp các file HTML động từ thư mục component chuẩn xác
async function loadComponent(url, containerId) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            const html = await response.text();
            const container = document.getElementById(containerId);
            if (container) { container.innerHTML = html; return true; }
        }
    } catch (err) { console.error(`Không thể nạp component: ${url}`, err); }
    return false;
}

// ================= TỐI ƯU LUỒNG KHỞI TẠO TRANG (WINDOW.ONLOAD) =================
// Đã xóa bỏ toàn bộ 2 khối DOMContentLoaded bị trùng và gom lại luồng an toàn dưới đây:
window.onload = async function () {
    if (!token) { window.location.href = "/login.html"; return; }

    // Nạp khung Modals ẩn từ đường dẫn chính xác
    await loadComponent('/admin/components/modals.html', 'modal-container');

    try {
        const response = await fetch("/api/Admin/current-user-role", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();

            // Nếu không phải quyền Admin thì chặn lại ngay
            if (!data.roles || !data.roles.includes("Admin")) {
                window.location.href = "/";
                return;
            }

            if (document.getElementById("lblAdminName")) {
                document.getElementById("lblAdminName").innerText = data.email.split('@')[0];
            }

            // CHUẨN HÓA: Đợi tất cả 5 file script độc lập tải xong hoàn toàn mới thực thi nạp API dữ liệu
            if (typeof loadAllCategories === "function") await loadAllCategories().catch(e => console.error(e));
            if (typeof loadAllLocations === "function") await loadAllLocations().catch(e => console.error(e));
            if (typeof loadAllDishes === "function") await loadAllDishes().catch(e => console.error(e));
            if (typeof loadAllTables === "function") await loadAllTables().catch(e => console.error(e));

            // Kích hoạt nạp bảng đơn hàng mặc định (Tab Order) sau khi các mảng trên đã chuẩn bị sẵn sàng
            const firstTabBtn = document.querySelector("button[onclick*='order']");
            if (firstTabBtn) {
                await switchTab('order', firstTabBtn);
            }
        } else {
            // Nếu token hết hạn hoặc lỗi xác thực -> sút về trang login
            window.location.href = "/login.html";
        }
    } catch (error) {
        console.error("Lỗi xác thực kết nối hệ thống hoặc hàm nạp dữ liệu vệ tinh:", error);
    }
};

// ================= ĐIỀU HƯỚNG CHUYỂN TAB ĐỘNG =================
async function switchTab(tabId, element) {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    // TỐI ƯU ĐƯỜNG DẪN ĐỘNG: Bỏ /admin, dùng đường dẫn tương đối từ vị trí dashboard.html
    // Cách này giúp cả localhost:7287 và domain Render tự động chui vào đúng thư mục components
    const componentUrl = `components/tab-${tabId}.html`;

    mainContent.innerHTML = `<div class="p-8 text-center font-semibold text-gray-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang tải dữ liệu...</div>`;

    const success = await loadComponent(`${componentUrl}?v=${Math.random()}`, 'main-content');
    if (!success) {
        mainContent.innerHTML = `<div class="p-8 text-center text-red-500">Lỗi: Không tìm thấy file tại đường dẫn '${componentUrl}'.</div>`;
        return;
    }

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (element) element.classList.add('active');
    if (document.getElementById("lblHeaderContext")) document.getElementById("lblHeaderContext").innerText = tabId.toUpperCase() + " MANAGEMENT";

    const searchArea = document.getElementById("divHeaderSearchArea");
    const btnExcel = document.getElementById("btnExportExcel");

    try {
        if (tabId === 'order') {
            if (searchArea) {
                searchArea.classList.remove('hidden');
                const txtSearch = document.getElementById("txtOrderSearch");
                if (txtSearch) { txtSearch.value = ""; txtSearch.placeholder = "Tìm tên khách, SĐT, mã đơn..."; }
            }
            if (btnExcel) btnExcel.classList.add("hidden");
            if (typeof fetchAdminOrdersData === "function") await fetchAdminOrdersData();
        } else {
            if (searchArea) searchArea.classList.add('hidden');
            if (btnExcel) btnExcel.classList.add("hidden");

            // CHUẨN HÓA TAB ROLE: Chờ 50ms để HTML của tab-role kịp render xong vào DOM rồi mới gọi hàm tải dữ liệu
            if (tabId === 'role') {
                setTimeout(() => {
                    if (typeof taiDanhSachQuyenHeThong === "function") {
                        taiDanhSachQuyenHeThong();
                    } else {
                        console.error("Không tìm thấy hàm taiDanhSachQuyenHeThong trong file admin-roles.js!");
                    }
                }, 50);
            }

            if (tabId === 'menu') {
                if (typeof loadAllDishes === "function") await loadAllDishes();
                if (typeof renderDishesTable === "function") renderDishesTable(globalDishes);
            }

            if (tabId === 'category' && typeof loadAllCategories === "function") {
                await loadAllCategories();
            }

            if (tabId === 'table' && typeof loadAllLocations === "function" && typeof loadAllTables === "function") {
                await loadAllLocations();
                await loadAllTables();
            }
        }
    } catch (ex) { console.error(`Lỗi thực thi dữ liệu tab: ${tabId}`, ex); }
}

// ================= ĐĂNG XUẤT HỆ THỐNG =================
function openLogoutModal() { const modal = document.getElementById("logoutModal"); if (modal) { modal.classList.remove("hidden"); setTimeout(() => { modal.classList.remove("opacity-0"); }, 10); } }
function closeLogoutModal() { const modal = document.getElementById("logoutModal"); if (modal) { modal.classList.add("opacity-0"); setTimeout(() => modal.classList.add("hidden"), 300); } }
function confirmLogout() { localStorage.removeItem("token"); window.location.href = "/"; }