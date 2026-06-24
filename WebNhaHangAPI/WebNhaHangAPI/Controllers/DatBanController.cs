using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using WebNhaHangAPI.Data;
using WebNhaHangAPI.Models;

namespace WebNhaHangAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DatBanController : ControllerBase
    {
        private readonly DbContextNhaHang _context;

        public DatBanController(DbContextNhaHang context)
        {
            _context = context;
        }

        // 1. ADMIN XEM TẤT CẢ ĐƠN ĐẶT BÀN
        [HttpGet("tat-ca-don")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllForAdmin()
        {
            var danhSach = await _context.Set<DatBan>()
                .Include(db => db.BanAn)
                .Include(db => db.ChiTietGoiMons)
                    .ThenInclude(ct => ct.MonAn)
                .ToListAsync();
            return Ok(danhSach);
        }

        // 2. KHÁCH HÀNG XEM LỊCH SỬ ĐẶT BÀN CỦA CHÍNH MÌNH
        [HttpGet("lich-su-cua-toi")]
        [Authorize]
        public async Task<IActionResult> GetMyHistory()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var lichSu = await _context.Set<DatBan>()
                .Include(db => db.BanAn)
                .Include(db => db.ChiTietGoiMons)
                    .ThenInclude(ct => ct.MonAn)
                .Where(db => db.UserId == currentUserId)
                .ToListAsync();

            return Ok(lichSu);
        }

        // 3. KHÁCH ĐẶT BÀN ONLINE 
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] DatBan model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized(new { message = "Vui lòng đăng nhập!" });
            model.UserId = userId;

            var banAn = await _context.Set<BanAn>().FindAsync(model.BanAnId);
            if (banAn == null) return BadRequest(new { message = "Bàn ăn không tồn tại!" });

            model.TrangThai = "Chờ xác nhận";
            model.TrangThaiCoc = "Chưa cọc";

            _context.Set<DatBan>().Add(model);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đặt bàn thành công! Vui lòng chuyển khoản tiền cọc.", data = model });
        }

        // 4. ADMIN DUYỆT CỌC XÁC NHẬN GIỮ BÀN
        [HttpPut("{id}/xac-nhan-coc")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ConfirmDeposit(int id, [FromQuery] string phuongThuc = "Chuyển khoản")
        {
            var don = await _context.Set<DatBan>().Include(db => db.BanAn).FirstOrDefaultAsync(x => x.Id == id);
            if (don == null) return NotFound(new { message = "Không tìm thấy đơn đặt bàn!" });

            don.TrangThaiCoc = "Đã cọc";
            don.PhuongThucThanhToan = phuongThuc;
            don.TrangThai = "Đã xác nhận";

            if (don.BanAn != null)
            {
                don.BanAn.TrangThai = "Đã đặt";
                _context.Set<BanAn>().Update(don.BanAn);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã duyệt cọc! Bàn ăn đã được khóa giữ chỗ.", data = don });
        }

        // 5. NHÂN VIÊN XEM CHI TIẾT BILL TẠM TÍNH KHI KHÁCH ĐANG NGỒI TẠI QUẦY
        [HttpGet("chi-tiet-ban/{banAnId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetInvoiceByTable(int banAnId)
        {
            var donHienTai = await _context.Set<DatBan>()
                .Include(db => db.BanAn)
                .Include(db => db.ChiTietGoiMons)
                    .ThenInclude(ct => ct.MonAn)
                .Where(db => db.BanAnId == banAnId && db.TrangThai != "Đã thanh toán" && db.TrangThai != "Đã hủy")
                .FirstOrDefaultAsync();

            if (donHienTai == null) return NotFound(new { message = "Bàn này hiện tại đang trống, không có hóa đơn!" });

            decimal tongTienMonAn = 0;
            foreach (var item in donHienTai.ChiTietGoiMons)
            {
                if (item.MonAn != null)
                {
                    tongTienMonAn += item.MonAn.Gia * item.SoLuong;
                }
            }

            decimal soTienCanThanhToan = tongTienMonAn - donHienTai.TienCoc;

            return Ok(new
            {
                ThongTinDon = donHienTai,
                TongTienMonAn = tongTienMonAn,
                TienCocDaTru = donHienTai.TienCoc,
                SoTienPhaiTraThem = soTienCanThanhToan > 0 ? soTienCanThanhToan : 0
            });
        }

        // 6. PHỤC VỤ THÊM MÓN/TĂNG SỐ LƯỢNG KHI KHÁCH GỌI THÊM ĐỒ TẠI QUÁN
        [HttpPost("{datBanId}/goi-them-mon")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddMoreFood(int datBanId, [FromBody] ChiTietGoiMon model)
        {
            var don = await _context.Set<DatBan>().Include(db => db.BanAn).FirstOrDefaultAsync(x => x.Id == datBanId);
            if (don == null) return NotFound(new { message = "Không tìm thấy đơn đặt bàn!" });

            var monAnDaCo = await _context.Set<ChiTietGoiMon>()
                .FirstOrDefaultAsync(x => x.DatBanId == datBanId && x.MonAnId == model.MonAnId);

            if (monAnDaCo != null)
            {
                monAnDaCo.SoLuong += model.SoLuong;
                _context.Set<ChiTietGoiMon>().Update(monAnDaCo);
            }
            else
            {
                model.DatBanId = datBanId;
                _context.Set<ChiTietGoiMon>().Add(model);
            }

            don.TrangThai = "Đang ăn";
            if (don.BanAn != null)
            {
                don.BanAn.TrangThai = "Đang ăn";
                _context.Set<BanAn>().Update(don.BanAn);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã cập nhật món ăn vào hóa đơn thành công!" });
        }

        // 7. THU NGÂN TÍNH TIỀN HOÀN TẤT VÀ GIẢI PHÓNG BÀN VỀ TRẠNG THÁI TRỐNG
        [HttpPut("{id}/thanh-toan-hoan-tat")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Checkout(int id)
        {
            var don = await _context.Set<DatBan>().Include(db => db.BanAn).FirstOrDefaultAsync(x => x.Id == id);
            if (don == null) return NotFound(new { message = "Không tìm thấy hóa đơn cần thanh toán!" });

            don.TrangThai = "Đã thanh toán";

            if (don.BanAn != null)
            {
                don.BanAn.TrangThai = "Trống";
                _context.Set<BanAn>().Update(don.BanAn);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Thanh toán thành công! Bàn ăn đã được dọn sạch về trạng thái trống." });
        }
        [HttpPost("admin-them-mon")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminAddFoodForm([FromForm] int datBanId, [FromForm] int monAnId, [FromForm] int soLuong, [FromForm] string returnUrl)
        {
            var don = await _context.Set<DatBan>().FirstOrDefaultAsync(x => x.Id == datBanId);
            if (don == null) return NotFound();

            var monAnDaCo = await _context.Set<ChiTietGoiMon>()
                .FirstOrDefaultAsync(x => x.DatBanId == datBanId && x.MonAnId == monAnId);

            if (monAnDaCo != null)
            {
                monAnDaCo.SoLuong += soLuong;
                _context.Set<ChiTietGoiMon>().Update(monAnDaCo);
            }
            else
            {
                var bieuMau = new ChiTietGoiMon { DatBanId = datBanId, MonAnId = monAnId, SoLuong = soLuong };
                _context.Set<ChiTietGoiMon>().Add(bieuMau);
            }

            await _context.SaveChangesAsync();
            return Redirect(returnUrl); // Quay trở lại trang giao diện vừa đứng
        }

        // ADMIN ĐỔI SỐ LƯỢNG MÓN CỐ ĐỊNH (Dùng cho C# Razor/MVC)
        [HttpPost("admin-sua-so-luong")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminUpdateQuantityForm([FromForm] int datBanId, [FromForm] int monAnId, [FromForm] int soLuongMoi, [FromForm] string returnUrl)
        {
            if (soLuongMoi <= 0) return RedirectToAction("AdminDeleteFoodForm", new { datBanId, monAnId, returnUrl });

            var chiTiet = await _context.Set<ChiTietGoiMon>()
                .FirstOrDefaultAsync(x => x.DatBanId == datBanId && x.MonAnId == monAnId);

            if (chiTiet != null)
            {
                chiTiet.SoLuong = soLuongMoi;
                _context.Set<ChiTietGoiMon>().Update(chiTiet);
                await _context.SaveChangesAsync();
            }
            return Redirect(returnUrl);
        }

        // ADMIN XÓA MÓN KHỎI ĐƠN (Dùng cho C# Razor/MVC)
        [HttpPost("admin-xoa-mon")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminDeleteFoodForm([FromForm] int datBanId, [FromForm] int monAnId, [FromForm] string returnUrl)
        {
            var chiTiet = await _context.Set<ChiTietGoiMon>()
                .FirstOrDefaultAsync(x => x.DatBanId == datBanId && x.MonAnId == monAnId);

            if (chiTiet != null)
            {
                _context.Set<ChiTietGoiMon>().Remove(chiTiet);
                await _context.SaveChangesAsync();
            }
            return Redirect(returnUrl);
        }
        // 9. API LẤY DANH SÁCH ĐƠN ĐÃ HOÀN THÀNH ĐỂ LÀM BÁO CÁO THỐNG KÊ
        [HttpGet("don-da-hoan-thanh")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetCompletedOrders()
        {
            // Lọc ra các đơn có trạng thái "Đã thanh toán"
            var danhSachDonXong = await _context.Set<DatBan>()
                .Include(db => db.BanAn)
                .Include(db => db.ChiTietGoiMons)
                    .ThenInclude(ct => ct.MonAn)
                .Where(db => db.TrangThai == "Đã thanh toán")
                .OrderByDescending(db => db.Id) // Đơn mới thanh toán xếp lên đầu
                .ToListAsync();

            int tongSoDon = danhSachDonXong.Count;
            decimal tongDoanhThu = 0;

            foreach (var don in danhSachDonXong)
            {
                decimal tienMonAn = 0;
                foreach (var chiTiet in don.ChiTietGoiMons)
                {
                    if (chiTiet.MonAn != null)
                    {
                        tienMonAn += chiTiet.MonAn.Gia * chiTiet.SoLuong;
                    }
                }

                // Nếu có tiền món ăn thì tổng đơn đó bằng tiền món, ngược lại lấy tiền cọc
                decimal thucThuDonNay = tienMonAn > 0 ? tienMonAn : don.TienCoc;

                // Ép ngược giá trị thực thu này vào trường TienCoc để trả về Front-end hiển thị công khai
                don.TienCoc = thucThuDonNay;

                tongDoanhThu += thucThuDonNay;
            }

            return Ok(new
            {
                TongSoDonThànhCông = tongSoDon,
                TongDoanhThuDuKien = tongDoanhThu,
                DanhSachDon = danhSachDonXong
            });
        }
        // 8. ADMIN HOẶC KHÁCH HÀNG ÉP HỦY ĐƠN ĐẶT BÀN Ở BẤT KỲ TRẠNG THÁI NÀO ĐỂ GIẢI PHÓNG BÀN VỀ TRỐNG
        [HttpPut("{id}/khach-huy-ban")]
        [Authorize]
        public async Task<IActionResult> ClientCancelBooking(int id)
        {
            // Bỏ kiểm tra phân quyền sở hữu UserId và bỏ chặn Trạng thái Chờ xác nhận để Admin ép hủy bất kỳ lúc nào
            var don = await _context.Set<DatBan>().Include(db => db.BanAn).FirstOrDefaultAsync(x => x.Id == id);

            if (don == null) return NotFound(new { message = "Không tìm thấy thông tin đơn đặt bàn này!" });

            don.TrangThai = "Đã hủy";

            if (don.BanAn != null)
            {
                don.BanAn.TrangThai = "Trống";
                _context.Set<BanAn>().Update(don.BanAn);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã hủy đơn đặt bàn và giải phóng bàn ăn thành công!", data = don });
        }
    }
}