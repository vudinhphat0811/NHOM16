async function fetchAdminOrdersData() {
    try {
        const res = await fetch("/api/DatBan/tat-ca-don", { method: "GET", headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) {
            const rawOrders = await res.json();
            const deletedIds = JSON.parse(localStorage.getItem("admin_deleted_orders") || "[]");
            adminOrdersList = rawOrders.filter(o => !deletedIds.includes(o.id || o.Id));
            calculateOrderStatistics(adminOrdersList);
            renderOrderTable(adminOrdersList);
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

function renderOrderTable(orders) {
    const tbody = document.getElementById("tbOrderDashboardBody");
    if (!tbody) return; tbody.innerHTML = "";

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
        const currentOrderId = order.id !== undefined ? order.id : order.Id;

        if (status === "Chờ xác nhận") {
            statusBadge = `<span class="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">● Chờ duyệt cọc</span>`;
            actionsHtml = `<div class="flex items-center justify-center gap-1.5"><button onclick="approveAdminDeposit('${currentOrderId}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[10px] transition uppercase cursor-pointer"><i class="fa-solid fa-check"></i> Duyệt</button><button onclick="executeRejectBooking('${currentOrderId}')" class="bg-rose-50 hover:bg-rose-600 text-white font-bold px-2 py-1 rounded text-[10px] transition uppercase cursor-pointer"><i class="fa-regular fa-trash-can"></i> Hủy</button></div>`;
        }
        else if (status === "Đã xác nhận" || status === "Đã giữ bàn") {
            statusBadge = `<span class="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">● Đã giữ bàn</span>`;
            actionsHtml = `<div class="flex items-center justify-center gap-1.5"><button onclick="executeCheckInCustomer('${currentOrderId}')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded text-[10px] transition uppercase cursor-pointer"><i class="fa-solid fa-user-check"></i> Khách Đến</button><button onclick="executeRejectBooking('${currentOrderId}')" class="bg-rose-500 hover:bg-rose-600 text-white font-bold px-2 py-1 rounded text-[10px] transition uppercase cursor-pointer"><i class="fa-solid fa-ban"></i> Hủy</button></div>`;
        }
        else if (status === "Đã thanh toán" || status === "Hoàn thành") {
            statusBadge = `<span class="bg-gray-100 text-gray-400 border border-gray-200 px-2 py-0.5 rounded text-[10px] font-bold">● Hoàn thành</span>`;
            actionsHtml = `<span class="text-[10px] text-gray-400 font-bold italic">Đã lưu báo cáo</span>`;
        } else {
            statusBadge = `<span class="bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold">● Đã hủy</span>`;
            actionsHtml = `<div class="flex items-center justify-center gap-1.5"><button onclick="deleteCanceledOrderRow('${currentOrderId}')" class="bg-gray-600 hover:bg-gray-800 text-white font-bold px-3 py-1 rounded text-[10px] transition uppercase cursor-pointer"><i class="fa-solid fa-trash-can"></i> Xóa đơn</button></div>`;
        }

        const tableObj = order.banAn || order.BanAn;
        const tableName = tableObj ? (tableObj.tenBan || tableObj.TenBan) : `Bàn ${order.banAnId}`;
        const tr = document.createElement("tr"); tr.className = "hover:bg-gray-50/50 transition border-b border-gray-100";
        tr.innerHTML = `<td class="p-4 text-center font-bold text-gray-400">#BK-${currentOrderId}</td><td class="p-4"><div class="font-bold text-gray-900">${order.tenKhachHang || order.TenKhachHang}</div><div class="text-[10px] text-gray-400 font-normal mt-0.5">${order.soDienThoai || order.SoDienThoai}</div></td><td class="p-4 font-bold text-gray-700">${dateStr}<br><span class="text-[10px] text-[#cc4e11]">${timeStr}</span></td><td class="p-4 font-black text-orange-800">${tableName}</td><td class="p-4 text-center text-gray-500">${order.soLuongKhach || order.SoLuongKhach} người</td><td class="p-4 text-center">${statusBadge}</td><td class="p-4 text-center">${actionsHtml}</td>`;
        tbody.appendChild(tr);
    });
}

async function approveAdminDeposit(id) {
    if (!id || !confirm("Xác nhận duyệt cọc giữ chỗ cho đơn này?")) return;
    try {
        const res = await fetch(`/api/DatBan/${id.toString().trim()}/xac-nhan-coc?phuongThuc=Chuyển khoản`, { method: "PUT", headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) { showToast("Duyệt đơn giữ bàn thành công!", "success"); await fetchAdminOrdersData(); await loadAllTables(); }
    } catch (err) { showToast("Lỗi kết nối!", "error"); }
}

async function executeRejectBooking(id) {
    if (!id || !confirm("Xác nhận hủy đơn hàng này và giải phóng trạng thái bàn về Trống?")) return;
    try {
        const res = await fetch(`/api/DatBan/${id.toString().trim()}/khach-huy-ban`, { method: "PUT", headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) { showToast("Đã hủy đơn và giải phóng trạng thái bàn ăn thành công!", "success"); await fetchAdminOrdersData(); await loadAllTables(); }
    } catch (err) { showToast("Lỗi kết nối mạng!", "error"); }
}

async function executeCheckInCustomer(id) {
    if (!id || !confirm("Xác nhận khách đã đến nhà hàng ăn uống và hoàn tất hóa đơn này?")) return;
    try {
        const res = await fetch(`/api/DatBan/${id.toString().trim()}/thanh-toan-hoan-tat`, { method: "PUT", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } });
        if (res.ok) { showToast("Đã hoàn tất đơn đặt bàn thành công!", "success"); await fetchAdminOrdersData(); await loadAllTables(); }
    } catch (err) { showToast("Lỗi kết nối mạng!", "error"); }
}

function deleteCanceledOrderRow(id) {
    if (!id || !confirm("Bạn muốn xóa đơn đã hủy này?")) return;
    const safeId = id.toString().trim();
    const deletedIds = JSON.parse(localStorage.getItem("admin_deleted_orders") || "[]");
    if (!deletedIds.includes(safeId)) { deletedIds.push(safeId); localStorage.setItem("admin_deleted_orders", JSON.stringify(deletedIds)); }
    adminOrdersList = adminOrdersList.filter(o => (o.id !== undefined ? o.id : o.Id).toString().trim() !== safeId);
    calculateOrderStatistics(adminOrdersList); renderOrderTable(adminOrdersList);
}