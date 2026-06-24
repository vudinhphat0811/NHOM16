async function loadAllDishes() {
    try {
        const res = await fetch("/api/MonAn");
        if (res.ok) {
            globalDishes = await res.json();
            if (document.getElementById("lblTotalDishes")) document.getElementById("lblTotalDishes").innerText = globalDishes.length;
        }
    } catch (err) { console.error("Lỗi tải thực đơn món ăn:", err); }
}

function renderDishesTable(dishes) {
    const tbody = document.getElementById("tbMenuBody");
    if (!tbody) return; tbody.innerHTML = "";
    if (dishes.length === 0) { tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-400 italic">Thực đơn hiện tại đang trống!</td></tr>`; return; }

    dishes.forEach(mon => {
        const idMonAn = mon.id; const tenMon = mon.tenMon; const giaMon = mon.gia;
        const linkAnh = mon.hinhAnh || "https://images.unsplash.com/photo-1546964124-0cce460f38ef";
        const trangThaiMon = mon.trangThai || "Đang phục vụ"; const currentCatId = mon.danhMucId;

        const matchedCat = globalCategories.find(c => (c.id !== undefined ? c.id : c.Id) === currentCatId);
        const textDanhMuc = matchedCat ? (matchedCat.tenDanhMuc || matchedCat.TenDanhMuc) : "Món chính";
        const statusBadge = trangThaiMon === "Đang phục vụ" ? `<span class="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1"></span> Đang phục vụ</span>` : `<span class="bg-gray-100 text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center"><span class="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1"></span> Tạm hết</span>`;

        const tr = document.createElement("tr"); tr.className = "hover:bg-gray-50 transition border-b border-gray-100";
        tr.innerHTML = `<td class="p-4 text-center text-gray-400 font-bold">#${idMonAn}</td><td class="p-4 flex items-center space-x-3"><img src="${linkAnh}" class="w-11 h-11 object-cover rounded-xl border border-gray-100 shadow-xs" onerror="this.src='https://images.unsplash.com/photo-1546964124-0cce460f38ef'"><span class="font-bold text-gray-900 text-xs">${tenMon}</span></td><td class="p-4 uppercase text-[10px] font-bold text-orange-600 tracking-wider">${textDanhMuc}</td><td class="p-4 font-black text-orange-800 text-xs">${Number(giaMon).toLocaleString('vi-VN')} đ</td><td class="p-4">${statusBadge}</td><td class="p-4 text-center space-x-1.5"><button onclick='editDishClick(${JSON.stringify(mon)})' class="text-gray-400 hover:text-blue-600 p-1 rounded cursor-pointer transition"><i class="fa-regular fa-pen-to-square"></i></button><button onclick="deleteDish(${idMonAn})" class="text-gray-400 hover:text-red-600 p-1 rounded cursor-pointer transition"><i class="fa-regular fa-trash-can"></i></button></td>`;
        tbody.appendChild(tr);
    });
}

function filterByGlobalCategory(catId) {
    if (catId === 'Tất cả') renderDishesTable(globalDishes);
    else renderDishesTable(globalDishes.filter(m => (m.danhMucId || m.DanhMucId) === catId));
}

function openMenuFormModal() { document.getElementById("lblMenuModalTitle").innerText = "Thêm món ăn mới"; document.getElementById("txtDishId").value = ""; document.getElementById("txtDishName").value = ""; document.getElementById("txtDishPrice").value = ""; document.getElementById("fileDishImage").value = ""; const modal = document.getElementById("menuFormModal"); if (modal) { modal.classList.remove("hidden"); setTimeout(() => { modal.classList.remove("opacity-0"); }, 15); } }
function closeMenuFormModal() { const modal = document.getElementById("menuFormModal"); if (modal) { modal.classList.add("opacity-0"); setTimeout(() => modal.classList.add("hidden"), 300); } }
function editDishClick(monAn) { openMenuFormModal(); document.getElementById("lblMenuModalTitle").innerText = "Cập nhật thông tin món ăn"; document.getElementById("txtDishId").value = monAn.id || monAn.Id; document.getElementById("txtDishName").value = monAn.tenMon || monAn.TenMon || ""; document.getElementById("txtDishPrice").value = monAn.gia || monAn.Gia || 0; }

async function saveMenuData() {
    const id = document.getElementById("txtDishId").value; const fileInput = document.getElementById("fileDishImage"); const formData = new FormData();
    formData.append("tenMonAn", document.getElementById("txtDishName").value.trim()); formData.append("danhMucId", parseInt(document.getElementById("ddlDishCategory").value)); formData.append("giaBan", parseFloat(document.getElementById("txtDishPrice").value)); formData.append("trangThai", document.getElementById("ddlDishStatus").value);
    if (fileInput && fileInput.files.length > 0) formData.append("hinhAnhFile", fileInput.files[0]);

    let url = id ? `/api/MonAn/${id}` : "/api/MonAn"; let method = id ? "PUT" : "POST";
    try {
        const res = await fetch(url, { method: method, headers: { "Authorization": `Bearer ${token}` }, body: formData });
        if (res.ok) { showToast("Lưu món ăn thành công!", "success"); closeMenuFormModal(); await loadAllDishes(); renderDishesTable(globalDishes); }
    } catch (err) { console.error(err); }
}

async function deleteDish(id) {
    if (!id || !confirm("Xóa vĩnh viễn món ăn khỏi hệ thống?")) return;
    try {
        const res = await fetch(`/api/MonAn/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) { showToast("Xóa món ăn thành công!", "success"); await loadAllDishes(); renderDishesTable(globalDishes); }
    } catch (err) { console.error(err); }
}