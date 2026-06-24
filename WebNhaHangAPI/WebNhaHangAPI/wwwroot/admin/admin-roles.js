// =========================================================================
// QUẢN LÝ PHÂN QUYỀN HỆ THỐNG TRONG DASHBOARD (ADMIN-ROLES.JS)
// =========================================================================

async function taiDanhSachQuyenHeThong() {
    const container = document.getElementById("divRoleGroupContainer");
    if (!container) return;

    try {
        const currentToken = localStorage.getItem("token");
        const res = await fetch("/api/Admin/get-all-users-with-roles", {
            method: "GET",
            headers: { "Authorization": `Bearer ${currentToken}` }
        });

        if (res.ok) {
            mangToanCucNhanVien = await res.json();
            container.innerHTML = "";

            if (!mangToanCucNhanVien || mangToanCucNhanVien.length === 0) {
                container.innerHTML = `<p class="text-center text-gray-400 py-4 italic">Hệ thống chưa có nhân viên nào.</p>`;
                return;
            }

            mangToanCucNhanVien.forEach((user, index) => {
                // Kiểm tra an toàn mảng roles để tránh lỗi null dữ liệu
                let roleName = "Customer";
                if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
                    roleName = user.roles[0];
                } else if (user.Roles && Array.isArray(user.Roles) && user.Roles.length > 0) {
                    roleName = user.Roles[0];
                }

                const isSelected = index === 0;
                if (isSelected) emailNhanVienDangChon = user.email || user.Email || "";

                // Đọc an toàn cả id viết thường lẫn Id viết hoa từ database
                const userId = user.id !== undefined ? user.id : user.Id;
                const displayId = userId ? userId.toString().substring(0, 8) : "---";
                const userEmail = user.email || user.Email || "Không có email";

                const divCard = document.createElement("div");
                divCard.id = `user-role-card-${userId}`;
                divCard.className = `p-3 border rounded-xl flex justify-between items-center cursor-pointer transition ${isSelected ? 'bg-indigo-50/70 border-indigo-200' : 'bg-gray-50/50 border-gray-100 hover:bg-gray-50'}`;
                divCard.onclick = () => selectUserToConfigRole(userEmail, roleName, userId);

                divCard.innerHTML = `
                    <div>
                        <h4 class="font-extrabold text-xs text-gray-900 truncate max-w-[170px]">${userEmail}</h4>
                        <p class="text-[10px] text-gray-400 font-semibold mt-0.5">Mã ID: #${displayId}</p>
                    </div>
                    <span class="text-[9px] ${roleName === 'Admin' ? 'bg-orange-500' : 'bg-indigo-600'} text-white font-black px-2 py-0.5 rounded-md">${roleName}</span>
                `;
                container.appendChild(divCard);
            });

            // Tự động kích hoạt cấu hình cho nhân viên đầu tiên trong danh sách an toàn
            if (mangToanCucNhanVien.length > 0) {
                const firstUser = mangToanCucNhanVien[0];
                const firstUserId = firstUser.id !== undefined ? firstUser.id : firstUser.Id;
                const firstEmail = firstUser.email || firstUser.Email || "";
                let firstRole = "Customer";
                if (firstUser.roles && firstUser.roles.length > 0) firstRole = firstUser.roles[0];
                else if (firstUser.Roles && firstUser.Roles.length > 0) firstRole = firstUser.Roles[0];

                selectUserToConfigRole(firstEmail, firstRole, firstUserId);
            }
        } else {
            container.innerHTML = `<p class="text-center text-rose-500 py-4 italic">Lỗi máy chủ khi tải tài khoản.</p>`;
        }
    } catch (err) {
        console.error("Lỗi tải phân quyền hệ thống:", err);
        container.innerHTML = `<p class="text-center text-rose-500 py-4 italic">Lỗi kết nối mạng.</p>`;
    }
}

function selectUserToConfigRole(email, role, id) {
    emailNhanVienDangChon = email;
    if (document.getElementById("lblSelectedUserEmail")) {
        document.getElementById("lblSelectedUserEmail").innerText = `(${email})`;
    }
    if (document.getElementById("ddlUserRoleSelect")) {
        document.getElementById("ddlUserRoleSelect").value = role;
    }

    document.querySelectorAll("#divRoleGroupContainer > div").forEach(el => {
        el.className = "p-3 bg-gray-50/50 border border-gray-100 hover:bg-gray-50 rounded-xl flex justify-between items-center cursor-pointer transition";
    });

    const activeCard = document.getElementById(`user-role-card-${id}`);
    if (activeCard) {
        activeCard.className = "p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex justify-between items-center cursor-pointer transition";
    }

    thayDoiGiaoDienCheckboxTheoQuyen(role);
}

function thayDoiGiaoDienCheckboxTheoQuyen(role) {
    const tbody = document.getElementById("tbRoleMatrixBody");
    if (!tbody) return;

    const isAdmin = role === 'Admin';
    tbody.innerHTML = `
        <tr>
            <td class="px-6 py-4 font-bold text-gray-900">🏠 Trang chủ & Đặt bàn khách hàng</td>
            <td class="px-6 py-4 text-center"><i class="fa-solid fa-circle-check text-emerald-500 text-sm"></i> Bật</td>
            <td class="px-6 py-4 text-center"><i class="fa-solid fa-circle-check text-emerald-500 text-sm"></i> Bật</td>
        </tr>
        <tr>
            <td class="px-6 py-4 font-bold text-gray-900">📦 Quản lý đơn hàng & Báo cáo doanh thu (Admin)</td>
            <td class="px-6 py-4 text-center"><i class="fa-solid fa-circle-xmark text-gray-300 text-sm"></i> Khóa</td>
            <td class="px-6 py-4 text-center">${isAdmin ? '<i class="fa-solid fa-circle-check text-emerald-500 text-sm"></i> Cho phép' : '<i class="fa-solid fa-circle-xmark text-rose-500 text-sm"></i> Khóa'}</td>
        </tr>
        <tr>
            <td class="px-6 py-4 font-bold text-gray-900">🗺️ Thiết lập sơ đồ bàn & Thực đơn (Admin)</td>
            <td class="px-6 py-4 text-center"><i class="fa-solid fa-circle-xmark text-gray-300 text-sm"></i> Khóa</td>
            <td class="px-6 py-4 text-center">${isAdmin ? '<i class="fa-solid fa-circle-check text-emerald-500 text-sm"></i> Cho phép' : '<i class="fa-solid fa-circle-xmark text-rose-500 text-sm"></i> Khóa'}</td>
        </tr>
    `;
}

async function luuCauHinhPhanQuyen() {
    const roleMoi = document.getElementById("ddlUserRoleSelect").value;
    if (!emailNhanVienDangChon) return;

    try {
        const currentToken = localStorage.getItem("token");
        const res = await fetch("/api/Admin/update-user-role-matrix", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${currentToken}`
            },
            body: JSON.stringify({ email: emailNhanVienDangChon, tenQuyen: roleMoi })
        });

        if (res.ok) {
            if (typeof showToast === "function") showToast("Cập nhật phân quyền thành công!", "success");
            await taiDanhSachQuyenHeThong();
        }
    } catch (err) {
        console.error(err);
    }
}