using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Threading.Tasks;
using WebNhaHangAPI.Data;
using WebNhaHangAPI.Models;

namespace WebNhaHangAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly DbContextNhaHang _context; // Đảm bảo sử dụng chính xác DbContextNhaHang

        public AdminController(UserManager<IdentityUser> userManager, RoleManager<IdentityRole> roleManager, DbContextNhaHang context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
        }

        // =========================================================================
        // ================= 1. API PHÂN QUYỀN VÀ XÁC THỰC TÀI KHOẢN =================
        // =========================================================================

        [HttpPost("set-role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SetRole([FromBody] RequestGanQuyen model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null) return BadRequest(new { message = "Không tìm thấy tài khoản email này!" });
            var roleExists = await _roleManager.RoleExistsAsync(model.TenQuyen);
            if (!roleExists) return BadRequest(new { message = $"Quyền '{model.TenQuyen}' không tồn tại!" });
            var result = await _userManager.AddToRoleAsync(user, model.TenQuyen);
            if (result.Succeeded) return Ok(new { message = $"Đã cấp quyền '{model.TenQuyen}' cho {model.Email}!" });
            return BadRequest(new { message = "Cấp quyền thất bại!", errors = result.Errors });
        }

        [HttpGet("current-user-role")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUserRole()
        {
            var userEmail = User.Identity?.Name ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user == null) return NotFound(new { message = "Không tìm thấy thông tin tài khoản!" });
            var roles = await _userManager.GetRolesAsync(user);
            return Ok(new { email = user.Email, roles = roles });
        }

        // =========================================================================
        // ================= 2. API QUẢN LÝ DANH MỤC MÓN ĂN (danhsachdanhmuc) =======
        // =========================================================================

        [HttpGet("get-all-categories")]
        public async Task<IActionResult> GetAllCategories()
        {
            var dsDanhMuc = await _context.Set<DanhMuc>().ToListAsync();
            return Ok(dsDanhMuc);
        }

        [HttpPost("add-category")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddCategory([FromBody] RequestDanhMuc model)
        {
            if (model == null || string.IsNullOrEmpty(model.TenDanhMuc))
                return BadRequest(new { message = "Tên danh mục không được để trống!" });

            var danhMucMoi = new DanhMuc { TenDanhMuc = model.TenDanhMuc.Trim() };
            _context.Set<DanhMuc>().Add(danhMucMoi);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Thêm danh mục món ăn mới thành công!" });
        }

        [HttpPut("update-category/{id}")] // Đã chuẩn hóa HttpPut
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] RequestDanhMuc model)
        {
            var danhMucDb = await _context.Set<DanhMuc>().FindAsync(id);
            if (danhMucDb == null) return NotFound(new { message = "Danh mục không tồn tại!" });

            if (model == null || string.IsNullOrEmpty(model.TenDanhMuc))
                return BadRequest(new { message = "Tên danh mục không được trống!" });

            danhMucDb.TenDanhMuc = model.TenDanhMuc.Trim();
            _context.Set<DanhMuc>().Update(danhMucDb);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật tên danh mục thành công!" });
        }

        [HttpDelete("delete-category/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var danhMucDb = await _context.Set<DanhMuc>().FindAsync(id);
            if (danhMucDb == null) return NotFound(new { message = "Danh mục không tồn tại hoặc đã bị xóa!" });

            _context.Set<DanhMuc>().Remove(danhMucDb);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa danh mục khỏi hệ thống thành công!" });
        }

        // =========================================================================
        // ================= 3. API QUẢN LÝ THỰC ĐƠN MÓN ĂN (danhsachmonan) =========
        // =========================================================================

        [HttpGet("get-all-dishes")]
        public async Task<IActionResult> GetAllDishes()
        {
            var dsMonAn = await _context.Set<MonAn>().ToListAsync();
            return Ok(dsMonAn);
        }

        [HttpPost("add-dish")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddDish([FromForm] RequestMonAnForm model)
        {
            if (string.IsNullOrEmpty(model.TenMonAn) || model.GiaBan <= 0)
                return BadRequest(new { message = "Tên món ăn và giá bán không hợp lệ!" });

            var danhMucDb = await _context.Set<DanhMuc>().FindAsync(model.DanhMucId);
            if (danhMucDb == null) return BadRequest(new { message = "Danh mục được chọn không hợp lệ!" });

            string urlHinhAnh = "https://images.unsplash.com/photo-1546964124-0cce460f38ef";

            if (model.HinhAnhFile != null && model.HinhAnhFile.Length > 0)
            {
                var thuMucImages = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images");
                if (!Directory.Exists(thuMucImages)) Directory.CreateDirectory(thuMucImages);

                var tenFileUnique = Guid.NewGuid().ToString() + Path.GetExtension(model.HinhAnhFile.FileName);
                var duongDanTuyetDoi = Path.Combine(thuMucImages, tenFileUnique);

                using (var stream = new FileStream(duongDanTuyetDoi, FileMode.Create))
                {
                    await model.HinhAnhFile.CopyToAsync(stream);
                }
                urlHinhAnh = $"/images/{tenFileUnique}";
            }

            var monAnMoi = new MonAn
            {
                TenMon = model.TenMonAn,
                Gia = (decimal)model.GiaBan,
                MoTa = model.TenMonAn,
                HinhAnh = urlHinhAnh,
                DanhMucId = model.DanhMucId
            };

            _context.Set<MonAn>().Add(monAnMoi);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Thêm món ăn mới vào thực đơn thành công!" });
        }

        [HttpPut("update-dish/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateDish(int id, [FromForm] RequestMonAnForm model)
        {
            var monAnDb = await _context.Set<MonAn>().FindAsync(id);
            if (monAnDb == null) return NotFound(new { message = "Không tìm thấy món ăn!" });

            var danhMucDb = await _context.Set<DanhMuc>().FindAsync(model.DanhMucId);
            if (danhMucDb == null) return BadRequest(new { message = "Danh mục không hợp lệ!" });

            monAnDb.TenMon = model.TenMonAn;
            monAnDb.Gia = (decimal)model.GiaBan;
            monAnDb.DanhMucId = model.DanhMucId;

            if (model.HinhAnhFile != null && model.HinhAnhFile.Length > 0)
            {
                var thuMucImages = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images");
                var tenFileUnique = Guid.NewGuid().ToString() + Path.GetExtension(model.HinhAnhFile.FileName);
                var duongDanTuyetDoi = Path.Combine(thuMucImages, tenFileUnique);

                using (var stream = new FileStream(duongDanTuyetDoi, FileMode.Create))
                {
                    await model.HinhAnhFile.CopyToAsync(stream);
                }
                monAnDb.HinhAnh = $"/images/{tenFileUnique}";
            }

            _context.Set<MonAn>().Update(monAnDb);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thông tin món ăn thành công!" });
        }

        [HttpDelete("delete-dish/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteDish(int id)
        {
            var monAnDb = await _context.Set<MonAn>().FindAsync(id);
            if (monAnDb == null) return NotFound(new { message = "Món ăn không tồn tại!" });

            _context.Set<MonAn>().Remove(monAnDb);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa món ăn khỏi thực đơn thành công!" });
        }

        // =========================================================================
        // ================= 4. API QUẢN LÝ KHU VỰC (danhsachkhuvuc) ===============
        // =========================================================================

        [HttpGet("get-all-locations")]
        public async Task<IActionResult> GetAllLocations()
        {
            var dsKhuVuc = await _context.Set<KhuVuc>().ToListAsync();
            return Ok(dsKhuVuc);
        }

        [HttpPost("add-location")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddLocation([FromBody] RequestKhuVuc model)
        {
            if (model == null || string.IsNullOrEmpty(model.TenKhuVuc))
                return BadRequest(new { message = "Tên khu vực không được để trống!" });

            var kvMoi = new KhuVuc { TenKhuVuc = model.TenKhuVuc.Trim() };
            _context.Set<KhuVuc>().Add(kvMoi);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Thêm khu vực mới thành công!" });
        }

        [HttpPut("update-location/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateLocation(int id, [FromBody] RequestKhuVuc model)
        {
            var kvDb = await _context.Set<KhuVuc>().FindAsync(id);
            if (kvDb == null) return NotFound(new { message = "Khu vực không tồn tại!" });

            if (model == null || string.IsNullOrEmpty(model.TenKhuVuc))
                return BadRequest(new { message = "Tên khu vực không được bỏ trống!" });

            kvDb.TenKhuVuc = model.TenKhuVuc.Trim();
            _context.Set<KhuVuc>().Update(kvDb);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật tên khu vực thành công!" });
        }

        [HttpDelete("delete-location/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteLocation(int id)
        {
            var kvDb = await _context.Set<KhuVuc>().FindAsync(id);
            if (kvDb == null) return NotFound(new { message = "Không tìm thấy khu vực cần xóa!" });

            _context.Set<KhuVuc>().Remove(kvDb);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa khu vực khỏi hệ thống thành công!" });
        }

        // =========================================================================
        // ================= 5. API QUẢN LÝ BÀN ĂN (danhsachbanan) =================
        // =========================================================================

        [HttpGet("get-all-tables")]
        public async Task<IActionResult> GetAllTables()
        {
            // Tự động map xuống bảng danhsachbanan nhờ cấu trúc [Table] trong model
            var dsBan = await _context.Set<BanAn>().ToListAsync();
            return Ok(dsBan);
        }

        [HttpPost("add-table")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddTable([FromBody] RequestBanAn model)
        {
            if (model == null || string.IsNullOrEmpty(model.TenBan))
                return BadRequest(new { message = "Tên bàn ăn không được để trống!" });

            var khuVucDb = await _context.Set<KhuVuc>().FindAsync(model.KhuVucId);
            if (khuVucDb == null)
                return BadRequest(new { message = "Mã khu vực lựa chọn không hợp lệ!" });

            var banMoi = new BanAn
            {
                TenBan = model.TenBan.Trim(),
                SoChoNgoi = model.SoChoNgoi > 0 ? model.SoChoNgoi : 4,
                TrangThai = string.IsNullOrEmpty(model.TrangThai) ? "Trống" : model.TrangThai.Trim(),
                KhuVucId = model.KhuVucId,
                ViTriX = 20,          // Mặc định tạo ở kho chờ góc trái
                ViTriY = 40,
                IsChinhThuc = false   // Mặc định nằm ở kho lưu trữ chưa đưa ra sơ đồ chính thức
            };

            _context.Set<BanAn>().Add(banMoi);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Khởi tạo bàn ăn mới đưa vào Kho Lưu Trữ thành công!" });
        }

        [HttpPut("update-table/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateTable(int id, [FromBody] RequestBanAn model)
        {
            var banDb = await _context.Set<BanAn>().FindAsync(id);
            if (banDb == null) return NotFound(new { message = "Bàn ăn không tồn tại!" });

            if (model == null || string.IsNullOrEmpty(model.TenBan))
                return BadRequest(new { message = "Tên bàn ăn không được bỏ trống!" });

            var khuVucDb = await _context.Set<KhuVuc>().FindAsync(model.KhuVucId);
            if (khuVucDb == null) return BadRequest(new { message = "Khu vực được chọn không hợp lệ!" });

            banDb.TenBan = model.TenBan.Trim();
            banDb.SoChoNgoi = model.SoChoNgoi;
            banDb.TrangThai = model.TrangThai.Trim();
            banDb.KhuVucId = model.KhuVucId;
            banDb.ViTriX = model.ViTriX;
            banDb.ViTriY = model.ViTriY;
            banDb.IsChinhThuc = model.IsChinhThuc;

            _context.Set<BanAn>().Update(banDb);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật dữ liệu bàn ăn thành công!" });
        }

        [HttpDelete("delete-table/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTable(int id)
        {
            var banDb = await _context.Set<BanAn>().FindAsync(id);
            if (banDb == null) return NotFound(new { message = "Bàn ăn không tồn tại hoặc đã bị xóa từ trước!" });

            _context.Set<BanAn>().Remove(banDb);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa bàn ăn khỏi sơ đồ thành công!" });
        }

        // ĐẶC QUYỀN ADMIN: Cập nhật nhanh tọa độ và trạng thái vùng phân hoạch khi thả chuột
        [HttpPut("update-table-coords/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateTableCoordinates(int id, [FromBody] RequestUpdateCoordinates model)
        {
            var banDb = await _context.Set<BanAn>().FindAsync(id);
            if (banDb == null) return NotFound(new { message = "Không tìm thấy bàn ăn này trên hệ thống!" });

            banDb.ViTriX = model.ViTriX; //
            banDb.ViTriY = model.ViTriY; //
            banDb.IsChinhThuc = model.IsChinhThuc; // Cập nhật trạng thái Kho lưu trữ hay Khu chính thức

            _context.Set<BanAn>().Update(banDb);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã lưu vị trí và trạng thái sơ đồ bàn ăn thành công!" });
        }
    }
}