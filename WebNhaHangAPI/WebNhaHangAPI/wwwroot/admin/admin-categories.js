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
                const idCat = cat.id !== undefined ? cat.id : cat.Id;
                const nameCat = cat.tenDanhMuc || cat.TenDanhMuc || "";

                if (tbody) {
                    const tr = document.createElement("tr"); tr.className = "hover:bg-gray-50 transition border-b border-gray-100";
                    tr.innerHTML = `<td class="p-4 text-center text-gray-400 font-bold">#${idCat}</td><td class="p-4 text-gray-900 font-bold text-sm">${nameCat}</td><td class="p-4 text-center space-x-2"><button onclick='editCategoryClick(${JSON.stringify(cat)})' style="cursor: pointer !important;" class="text-gray-400 hover:text-blue-600 p-1 rounded"><i class="fa-regular fa-pen-to-square"></i></button><button onclick="deleteCategory(${idCat})" style="cursor: pointer !important;" class="text-gray-400 hover:text-red-600 p-1 rounded"><i class="fa-regular fa-trash-can"></i></button></td>`;
                    tbody.appendChild(tr);
                }
                if (ddlCategory) {
                    const opt = document.createElement("option"); opt.value = idCat; opt.innerText = nameCat; ddlCategory.appendChild(opt);
                }
                if (filterContainer) {
                    const btnFilter = document.createElement("button"); btnFilter.className = "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg cursor-pointer transition font-bold";
                    btnFilter.innerText = nameCat; btnFilter.onclick = () => filterByGlobalCategory(idCat); filterContainer.appendChild(btnFilter);
                }
            });
        }
    } catch (err) { console.error("Lỗi tải danh mục:", err); }
}

function openCategoryFormModal() {
    if (document.getElementById("lblCategoryModalTitle")) document.getElementById("lblCategoryModalTitle").innerText = "Thêm danh mục mới";
    if (document.getElementById("txtCategoryId")) document.getElementById("txtCategoryId").value = "";
    if (document.getElementById("txtCategoryName")) document.getElementById("txtCategoryName").value = "";
    const modal = document.getElementById("categoryFormModal");
    if (modal) { modal.classList.remove("hidden"); setTimeout(() => { modal.classList.remove("opacity-0"); }, 15); }
}

function closeCategoryFormModal() { const modal = document.getElementById("categoryFormModal"); if (modal) { modal.classList.add("opacity-0"); setTimeout(() => modal.classList.add("hidden"), 300); } }

function editCategoryClick(cat) {
    openCategoryFormModal();
    if (document.getElementById("lblCategoryModalTitle")) document.getElementById("lblCategoryModalTitle").innerText = "Cập nhật danh mục";
    document.getElementById("txtCategoryId").value = cat.id !== undefined ? cat.id : cat.Id;
    document.getElementById("txtCategoryName").value = cat.tenDanhMuc || cat.TenDanhMuc || "";
}

async function saveCategoryData() {
    const id = document.getElementById("txtCategoryId").value;
    const tenDanhMucValue = document.getElementById("txtCategoryName").value.trim();
    if (!tenDanhMucValue) { alert("Vui lòng nhập tên danh mục!"); return; }

    const bodyData = { tenDanhMuc: tenDanhMucValue };
    let url = id ? `/api/Admin/update-category/${id}` : "/api/Admin/add-category";
    let method = id ? "PUT" : "POST";

    try {
        const res = await fetch(url, { method: method, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(bodyData) });
        if (res.ok) { showToast("Lưu danh mục thành công!", "success"); closeCategoryFormModal(); await loadAllCategories(); }
    } catch (err) { console.error(err); }
}

async function deleteCategory(id) {
    if (!id || !confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
    try {
        const res = await fetch(`/api/Admin/delete-category/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
        if (res.ok) { showToast("Xóa danh mục thành công!", "success"); await loadAllCategories(); }
    } catch (err) { console.error(err); }
}