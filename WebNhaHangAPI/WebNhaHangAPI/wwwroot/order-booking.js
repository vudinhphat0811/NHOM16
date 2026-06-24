
const token = localStorage.getItem("token");
let globalTotalDishPrice = 0;
let selectedDishesMap = {};
let currentSelectedTime = "18:30";
let currentActiveLocationId = null;
let allTablesList = [];
let rawDishesList = []; // Mảng thô phục vụ quét tính tiền tự động

document.addEventListener("DOMContentLoaded", async function () {
    const txtDate = document.getElementById("txtBookingDate");
    if (txtDate) txtDate.value = new Date().toISOString().split('T')[0];

    if (!token) {
        alert("Vui lòng đăng nhập tài khoản khách hàng!");
        window.location.href = "/login.html";
        return;
    }

    await verifyUserPermission();
    await loadLocationsAndTables();
    await loadDishesFromDatabase();
});

// 1. Xác thực thông tin khách hàng đăng nhập
async function verifyUserPermission() {
    try {
        const response = await fetch("/api/Admin/current-user-role", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.roles && (data.roles.includes("Admin") || data.roles.includes("Nhân viên"))) {
                alert("Tài khoản quản lý không được phép thực hiện tính năng đặt bàn!");
                window.location.href = "/admin/dashboard.html";
                return;
            }
            const displayName = data.email.split('@')[0];
            document.getElementById("lblUserName").innerText = data.email;
            document.getElementById("lblAvatarCircle").innerText = displayName.substring(0, 2).toUpperCase();
        } else {
            localStorage.removeItem("token");
            window.location.href = "/login.html";
        }
    } catch (error) {
        console.error("Lỗi hệ thống xác thực:", error);
    }
}

// 2. Tải danh sách Khu Vực (Tabs) và toàn bộ Bàn Ăn từ Database
async function loadLocationsAndTables() {
    try {
        const locRes = await fetch("/api/KhuVuc");
        const locations = await locRes.json();

        const tableRes = await fetch("/api/BanAn");
        allTablesList = await tableRes.json();

        const tabContainer = document.getElementById("divLocationTabs");
        if (!tabContainer) return;
        tabContainer.innerHTML = "";

        if (locations.length > 0) {
            currentActiveLocationId = locations[0].id || locations[0].Id;

            locations.forEach((loc, index) => {
                const locId = loc.id || loc.Id;
                const locName = loc.tenKhuVuc || loc.TenKhuVuc;

                const btn = document.createElement("button");
                btn.type = "button";
                if (index === 0) {
                    btn.className = "text-[#a13d06] border-b-2 border-[#a13d06] pb-2 px-1 location-tab-btn font-bold cursor-pointer";
                } else {
                    btn.className = "text-gray-400 hover:text-gray-600 pb-2 px-1 transition location-tab-btn font-bold cursor-pointer";
                }
                btn.innerText = locName;
                btn.onclick = function () {
                    document.querySelectorAll(".location-tab-btn").forEach(b => {
                        b.classList.remove("text-[#a13d06]", "border-b-2", "border-[#a13d06]");
                        b.classList.add("text-gray-400");
                    });
                    btn.classList.remove("text-gray-400");
                    btn.classList.add("text-[#a13d06]", "border-b-2", "border-[#a13d06]");

                    currentActiveLocationId = locId;
                    renderTableCanvas();
                };
                tabContainer.appendChild(btn);
            });

            renderTableCanvas();
        }
    } catch (error) {
        console.error("Lỗi kết nối sơ đồ vị trí mặt bằng:", error);
    }
}

// 3. Render bàn lên sơ đồ theo tọa độ thực tế
function renderTableCanvas() {
    const canvas = document.getElementById("divMapCanvas");
    if (!canvas) return;
    canvas.innerHTML = "";

    const filteredTables = allTablesList.filter(t => {
        const kId = t.khuVucId || t.KhuVucId;
        const isChinh = t.isChinhThuc !== undefined ? t.isChinhThuc : t.IsChinhThuc;
        return kId === currentActiveLocationId && isChinh;
    });

    if (filteredTables.length === 0) {
        canvas.innerHTML = `<p class="text-gray-400 italic text-center pt-20 text-xs">Khu vực này hiện chưa được bố trí bàn ăn sơ đồ chính thức.</p>`;
        return;
    }

    filteredTables.forEach(table => {
        const tId = table.id || table.Id;
        const tName = table.tenBan || table.TenBan;
        const tCapacity = table.soChoNgoi || table.SoChoNgoi;
        const tStatus = (table.trangThai || table.TrangThai || "Trống").trim();
        const tX = table.viTriX || table.ViTriX || 20;
        const tY = table.viTriY || table.ViTriY || 40;

        const divTable = document.createElement("div");
        divTable.style.position = "absolute";
        divTable.style.left = `${tX}px`;
        divTable.style.top = `${tY}px`;

        let statusClass = "border-emerald-500 hover:bg-emerald-50/50";
        if (tStatus !== "Trống") {
            statusClass = "border-red-400 opacity-60 cursor-not-allowed bg-red-50/30 text-red-700";
        }

        divTable.className = `w-20 h-14 bg-white border-2 ${statusClass} rounded-xl flex flex-col items-center justify-center shadow-xs cursor-pointer transition select-none table-item-node`;
        divTable.setAttribute("data-id", tId);
        divTable.innerHTML = `
                <span class="font-extrabold text-xs text-gray-800">${tName}</span>
                <span class="text-[9px] text-gray-400 font-medium mt-0.5"><i class="fa-solid fa-user-group text-[8px] mr-0.5"></i> ${tCapacity}</span>
            `;

        if (tStatus === "Trống") {
            divTable.onclick = function () {
                document.querySelectorAll(".table-item-node").forEach(node => {
                    const nId = parseInt(node.getAttribute("data-id"));
                    const originTable = allTablesList.find(t => (t.id || t.Id) === nId);
                    const originStatus = (originTable.trangThai || originTable.TrangThai || "Trống").trim();
                    if (originStatus === "Trống") {
                        node.className = "w-20 h-14 bg-white border-2 border-emerald-500 rounded-xl flex flex-col items-center justify-center shadow-xs cursor-pointer transition select-none table-item-node";
                    }
                });

                divTable.className = "w-20 h-14 bg-white border-2 border-amber-400 rounded-xl flex flex-col items-center justify-center shadow-xs cursor-pointer ring-4 ring-amber-400/20 select-none table-item-node";
                document.getElementById("lblSelectedTable").innerText = tName;
                document.getElementById("txtSelectedTableId").value = tId;
            };
        }

        canvas.appendChild(divTable);
    });
}

// 4. Tải thực đơn từ database và render cấu trúc không có nút "Thêm"
async function loadDishesFromDatabase() {
    try {
        const res = await fetch("/api/MonAn");
        rawDishesList = await res.json(); // Gán vào mảng toàn cục để JS tính tiền quét được
        const menuContainer = document.getElementById("divDishMenuContainer");
        menuContainer.innerHTML = "";

        if (rawDishesList.length === 0) {
            menuContainer.innerHTML = `<p class="text-gray-400 italic text-xs text-center py-4">Nhà hàng chưa cập nhật danh sách thực đơn trực tuyến hôm nay.</p>`;
            return;
        }

        rawDishesList.forEach(dish => {
            const dId = dish.id || dish.Id;
            const dName = dish.tenMon || dish.TenMon;
            const dPrice = dish.gia || dish.Gia;
            const dImg = dish.hinhAnh || "https://images.unsplash.com/photo-1546964124-0cce460f38ef?auto=format&fit=crop&w=150&q=80";

            const item = document.createElement("div");
            item.className = "flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50/20";

            // ĐÃ XÓA HẲN NÚT "THÊM" - ĐỒNG BỘ ID Ô SỐ LƯỢNG DẠNG ${dId}-count CHUẨN FILE JS
            item.innerHTML = `
                            <div class="flex items-center space-x-3">
                                <img src="${dImg}" class="w-14 h-14 object-cover rounded-lg" alt="${dName}">
                                <div>
                                    <h4 class="text-xs font-bold text-gray-800">${dName}</h4>
                                    <p class="text-[#a13d06] font-extrabold text-xs mt-0.5">${parseFloat(dPrice).toLocaleString('vi-VN')}đ</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-3">
                                <div class="flex items-center border border-gray-200 rounded-md bg-white text-xs">
                                    <button type="button" onclick="updateDishCount('${dId}', -1)" class="px-2 py-1 font-bold text-gray-400 hover:bg-gray-50 cursor-pointer">-</button>
                                    <span id="${dId}-count" class="px-3 font-bold text-gray-700">0</span>
                                    <button type="button" onclick="updateDishCount('${dId}', 1)" class="px-2 py-1 font-bold text-gray-400 hover:bg-gray-50 cursor-pointer">+</button>
                                </div>
                            </div>
                        `;
            menuContainer.appendChild(item);
        });
    } catch (error) {
        console.error("Lỗi kết nối tải món ăn:", error);
    }
}

function selectTimeSlot(element) {
    document.querySelectorAll("#divTimeSlots > div").forEach(slot => {
        slot.className = "border border-gray-200 rounded-lg p-2 hover:bg-amber-50/50 transition cursor-pointer";
    });
    element.className = "border-2 border-[#a13d06] text-[#a13d06] font-bold rounded-lg p-2 bg-amber-50/30 cursor-pointer";
    currentSelectedTime = element.innerText.trim();
}

function updateDishCount(id, amount) {
    const span = document.getElementById(`${id}-count`);
    if (!span) return;

    let count = parseInt(span.innerText) + amount;
    if (count < 0) return;

    span.innerText = count;
    tinhToanTongTienTuDong(); // Gọi hàm tự nảy tiền
}

function tinhToanTongTienTuDong() {
    globalTotalDishPrice = 0;
    selectedDishesMap = {};

    rawDishesList.forEach(dish => {
        const dId = dish.id || dish.Id;
        const dName = dish.tenMon || dish.TenMon;
        const dPrice = dish.gia || dish.Gia;

        const countSpan = document.getElementById(`${dId}-count`);
        const qty = countSpan ? parseInt(countSpan.innerText) || 0 : 0;

        if (qty > 0) {
            selectedDishesMap[dName] = qty;
            globalTotalDishPrice += dPrice * qty;
        }
    });

    let textList = Object.entries(selectedDishesMap)
        .map(([dishName, qtty]) => `${dishName} (x${qtty})`)
        .join(", ");

    document.getElementById("lblSelectedDishes").innerText = textList || "Chưa có món ăn nào được chọn";
    document.getElementById("lblTotalDishPrice").innerText = globalTotalDishPrice.toLocaleString('vi-VN') + "đ";
}

function increaseGuests() {
    const input = document.getElementById("txtGuests");
    if (input) { let val = parseInt(input.value); if (val < 30) input.value = val + 1; }
}

function decreaseGuests() {
    const input = document.getElementById("txtGuests");
    if (input) { let val = parseInt(input.value); if (val > 1) input.value = val - 1; }
}

function handleBookingSubmit() {
    const tableId = document.getElementById("txtSelectedTableId").value;
    const tableName = document.getElementById("lblSelectedTable").innerText;
    const guestCount = document.getElementById("txtGuests").value;
    const bookingDate = document.getElementById("txtBookingDate").value;

    if (!tableId || tableName === "Chưa chọn") {
        showToast("Vui lòng click chọn một vị trí bàn trống trên sơ đồ mặt bằng!", "error");
        return;
    }
    if (!bookingDate) {
        showToast("Vui lòng lựa chọn ngày đến nhà hàng lịch hẹn!", "error");
        return;
    }

    const checkoutBooking = {
        banAnId: parseInt(tableId),
        tenBan: tableName,
        soLuongKhach: parseInt(guestCount),
        ngayDen: bookingDate,
        khungGio: currentSelectedTime,
        ghiChu: document.getElementById("txtNotes").value.trim()
    };
    localStorage.setItem("checkout_booking", JSON.stringify(checkoutBooking));
    localStorage.setItem("checkout_dishes", JSON.stringify(selectedDishesMap));
    localStorage.setItem("checkout_total_dish_price", globalTotalDishPrice);

    showToast("Đang chuyển tiếp thông tin đơn đặt lịch...", "success");
    setTimeout(() => { window.location.href = "/checkout.html"; }, 800);
}

function showToast(message, type = 'success') {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-rose-500';
    const icon = type === 'success' ? '<i class="fa-solid fa-circle-check text-lg"></i>' : '<i class="fa-solid fa-circle-xmark text-lg"></i>';

    const toast = document.createElement("div");
    toast.className = `flex items-center space-x-3 ${bgColor} text-white text-sm font-bold px-5 py-3.5 rounded-xl shadow-lg transform translate-x-full opacity-0 transition-all duration-300 ease-out pointer-events-auto min-w-[280px]`;
    toast.innerHTML = `<span>${icon}</span><span class="flex-1">${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => { toast.classList.remove("translate-x-full", "opacity-0"); }, 10);
    setTimeout(() => {
        toast.classList.add("translate-x-full", "opacity-0");
        setTimeout(() => { toast.remove(); }, 300);
    }, 3000);
}

function openLogoutModal() {
    const modal = document.getElementById("logoutModal");
    if (modal) { modal.classList.remove("hidden"); setTimeout(() => { modal.classList.remove("opacity-0"); }, 10); }
}

function closeLogoutModal() {
    const modal = document.getElementById("logoutModal");
    if (modal) { modal.classList.add("opacity-0"); setTimeout(() => modal.classList.add("hidden"), 300); }
}

function confirmLogout() {
    closeLogoutModal();
    localStorage.removeItem("token");
    window.location.href = "/";
}