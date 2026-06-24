// Biến toàn cục hệ thống
const token = localStorage.getItem("token");
let globalCategories = [];
let globalDishes = [];
let globalTables = [];
let globalLocations = [];
let adminOrdersList = []; // Mảng gốc lưu trữ danh sách đơn hàng phục vụ tính năng tìm kiếm
let currentAdminLocationId = null;

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

// Hàm nạp các file HTML động từ thư mục /admin/components/ chuẩn xác
async function loadComponent(url, containerId) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            const html = await response.text();
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = html;
                return true;
            }
        }
    } catch (err) {
        console.error(`Không thể nạp component: ${url}`, err);
    }
    return false;
}

// ================= SỰ KIỆN KHỞI TẠO TRANG =================
document.addEventListener("DOMContentLoaded", async function () {
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
            if (!data.roles || !data.roles.includes("Admin")) { window.location.href = "/"; return; }
            if (document.getElementById("lblAdminName")) {
                document.getElementById("lblAdminName").innerText = data.email.split('@')[0];
            }

            // Tải dữ liệu từ API
            await loadAllCategories();
            await loadAllLocations();
            await loadAllDishes();
            await loadAllTables();
        }
    } catch (error) {
        console.error("Lỗi xác thực người dùng:", error);
    }

    // Kích hoạt mặc định Tab Order đầu tiên khi vừa tải trang
    const firstTabBtn = document.querySelector("button[onclick*='tab-order']");
    await switchTab('order', firstTabBtn);
});

// ================= ĐIỀU HƯỚNG CHUYỂN TAB ĐỘNG =================
// ================= ĐIỀU HƯỚNG CHUYỂN TAB ĐỘNG =================
async function switchTab(tabId, element) {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    // Đường dẫn tuyệt đối trỏ thẳng vào thư mục chứa các component của bạn
    const componentUrl = `/admin/components/tab-${tabId}.html`;

    mainContent.innerHTML = `<div class="p-8 text-center font-semibold text-gray-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang tải dữ liệu...</div>`;

    // Thêm chuỗi ngẫu nhiên phá cache trình duyệt, ép cập nhật giao diện mới liên tục
    const success = await loadComponent(`${componentUrl}?v=${Math.random()}`, 'main-content');
    if (!success) {
        mainContent.innerHTML = `<div class="p-8 text-center text-red-500">Lỗi: Không tìm thấy file tại đường dẫn '${componentUrl}'.</div>`;
        return;
    }

    // Cập nhật trạng thái Active trên Sidebar Menu
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (element) element.classList.add('active');

    if (document.getElementById("lblHeaderContext")) {
        document.getElementById("lblHeaderContext").innerText = tabId.toUpperCase() + " MANAGEMENT";
    }

    const searchArea = document.getElementById("divHeaderSearchArea");
    const btnExcel = document.getElementById("btnExportExcel"); // Lấy nút Excel từ DOM

    // Thực thi nạp dữ liệu từ API tương ứng với từng Tab
    try {
        if (tabId === 'order') {
            // Hiển thị ô tìm kiếm của tab duyệt đơn
            if (searchArea) {
                searchArea.classList.remove('hidden');
                const txtSearch = document.getElementById("txtOrderSearch");
                if (txtSearch) {
                    txtSearch.value = ""; // Xóa từ khóa cũ
                    txtSearch.placeholder = "Tìm tên khách, SĐT, mã đơn...";
                }
            }

            // ẨN NÚT EXCEL: Khi ở tab duyệt đơn (Chỉ bật nút này bên tab Thống Kê)
            if (btnExcel) btnExcel.classList.add("hidden");

            await fetchAdminOrdersData();
        } else {
            // Ẩn ô tìm kiếm đối với các tab thông thường khác
            if (searchArea) searchArea.classList.add('hidden');

            // ẨN NÚT EXCEL: Khi chuyển sang các tab menu, danh mục, sơ đồ bàn ăn
            if (btnExcel) btnExcel.classList.add("hidden");

            if (tabId === 'menu') {
                await loadAllDishes();
                renderDishesTable(globalDishes);
            }
            if (tabId === 'category') {
                await loadAllCategories();
            }
            if (tabId === 'table') {
                await loadAllLocations();
                await loadAllTables();
            }
        }
    } catch (ex) {
        console.error(`Lỗi thực thi dữ liệu tab: ${tabId}`, ex);
    }
}

// ================= XỬ LÝ TAB ORDER MANAGEMENT =================
async function fetchAdminOrdersData() {
    try {
        const res = await fetch("/api/DatBan/tat-ca-don", { method: "GET", headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const rawOrders = await res.json();
            const deletedIds = JSON.parse(localStorage.getItem("admin_deleted_orders") || "[]");

            // Lưu dữ liệu vào danh sách gốc toàn cục
            adminOrdersList = rawOrders.filter(o => !deletedIds.includes(o.id || o.Id));

            calculateOrderStatistics(adminOrdersList);
            renderOrderTable(adminOrdersList); // Đổ dữ liệu ra bảng
        }
    } catch (err) { console.error("Lỗi tải đơn hàng:", err); }
}

function calculateOrderStatistics(orders) {
    if (!document.getElementById("lblStatTotal")) return;
    document.getElementById("lblStatTotal").innerText = orders.length;
    document.getElementById("lblStatWaiting").innerText = orders.filter(o => (o.trangThai || o.TrangThai || "").trim() === "Chờ xác nhận").length;
    document.getElementById("lblStatConfirmed").innerText = orders.filter(o => (o.trangThai || o.TrangThai || "").trim() === "Đã xác nhận").length;
    document.getElementById("lblStatCanceled").innerText = orders.filter(o => (o.trangThai || o.TrangThai || "").trim() === "Đã hủy").length;
}

// Tách biệt hàm render bảng để có thể gọi lại mượt mà khi tìm kiếm
function renderOrderTable(orders) {
    const tbody = document.getElementById("tbOrderDashboardBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-400 italic">Không có đơn đặt bàn nào thỏa điều kiện.</td></tr>`;
        return;
    }

    orders.forEach(order => {
        const date = new Date(order.ngayDat || order.NgayDat);
        const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString('vi-VN');
        const status = (order.trangThai || order.TrangThai || "Chờ xác nhận").trim();
        let statusBadge = "", actionsHtml = "";

        if (status === "Chờ xác nhận") {
            statusBadge = `<span class="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">● Chờ duyệt cọc</span>`;
            actionsHtml = `<div class="flex items-center justify-center gap-1.5"><button onclick="approveAdminDeposit(${order.id || order.Id})" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[10px] transition uppercase cursor-pointer"><i class="fa-solid fa-check"></i> Duyệt</button><button onclick="executeRejectBooking(${order.id || order.Id})" class="bg-rose-500 hover:bg-rose-600 text-white font-bold px-2 py-1 rounded text-[10px] transition uppercase cursor-pointer"><i class="fa-regular fa-trash-can"></i> Hủy</button></div>`;
        }
        else if (status === "Đã xác nhận" || status === "Đã giữ bàn") {
            statusBadge = `<span class="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">● Đã giữ bàn</span>`;
            actionsHtml = `
            <div class="flex items-center justify-center gap-1.5">
                <button onclick="executeCheckInCustomer(${order.id || order.Id})" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded text-[10px] transition uppercase cursor-pointer">
                    <i class="fa-solid fa-user-check"></i> Khách Đến
                </button>
                <button onclick="executeRejectBooking(${order.id || order.Id})" class="bg-rose-500 hover:bg-rose-600 text-white font-bold px-2 py-1 rounded text-[10px] transition uppercase cursor-pointer">
                    <i class="fa-solid fa-ban"></i> Hủy
                </button>
            </div>`;
        }
        else if (status === "Đã thanh toán" || status === "Hoàn thành") {
            statusBadge = `<span class="bg-gray-100 text-gray-400 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-bold">● Hoàn thành</span>`;
            actionsHtml = `<span class="text-[10px] text-gray-400 font-bold italic">Đã lưu báo cáo</span>`;
        }
        else {
            statusBadge = `<span class="bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold">● Đã hủy</span>`;
            actionsHtml = `<div class="flex items-center justify-center gap-1.5"><button onclick="deleteCanceledOrderRow(${order.id || order.Id})" class="bg-gray-600 hover:bg-gray-800 text-white font-bold px-3 py-1 rounded text-[10px] transition uppercase cursor-pointer"><i class="fa-solid fa-trash-can"></i> Xóa đơn</button></div>`;
        }

        const tableObj = order.banAn || order.BanAn;
        const tableName = tableObj ? (tableObj.tenBan || tableObj.TenBan) : `Bàn ${order.banAnId}`;
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50/50 transition border-b border-gray-100";
        tr.innerHTML = `<td class="p-4 text-center font-bold text-gray-400">#BK-${order.id || order.Id}</td><td class="p-4"><div class="font-bold text-gray-900">${order.tenKhachHang || order.TenKhachHang}</div><div class="text-[10px] text-gray-400 font-normal mt-0.5">${order.soDienThoai || order.SoDienThoai}</div></td><td class="p-4 font-bold text-gray-700">${dateStr}<br><span class="text-[10px] text-[#cc4e11]">${timeStr}</span></td><td class="p-4 font-black text-orange-800">${tableName}</td><td class="p-4 text-center text-gray-500">${order.soLuongKhach || order.SoLuongKhach} người</td><td class="p-4 text-center">${statusBadge}</td><td class="p-4 text-center">${actionsHtml}</td>`;
        tbody.appendChild(tr);
    });
}

// CẬP NHẬT: HÀM XỬ LÝ TÌM KIẾM ĐƠN DUYỆT TRONG TAB ORDER MANAGEMENT
function handleAdminOrderSearch() {
    console.log(adminOrdersList[0]);
    const searchInput = document.getElementById("txtOrderSearch");
    if (!searchInput) return;

    const keyword = searchInput.value.trim().toLowerCase();

    if (!keyword) {
        renderOrderTable(adminOrdersList);
    } else {
        const filtered = adminOrdersList.filter(o => {
            const detail = o.chiTiet || o.orderDetail || o.donHangChiTiet || o;

            const name = (detail.tenKhachHang || detail.TenKhachHang || o.tenKhachHang || "").toLowerCase();
            const phone = (detail.soDienThoai || detail.SoDienThoai || o.soDienThoai || "").toString();
            const orderId = (o.id || o.Id || detail.id || "").toString().toLowerCase();

            return name.includes(keyword) || phone.includes(keyword) || orderId.includes(keyword);
        });

        renderOrderTable(filtered);
    }
}

async function approveAdminDeposit(id) {
    if (!confirm("Xác nhận duyệt cọc giữ chỗ cho đơn này?")) return;
    try {
        const res = await fetch(`/api/DatBan/${id}/xac-nhan-coc?phuongThuc=Chuyển khoản`, { method: "PUT", headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) { showToast("Duyệt đơn giữ bàn thành công!", "success"); await fetchAdminOrdersData(); await loadAllTables(); }
    } catch (err) { showToast("Lỗi kết nối!", "error"); }
}

async function executeRejectBooking(id) {
    if (!confirm("Xác nhận hủy đơn hàng này và giải phóng trạng thái bàn về Trống?")) return;
    try {
        const res = await fetch(`/api/DatBan/${id}/khach-huy-ban`, { method: "PUT", headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) { showToast("Đã hủy đơn và giải phóng trạng thái bàn ăn thành công!", "success"); await fetchAdminOrdersData(); await loadAllTables(); }
    } catch (err) { showToast("Lỗi kết nối mạng!", "error"); }
}

async function executeCheckInCustomer(id) {
    if (!confirm("Xác nhận khách đã đến nhà hàng ăn uống và hoàn tất hóa đơn này?")) return;
    try {
        const res = await fetch(`/api/DatBan/${id}/thanh-toan-hoan-tat`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        if (res.ok) {
            showToast("Đã hoàn tất đơn đặt bàn và chuyển thông tin vào Báo cáo doanh thu thành công!", "success");
            await fetchAdminOrdersData();
            await loadAllTables();
        } else {
            showToast("Lỗi khi kết nối máy chủ hoàn tất hóa đơn!", "error");
        }
    } catch (err) { showToast("Lỗi kết nối mạng!", "error"); }
}

function deleteCanceledOrderRow(id) {
    if (!confirm("Bạn muốn xóa đơn đã hủy #BK-" + id + " này? Hệ thống sẽ ẩn vĩnh viễn khỏi danh sách.")) return;
    const deletedIds = JSON.parse(localStorage.getItem("admin_deleted_orders") || "[]");
    if (!deletedIds.includes(id)) { deletedIds.push(id); localStorage.setItem("admin_deleted_orders", JSON.stringify(deletedIds)); }
    adminOrdersList = adminOrdersList.filter(o => (o.id || o.Id) !== id);
    calculateOrderStatistics(adminOrdersList);
    renderOrderTable(adminOrdersList);
    showToast("Đã xóa đơn hàng ra khỏi danh sách hiển thị thành công!", "success");
}

// ================= QUẢN LÝ KHU VỰC VỊ TRÍ =================
async function loadAllLocations() {
    try {
        const res = await fetch("/api/Admin/get-all-locations");
        if (res.ok) {
            globalLocations = await res.json();
            if (document.getElementById("lblTotalLocationsCount")) document.getElementById("lblTotalLocationsCount").innerText = globalLocations.length;

            const miniTbody = document.getElementById("tbMiniLocationBody"); if (miniTbody) miniTbody.innerHTML = "";
            const ddlLocation = document.getElementById("ddlTableLocation"); if (ddlLocation) ddlLocation.innerHTML = "";
            const tabContainer = document.getElementById("divAdminLocationTabs"); if (tabContainer) tabContainer.innerHTML = "";

            if (globalLocations.length > 0 && currentAdminLocationId === null) { currentAdminLocationId = globalLocations[0].id; }

            globalLocations.forEach((loc) => {
                if (miniTbody) {
                    const tr = document.createElement("tr"); tr.className = "hover:bg-gray-50 transition";
                    tr.innerHTML = `<td class="py-2 text-center text-gray-400 font-bold">#${loc.id}</td><td class="py-2 text-gray-909 font-bold text-xs truncate max-w-[110px]" title="${loc.tenKhuVuc}">${loc.tenKhuVuc}</td><td class="py-2 text-center space-x-1 flex justify-center items-center"><button onclick='editLocationClick(${JSON.stringify(loc)})' class="text-gray-400 hover:text-blue-600 p-1 cursor-pointer"><i class="fa-regular fa-pen-to-square text-[10px]"></i></button><button onclick="deleteLocation(${loc.id})" class="text-gray-400 hover:text-red-600 p-1 cursor-pointer"><i class="fa-regular fa-trash-can text-[10px]"></i></button></td>`;
                    miniTbody.appendChild(tr);
                }
                if (ddlLocation) {
                    const opt = document.createElement("option"); opt.value = loc.id; opt.innerText = loc.tenKhuVuc; ddlLocation.appendChild(opt);
                }
                if (tabContainer) {
                    const btnTab = document.createElement("button"); btnTab.type = "button";
                    btnTab.className = loc.id === currentAdminLocationId ? "text-[#cc4e11] border-b-2 border-[#cc4e11] pb-2 px-1 location-tab-btn font-bold cursor-pointer transition-all" : "text-gray-400 hover:text-gray-600 pb-2 px-1 location-tab-btn font-bold cursor-pointer transition-all";
                    btnTab.innerText = loc.tenKhuVuc;
                    btnTab.onclick = function () {
                        document.querySelectorAll(".location-tab-btn").forEach(b => b.className = "text-gray-400 hover:text-gray-600 pb-2 px-1 location-tab-btn font-bold cursor-pointer transition-all");
                        btnTab.className = "text-[#cc4e11] border-b-2 border-[#cc4e11] pb-2 px-1 location-tab-btn font-bold cursor-pointer transition-all";
                        currentAdminLocationId = loc.id;
                        renderAdminTableCanvas();
                    };
                    tabContainer.appendChild(btnTab);
                }
            });
        }
    } catch (err) { console.error(err); }
}

function openLocationFormModal() {
    document.getElementById("lblLocationModalTitle").innerText = "Thêm khu vực mới";
    document.getElementById("txtLocationId").value = ""; document.getElementById("txtLocationName").value = "";
    const modal = document.getElementById("locationFormModal"); if (modal) modal.classList.remove("hidden");
    setTimeout(() => { if (modal) modal.classList.remove("opacity-0"); }, 15);
}
function closeLocationFormModal() { const modal = document.getElementById("locationFormModal"); if (modal) { modal.classList.add("opacity-0"); setTimeout(() => modal.classList.add("hidden"), 300); } }
function editLocationClick(loc) { openLocationFormModal(); document.getElementById("lblLocationModalTitle").innerText = "Cập nhật khu vực"; document.getElementById("txtLocationId").value = loc.id; document.getElementById("txtLocationName").value = loc.tenKhuVuc; }
async function saveLocationData() {
    const id = document.getElementById("txtLocationId").value; const bodyData = { tenKhuVuc: document.getElementById("txtLocationName").value.trim() };
    let url = id ? `/api/Admin/update-location/${id}` : "/api/Admin/add-location"; let method = id ? "PUT" : "POST";
    try {
        const res = await fetch(url, { method: method, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(bodyData) });
        if (res.ok) { showToast("Cập nhật khu vực thành công", "success"); closeLocationFormModal(); await loadAllLocations(); if (globalTables.length > 0) renderAdminTableCanvas(); }
    } catch (err) { }
}
async function deleteLocation(id) { if (!confirm("Xóa vị trí này?")) return; try { const res = await fetch(`/api/Admin/delete-location/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } }); if (res.ok) { showToast("Xóa thành công", "success"); await loadAllLocations(); await loadAllTables(); } } catch (err) { } }

// ================= SƠ ĐỒ BÀN ĂN =================
async function loadAllTables() {
    try {
        const res = await fetch("/api/Admin/get-all-tables");
        if (res.ok) { globalTables = await res.json(); renderAdminTableCanvas(); }
    } catch (err) { console.error(err); }
}

function renderAdminTableCanvas() {
    const canvas = document.getElementById("divTableCanvas");
    const storage = document.getElementById("divTableStorage");
    if (!canvas || !storage) return;

    canvas.querySelectorAll('.table-item-card').forEach(el => el.remove());
    storage.querySelectorAll('.table-item-card').forEach(el => el.remove());

    globalTables.forEach(ban => {
        const idBan = ban.id || ban.Id; const tenBan = ban.tenBan || ban.TenBan; const trangThai = ban.trangThai || ban.TrangThai || "Trống"; const choNgoi = ban.soChoNgoi || ban.SoChoNgoi || 4; const isChinhThuc = ban.isChinhThuc || ban.IsChinhThuc || false; const currentKhuVucId = ban.khuVucId || ban.KhuVucId;
        const matchedLoc = globalLocations.find(l => l.id === currentKhuVucId); const tenKhuVuc = matchedLoc ? matchedLoc.tenKhuVuc : "Chưa rõ tầng";

        if (isChinhThuc && currentKhuVucId !== currentAdminLocationId) return;
        const isAvailable = trangThai === "Trống";
        const cardBg = isAvailable ? "bg-white border-gray-200" : "bg-orange-50/70 border-orange-200";
        const iconColor = isAvailable ? "text-gray-300" : "text-orange-500";
        const statusBadge = isAvailable ? `<span class="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[9px] font-extrabold">Trống</span>` : `<span class="bg-orange-500 text-white px-1.5 py-0.5 rounded text-[9px] font-extrabold">Có khách</span>`;

        const card = document.createElement("div");
        card.className = `${cardBg} border rounded-xl p-3 shadow-2xs flex flex-col justify-between group cursor-move select-none hover:shadow-sm table-item-card transition-all`;
        card.setAttribute("draggable", "true"); card.id = `table-card-${idBan}`;

        if (isChinhThuc) {
            card.style.position = "absolute"; card.style.left = `${ban.viTriX || ban.ViTriX || 20}px`; card.style.top = `${ban.viTriY || ban.ViTriY || 40}px`; card.style.width = "135px"; card.style.height = "115px"; card.style.zIndex = "10";
        } else {
            card.style.position = "relative"; card.style.width = "100%"; card.style.height = "100px";
        }

        card.ondragstart = (e) => {
            e.dataTransfer.setData("text/plain", idBan);
            if (isChinhThuc) {
                const rect = card.getBoundingClientRect(); e.dataTransfer.setData("offsetX", e.clientX - rect.left); e.dataTransfer.setData("offsetY", e.clientY - rect.top);
            } else { e.dataTransfer.setData("offsetX", 60); e.dataTransfer.setData("offsetY", 50); }
        };

        card.innerHTML = `<div class="flex items-start justify-between"><div class="w-6 h-6 rounded bg-gray-50 flex items-center justify-center ${iconColor} text-xs"><i class="fa-solid fa-chair"></i></div>${statusBadge}</div><div class="mt-1"><h4 class="text-gray-900 font-black text-xs truncate">${tenBan}</h4><p class="text-[9px] text-gray-400 font-bold truncate">${tenKhuVuc} (${choNgoi} chỗ)</p></div><div class="absolute bottom-2 right-2 space-x-1 opacity-0 group-hover:opacity-100 transition duration-150"><button onclick='editTableClick(${JSON.stringify(ban)})' class="bg-blue-50 text-blue-600 p-1 rounded text-[10px] cursor-pointer"><i class="fa-regular fa-pen-to-square"></i></button><button onclick="deleteTable(${idBan})" class="bg-rose-50 text-rose-600 p-1 rounded text-[10px] cursor-pointer"><i class="fa-regular fa-trash-can"></i></button></div>`;
        if (isChinhThuc) canvas.appendChild(card); else storage.appendChild(card);
    });
}

async function dropTableOnContainer(e, targetIsChinhThuc) {
    e.preventDefault();
    const idBan = e.dataTransfer.getData("text/plain"); const offsetX = parseFloat(e.dataTransfer.getData("offsetX")) || 0; const offsetY = parseFloat(e.dataTransfer.getData("offsetY")) || 0;
    let newX = 20; let newY = 40;

    if (targetIsChinhThuc) {
        const canvas = document.getElementById("divTableCanvas"); const canvasRect = canvas.getBoundingClientRect();
        newX = e.clientX - canvasRect.left - offsetX; newY = e.clientY - canvasRect.top - offsetY;
        if (newX < 0) newX = 0; if (newY < 0) newY = 0;
        if (newX > canvasRect.width - 135) newX = canvasRect.width - 135; if (newY > canvasRect.height - 115) newY = canvasRect.height - 115;
    }
    try {
        const updatePayload = { viTriX: Math.round(newX), viTriY: Math.round(newY), isChinhThuc: targetIsChinhThuc };
        if (targetIsChinhThuc && currentAdminLocationId !== null) { updatePayload.khuVucId = currentAdminLocationId; }
        const res = await fetch(`/api/Admin/update-table-coords/${idBan}`, { method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(updatePayload) });
        if (res.ok) { showToast("Cấu trúc bàn ăn đã được cập nhật!", "success"); await loadAllTables(); }
    } catch (err) { showToast("Lỗi kết nối!", "error"); }
}

function openTableFormModal() {
    document.getElementById("lblTableModalTitle").innerText = "Thêm bàn ăn mới";
    document.getElementById("txtTableId").value = ""; document.getElementById("txtTableName").value = ""; document.getElementById("txtTableCapacity").value = "4"; document.getElementById("ddlTableStatus").value = "Trống"; document.getElementById("txtTableIsChinhThuc").value = "false";
    if (currentAdminLocationId !== null && document.getElementById("ddlTableLocation")) document.getElementById("ddlTableLocation").value = currentAdminLocationId;
    const modal = document.getElementById("tableFormModal"); if (modal) modal.classList.remove("hidden");
    setTimeout(() => { if (modal) modal.classList.remove("opacity-0"); }, 15);
}
function closeTableFormModal() { const modal = document.getElementById("tableFormModal"); if (modal) { modal.classList.add("opacity-0"); setTimeout(() => modal.classList.add("hidden"), 300); } }
function editTableClick(ban) {
    openTableFormModal(); document.getElementById("lblTableModalTitle").innerText = "Cập nhật thông tin bàn";
    document.getElementById("txtTableId").value = ban.id || ban.Id; document.getElementById("txtTableName").value = ban.tenBan || ban.TenBan; document.getElementById("txtTableCapacity").value = ban.soChoNgoi || ban.SoChoNgoi || 4; document.getElementById("ddlTableStatus").value = ban.trangThai || ban.TrangThai || "Trống";
    if (document.getElementById("ddlTableLocation")) document.getElementById("ddlTableLocation").value = ban.khuVucId || ban.KhuVucId;
    document.getElementById("txtTableIsChinhThuc").value = ban.isChinhThuc || ban.IsChinhThuc || "false";
}
async function saveTableData() {
    const id = document.getElementById("txtTableId").value;
    const bodyData = { tenBan: document.getElementById("txtTableName").value.trim(), soChoNgoi: parseInt(document.getElementById("txtTableCapacity").value) || 4, trangThai: document.getElementById("ddlTableStatus").value, khuVucId: parseInt(document.getElementById("ddlTableLocation").value), isChinhThuc: document.getElementById("txtTableIsChinhThuc").value === "true" };
    let url = id ? `/api/Admin/update-table/${id}` : "/api/Admin/add-table"; let method = id ? "PUT" : "POST";
    try {
        const res = await fetch(url, { method: method, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(bodyData) });
        if (res.ok) { showToast("Lưu bàn thành công!", "success"); closeTableFormModal(); await loadAllTables(); }
    } catch (err) { }
}
async function deleteTable(id) { if (!confirm("Xóa bàn ăn này?")) return; try { const res = await fetch(`/api/Admin/delete-table/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } }); if (res.ok) { showToast("Xóa bàn thành công", "success"); await loadAllTables(); } } catch (err) { } }

// ================= THAO TÁC DANH MỤC & MÓN ĂN =================
async function loadAllCategories() {
    try {
        const res = await fetch("/api/Admin/get-all-categories");
        if (res.ok) {
            globalCategories = await res.json();
            const tbody = document.getElementById("tbCategoryBody"); if (tbody) tbody.innerHTML = "";
            const ddlCategory = document.getElementById("ddlDishCategory"); if (ddlCategory) ddlCategory.innerHTML = "";
            const filterContainer = document.getElementById("divMenuFilters");

            if (filterContainer) filterContainer.innerHTML = `<button onclick="filterByGlobalCategory('Tất cả')" class="bg-[#cc4e11] text-white px-3 py-1.5 rounded-lg cursor-pointer font-bold transition shadow-2xs">Tất cả</button>`;

            globalCategories.forEach(cat => {
                if (tbody) {
                    const tr = document.createElement("tr"); tr.className = "hover:bg-gray-50 transition border-b border-gray-100";
                    tr.innerHTML = `<td class="p-4 text-center text-gray-400 font-bold">#${cat.id}</td><td class="p-4 text-gray-900 font-bold text-sm">${cat.tenDanhMuc}</td><td class="p-4 text-center space-x-2"><button onclick='editCategoryClick(${JSON.stringify(cat)})' class="text-gray-400 hover:text-blue-600 p-1 rounded cursor-pointer"><i class="fa-regular fa-pen-to-square"></i></button><button onclick="deleteCategory(${cat.id})" class="text-gray-400 hover:text-red-600 p-1 rounded cursor-pointer"><i class="fa-regular fa-trash-can"></i></button></td>`;
                    tbody.appendChild(tr);
                }
                if (ddlCategory) {
                    const opt = document.createElement("option"); opt.value = cat.id; opt.innerText = cat.tenDanhMuc; ddlCategory.appendChild(opt);
                }
                if (filterContainer) {
                    const btnFilter = document.createElement("button"); btnFilter.className = "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg cursor-pointer transition font-bold";
                    btnFilter.innerText = cat.tenDanhMuc; btnFilter.onclick = () => filterByGlobalCategory(cat.id); filterContainer.appendChild(btnFilter);
                }
            });
        }
    } catch (err) { console.error(err); }
}
function xuatExcelDonHang() {
    // 1. TỰ ĐỘNG NHẬN DIỆN MẢNG DỮ LIỆU ĐANG HIỂN THỊ TRÊN MÀN HÌNH
    let danhSachXuatBaoCao = [];

    const context = document.getElementById('lblHeaderContext').innerText.toUpperCase();
    if (context.includes("STATISTICAL") || context.includes("REPORT")) {
        // Nếu ở tab Thống kê báo cáo -> lấy mảng của file statistics.js
        danhSachXuatBaoCao = typeof tatCaDanhSachDonThongKe !== "undefined" ? tatCaDanhSachDonThongKe : [];
    } else {
        // Nếu ở tab duyệt đơn -> lấy mảng của file dashboard.js
        danhSachXuatBaoCao = window.adminOrdersList || adminOrdersList || [];
    }

    // 2. Kiểm tra nếu mảng rỗng thì mới cảnh báo dừng lại
    if (!danhSachXuatBaoCao || danhSachXuatBaoCao.length === 0) {
        alert("Không có dữ liệu hóa đơn nào ở tab này để xuất file!");
        return;
    }

    // 3. Định nghĩa các tiêu đề cột cho file Excel
    let csvContent = "\uFEFF"; // Ký tự BOM giúp Excel nhận diện font tiếng Việt không lỗi
    csvContent += "Mã Đơn,Bàn Ăn,Trạng Thái Cọc,Số Tiền Cọc,Phương Thức\n";

    // 4. Duyệt qua mảng dữ liệu đã xác định để đóng gói vào hàng Excel
    danhSachXuatBaoCao.forEach(o => {
        const detail = o.chiTiet || o.orderDetail || o.donHangChiTiet || o.datBan || o;

        const maDon = (o.id || o.Id || detail.id || "---").toString().replace(/,/g, " ");
        const banAn = `Bàn ${o.banAnId || detail.banAnId || "---"}`;
        const trangThaiCoc = (o.trangThaiCoc || detail.trangThaiCoc || "---").replace(/,/g, " ");

        // Tính tiền cọc thực tế
        const soTienCoc = o.tienCoc || o.TienCoc || detail.tienCoc || detail.TienCoc || 0;
        const phuongThuc = (o.phuongThucThanhToan || detail.phuongThucThanhToan || "Mặc định").replace(/,/g, " ");

        // Nối thành một dòng trong file csv
        csvContent += `"#${maDon}","${banAn}","${trangThaiCoc}","${soTienCoc}đ","${phuongThuc}"\n`;
    });

    // 5. Kích hoạt tải file tự động xuống thiết bị
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const thoiGian = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_Doanh_Thu_Ngay_${thoiGian}.csv`);

    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
function openCategoryFormModal() { document.getElementById("lblCategoryModalTitle").innerText = "Thêm danh mục mới"; document.getElementById("txtCategoryId").value = ""; document.getElementById("txtCategoryName").value = ""; const modal = document.getElementById("categoryFormModal"); if (modal) modal.classList.remove("hidden"); setTimeout(() => { if (modal) modal.classList.remove("opacity-0"); }, 15); }
function closeCategoryFormModal() { const modal = document.getElementById("categoryFormModal"); if (modal) { modal.classList.add("opacity-0"); setTimeout(() => modal.classList.add("hidden"), 300); } }
function editCategoryClick(cat) { openCategoryFormModal(); document.getElementById("lblCategoryModalTitle").innerText = "Cập nhật danh mục"; document.getElementById("txtCategoryId").value = cat.id; document.getElementById("txtCategoryName").value = cat.tenDanhMuc; }
async function saveCategoryData() { const id = document.getElementById("txtCategoryId").value; const bodyData = { tenDanhMuc: document.getElementById("txtCategoryName").value.trim() }; let url = id ? `/api/Admin/update-category/${id}` : "/api/Admin/add-category"; let method = id ? "PUT" : "POST"; try { const res = await fetch(url, { method: method, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(bodyData) }); if (res.ok) { showToast("Lưu danh mục thành công", "success"); closeCategoryFormModal(); await loadAllCategories(); if (globalDishes.length > 0) renderDishesTable(globalDishes); } } catch (err) { } }
async function deleteCategory(id) { if (!confirm("Xóa danh mục này?")) return; try { const res = await fetch(`/api/Admin/delete-category/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } }); if (res.ok) { showToast("Xóa thành công", "success"); await loadAllCategories(); await loadAllDishes(); } } catch (err) { } }

async function loadAllDishes() {
    try {
        const res = await fetch("/api/MonAn");
        if (res.ok) {
            globalDishes = await res.json();
            if (document.getElementById("lblTotalDishes"))
                document.getElementById("lblTotalDishes").innerText = globalDishes.length;
        }
    } catch (err) { console.error(err); }
}

function renderDishesTable(dishes) {
    const tbody = document.getElementById("tbMenuBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (dishes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-400 italic">Thực đơn hiện tại đang trống!</td></tr>`; return;
    }
    dishes.forEach(mon => {
        const idMonAn = mon.id;
        const tenMon = mon.tenMon;
        const giaMon = mon.gia;
        const linkAnh = mon.hinhAnh || "https://images.unsplash.com/photo-1546964124-0cce460f38ef";
        const trangThaiMon = mon.trangThai || "Đang phục vụ";
        const currentCatId = mon.danhMucId;

        const matchedCat = globalCategories.find(c => c.id === currentCatId);
        const textDanhMuc = matchedCat ? matchedCat.tenDanhMuc : "Món chính";
        const statusBadge = trangThaiMon === "Đang phục vụ" ? `<span class="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span> Đang phục vụ</span>` : `<span class="bg-gray-100 text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center"><span class="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1"></span> Tạm hết</span>`;

        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50 transition border-b border-gray-100";
        tr.innerHTML = `<td class="p-4 text-center text-gray-400 font-bold">#${idMonAn}</td><td class="p-4 flex items-center space-x-3"><img src="${linkAnh}" class="w-11 h-11 object-cover rounded-xl border border-gray-100 shadow-xs" onerror="this.src='https://images.unsplash.com/photo-1546964124-0cce460f38ef'"><span class="font-bold text-gray-900 text-xs">${tenMon}</span></td><td class="p-4 uppercase text-[10px] font-bold text-orange-600 tracking-wider">${textDanhMuc}</td><td class="p-4 font-black text-orange-800 text-xs">${Number(giaMon).toLocaleString('vi-VN')} đ</td><td class="p-4">${statusBadge}</td><td class="p-4 text-center space-x-1.5"><button onclick='editDishClick(${JSON.stringify(mon)})' class="text-gray-400 hover:text-blue-600 p-1 rounded cursor-pointer transition"><i class="fa-regular fa-pen-to-square"></i></button><button onclick="deleteDish(${idMonAn})" class="text-gray-400 hover:text-red-600 p-1 rounded cursor-pointer transition"><i class="fa-regular fa-trash-can"></i></button></td>`;
        tbody.appendChild(tr);
    });
}

function filterByGlobalCategory(catId) {
    if (catId === 'Tất cả') renderDishesTable(globalDishes);
    else renderDishesTable(globalDishes.filter(m => (m.danhMucId || m.DanhMucId) === catId));
}

function openMenuFormModal() { document.getElementById("lblMenuModalTitle").innerText = "Thêm món ăn mới"; document.getElementById("txtDishId").value = ""; document.getElementById("txtDishName").value = ""; document.getElementById("txtDishPrice").value = ""; document.getElementById("fileDishImage").value = ""; if (globalCategories.length > 0 && document.getElementById("ddlDishCategory")) document.getElementById("ddlDishCategory").value = globalCategories[0].id; const modal = document.getElementById("menuFormModal"); if (modal) modal.classList.remove("hidden"); setTimeout(() => { if (modal) modal.classList.remove("opacity-0"); }, 15); }
function closeMenuFormModal() { const modal = document.getElementById("menuFormModal"); if (modal) { modal.classList.add("opacity-0"); setTimeout(() => modal.classList.add("hidden"), 300); } }
function editDishClick(monAn) { openMenuFormModal(); document.getElementById("lblMenuModalTitle").innerText = "Cập nhật thông tin món ăn"; document.getElementById("txtDishId").value = monAn.id || monAn.Id; document.getElementById("txtDishName").value = monAn.tenMon || monAn.TenMon || ""; document.getElementById("txtDishPrice").value = monAn.gia || monAn.Gia || 0; if (document.getElementById("ddlDishStatus")) document.getElementById("ddlDishStatus").value = monAn.trangThai || monAn.TrangThai || "Đang phục vụ"; if (document.getElementById("ddlDishCategory")) document.getElementById("ddlDishCategory").value = monAn.danhMucId || monAn.DanhMucId; }

async function saveMenuData() {
    const id = document.getElementById("txtDishId").value;
    const fileInput = document.getElementById("fileDishImage");
    const formData = new FormData();

    formData.append("tenMonAn", document.getElementById("txtDishName").value.trim());
    formData.append("danhMucId", parseInt(document.getElementById("ddlDishCategory").value));
    formData.append("giaBan", parseFloat(document.getElementById("txtDishPrice").value));
    formData.append("trangThai", document.getElementById("ddlDishStatus").value);
    if (fileInput && fileInput.files.length > 0) formData.append("hinhAnhFile", fileInput.files[0]);

    let url = id ? `/api/MonAn/${id}` : "/api/MonAn";
    let method = id ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method: method,
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        if (res.ok) {
            showToast("Lưu món ăn lên mây Cloudinary thành công!", "success");
            closeMenuFormModal();
            await loadAllDishes();
            renderDishesTable(globalDishes);
        } else {
            const errData = await res.json();
            showToast(errData.message || "Lỗi khi upload ảnh món ăn!", "error");
        }
    } catch (err) { console.error(err); }
}

async function deleteDish(id) {
    if (!id || !confirm("Xóa vĩnh viễn món ăn này khỏi hệ thống?")) return;
    try {
        const res = await fetch(`/api/MonAn/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            showToast("Xóa món ăn thành công!", "success");
            await loadAllDishes();
            renderDishesTable(globalDishes);
        }
    } catch (err) { console.error(err); }
}

function openLogoutModal() { const modal = document.getElementById("logoutModal"); if (modal) { modal.classList.remove("hidden"); setTimeout(() => { modal.classList.remove("opacity-0"); }, 10); } }
function closeLogoutModal() { const modal = document.getElementById("logoutModal"); if (modal) { modal.classList.add("opacity-0"); setTimeout(() => modal.classList.add("hidden"), 300); } }
function confirmLogout() { localStorage.removeItem("token"); window.location.href = "/"; }