// =========================================================================
// QUẢN LÝ KHU VỰC, SƠ ĐỒ BÀN ĂN & LUỒNG KÉO THẢ TỌA ĐỘ (ADMIN-TABLES.JS)
// =========================================================================

// 1. Hàm nạp danh sách khu vực vị trí (Tầng 1, Tầng 2,...)
async function loadAllLocations() {
    try {
        const res = await fetch("/api/Admin/get-all-locations");
        if (res.ok) {
            globalLocations = await res.json();
            if (document.getElementById("lblTotalLocationsCount")) {
                document.getElementById("lblTotalLocationsCount").innerText = globalLocations.length;
            }

            const miniTbody = document.getElementById("tbMiniLocationBody"); if (miniTbody) miniTbody.innerHTML = "";
            const ddlLocation = document.getElementById("ddlTableLocation"); if (ddlLocation) ddlLocation.innerHTML = "";
            const tabContainer = document.getElementById("divAdminLocationTabs"); if (tabContainer) tabContainer.innerHTML = "";

            // Thiết lập khu vực mặc định là phân loại đầu tiên nếu chưa chọn
            if (globalLocations.length > 0 && currentAdminLocationId === null) {
                currentAdminLocationId = globalLocations[0].id !== undefined ? globalLocations[0].id : globalLocations[0].Id;
            }

            globalLocations.forEach((loc) => {
                const idLoc = loc.id !== undefined ? loc.id : loc.Id;
                const nameLoc = loc.tenKhuVuc || loc.TenKhuVuc || "";

                if (miniTbody) {
                    const tr = document.createElement("tr"); tr.className = "hover:bg-gray-50 transition";
                    tr.innerHTML = `
                        <td class="py-2 text-center text-gray-400 font-bold">#${idLoc}</td>
                        <td class="py-2 text-gray-909 font-bold text-xs truncate max-w-[110px]" title="${nameLoc}">${nameLoc}</td>
                        <td class="py-2 text-center space-x-1 flex justify-center items-center">
                            <button onclick='editLocationClick(${JSON.stringify(loc)})' class="text-gray-400 hover:text-blue-600 p-1 cursor-pointer"><i class="fa-regular fa-pen-to-square text-[10px]"></i></button>
                            <button onclick="deleteLocation(${idLoc})" class="text-gray-400 hover:text-red-600 p-1 cursor-pointer"><i class="fa-regular fa-trash-can text-[10px]"></i></button>
                        </td>`;
                    miniTbody.appendChild(tr);
                }
                if (ddlLocation) {
                    const opt = document.createElement("option"); opt.value = idLoc; opt.innerText = nameLoc; ddlLocation.appendChild(opt);
                }
                if (tabContainer) {
                    const btnTab = document.createElement("button"); btnTab.type = "button";
                    const isTabActive = idLoc === currentAdminLocationId;

                    btnTab.className = isTabActive
                        ? "text-[#cc4e11] border-b-2 border-[#cc4e11] pb-2 px-1 location-tab-btn font-bold cursor-pointer transition-all"
                        : "text-gray-400 hover:text-gray-600 pb-2 px-1 location-tab-btn font-bold cursor-pointer transition-all";
                    btnTab.innerText = nameLoc;

                    btnTab.onclick = function () {
                        document.querySelectorAll(".location-tab-btn").forEach(b => b.className = "text-gray-400 hover:text-gray-600 pb-2 px-1 location-tab-btn font-bold cursor-pointer transition-all");
                        btnTab.className = "text-[#cc4e11] border-b-2 border-[#cc4e11] pb-2 px-1 location-tab-btn font-bold cursor-pointer transition-all";
                        currentAdminLocationId = idLoc;
                        renderAdminTableCanvas();
                    };
                    tabContainer.appendChild(btnTab);
                }
            });
        }
    } catch (err) { console.error("Lỗi tải khu vực vị trí:", err); }
}

function openLocationFormModal() {
    document.getElementById("lblLocationModalTitle").innerText = "Thêm khu vực mới";
    document.getElementById("txtLocationId").value = ""; document.getElementById("txtLocationName").value = "";
    const modal = document.getElementById("locationFormModal"); if (modal) modal.classList.remove("hidden");
    setTimeout(() => { if (modal) modal.classList.remove("opacity-0"); }, 15);
}
function closeLocationFormModal() { const modal = document.getElementById("locationFormModal"); if (modal) { modal.classList.add("opacity-0"); setTimeout(() => modal.classList.add("hidden"), 300); } }
function editLocationClick(loc) { openLocationFormModal(); document.getElementById("lblLocationModalTitle").innerText = "Cập nhật khu vực"; document.getElementById("txtLocationId").value = loc.id || loc.Id; document.getElementById("txtLocationName").value = loc.tenKhuVuc || loc.TenKhuVuc; }

async function saveLocationData() {
    const id = document.getElementById("txtLocationId").value; const bodyData = { tenKhuVuc: document.getElementById("txtLocationName").value.trim() };
    let url = id ? `/api/Admin/update-location/${id}` : "/api/Admin/add-location"; let method = id ? "PUT" : "POST";
    try {
        const res = await fetch(url, { method: method, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(bodyData) });
        if (res.ok) { showToast("Cập nhật khu vực thành công", "success"); closeLocationFormModal(); await loadAllLocations(); if (globalTables.length > 0) renderAdminTableCanvas(); }
    } catch (err) { console.error(err); }
}
async function deleteLocation(id) { if (!confirm("Xóa vị trí này?")) return; try { const res = await fetch(`/api/Admin/delete-location/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } }); if (res.ok) { showToast("Xóa thành công", "success"); await loadAllLocations(); await loadAllTables(); } } catch (err) { console.error(err); } }

// 2. Hàm nạp danh sách bàn ăn từ máy chủ
async function loadAllTables() {
    try {
        const res = await fetch("/api/Admin/get-all-tables");
        if (res.ok) {
            globalTables = await res.json();
            renderAdminTableCanvas();
        }
    } catch (err) { console.error("Lỗi kết nối loadAllTables:", err); }
}

// 3. Hàm kết xuất đồ họa Canvas sơ đồ bàn ăn và kích hoạt sự kiện Drag & Drop
function renderAdminTableCanvas() {
    const canvas = document.getElementById("divTableCanvas");
    const storage = document.getElementById("divTableStorage");
    if (!canvas || !storage) return;

    // Dọn sạch cấu trúc DOM cũ trước khi vẽ vòng lặp mới
    canvas.querySelectorAll('.table-item-card').forEach(el => el.remove());
    storage.querySelectorAll('.table-item-card').forEach(el => el.remove());

    // KÍCH HOẠT ĐỒNG BỘ LUỒNG THẢ BÀN (DROP) CHO CANVAS
    canvas.ondragover = (e) => { e.preventDefault(); };
    canvas.ondrop = async (e) => {
        e.preventDefault();
        const idDrop = e.dataTransfer.getData("text/plain");
        const offsetX = parseInt(e.dataTransfer.getData("offsetX") || "0");
        const offsetY = parseInt(e.dataTransfer.getData("offsetY") || "0");

        const rect = canvas.getBoundingClientRect();
        let newX = e.clientX - rect.left - offsetX;
        let newY = e.clientY - rect.top - offsetY;

        // Ràng buộc biên an toàn không cho tràn khung hình trái/trên
        if (newX < 0) newX = 0; if (newY < 0) newY = 0;

        const banAn = globalTables.find(t => (t.id || t.Id).toString() === idDrop.toString());
        if (!banAn) return;

        const targetId = banAn.id || banAn.Id;
        const targetKhuVucId = currentAdminLocationId;

        try {
            // Gửi API PUT đồng bộ cập nhật tọa độ mới xuống Database
            const res = await fetch(`/api/Admin/update-table/${targetId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    id: targetId,
                    tenBan: banAn.tenBan || banAn.TenBan,
                    soChoNgoi: banAn.soChoNgoi || banAn.SoChoNgoi,
                    trangThai: banAn.trangThai || banAn.TrangThai || "Trống",
                    viTriX: Math.round(newX),
                    viTriY: Math.round(newY),
                    isChinhThuc: true,
                    khuVucId: targetKhuVucId
                })
            });

            if (res.ok) {
                showToast("Đã lưu tọa độ sơ đồ bàn ăn mới thành công!", "success");
                banAn.viTriX = Math.round(newX);
                banAn.viTriY = Math.round(newY);
                banAn.isChinhThuc = true;
                banAn.khuVucId = targetKhuVucId;
                renderAdminTableCanvas(); // Vẽ lại map
            } else { showToast("Không thể đồng bộ vị trí bàn!", "error"); }
        } catch (err) { console.error(err); showToast("Lỗi kết nối máy chủ!", "error"); }
    };

    // KÍCH HOẠT LUỒNG TRẢ BÀN VỀ KHO CHỜ (DROP STORAGE)
    storage.ondragover = (e) => { e.preventDefault(); };
    storage.ondrop = async (e) => {
        e.preventDefault();
        const idDrop = e.dataTransfer.getData("text/plain");
        const banAn = globalTables.find(t => (t.id || t.Id).toString() === idDrop.toString());
        if (!banAn || !banAn.isChinhThuc) return;

        const targetId = banAn.id || banAn.Id;
        try {
            const res = await fetch(`/api/Admin/update-table/${targetId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    id: targetId,
                    tenBan: banAn.tenBan || banAn.TenBan,
                    soChoNgoi: banAn.soChoNgoi || banAn.SoChoNgoi,
                    trangThai: banAn.trangThai || banAn.TrangThai || "Trống",
                    viTriX: 0, viTriY: 0,
                    isChinhThuc: false,
                    khuVucId: banAn.khuVucId || banAn.KhuVucId
                })
            });
            if (res.ok) {
                showToast("Đã đưa bàn về kho lưu trữ chờ điều phối!", "success");
                banAn.viTriX = 0; banAn.viTriY = 0; banAn.isChinhThuc = false;
                renderAdminTableCanvas();
            }
        } catch (err) { console.error(err); }
    };

    // VÒNG LẶP DỰA TRÊN DỮ LIỆU ĐỂ RENDER THÀNH THẺ ĐỒ HỌA
    globalTables.forEach(ban => {
        const idBan = ban.id || ban.Id; const tenBan = ban.tenBan || ban.TenBan; const trangThai = ban.trangThai || ban.TrangThai || "Trống"; const choNgoi = ban.soChoNgoi || ban.SoChoNgoi || 4; const isChinhThuc = ban.isChinhThuc || ban.IsChinhThuc || false; const currentKhuVucId = ban.khuVucId || ban.KhuVucId;
        const matchedLoc = globalLocations.find(l => (l.id !== undefined ? l.id : l.Id) === currentKhuVucId); const tenKhuVuc = matchedLoc ? (matchedLoc.tenKhuVuc || matchedLoc.TenKhuVuc) : "Chưa rõ tầng";

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
    const bodyData = {
        id: id ? parseInt(id) : 0,
        tenBan: document.getElementById("txtTableName").value.trim(),
        soChoNgoi: parseInt(document.getElementById("txtTableCapacity").value) || 4,
        trangThai: document.getElementById("ddlTableStatus").value,
        khuVucId: parseInt(document.getElementById("ddlTableLocation").value),
        isChinhThuc: document.getElementById("txtTableIsChinhThuc").value === "true"
    };
    let url = id ? `/api/Admin/update-table/${id}` : "/api/Admin/add-table"; let method = id ? "PUT" : "POST";
    try {
        const res = await fetch(url, { method: method, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(bodyData) });
        if (res.ok) { showToast("Lưu bàn thành công!", "success"); closeTableFormModal(); await loadAllTables(); }
    } catch (err) { console.error(err); }
}

async function deleteTable(id) { if (!confirm("Xóa bàn ăn này?")) return; try { const res = await fetch(`/api/Admin/delete-table/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } }); if (res.ok) { showToast("Xóa bàn thành công", "success"); await loadAllTables(); } } catch (err) { console.error(err); } }