using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace WebNhaHangAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public AdminController(UserManager<IdentityUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        // Endpoint gán quyền gốc (Giữ nguyên bảo mật chỉ Admin được gọi)
        [HttpPost("set-role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SetRole([FromBody] RequestGanQuyen model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return BadRequest(new { message = "Không tìm thấy tài khoản email này!" });
            }

            var roleExists = await _roleManager.RoleExistsAsync(model.TenQuyen);
            if (!roleExists)
            {
                return BadRequest(new { message = $"Quyền '{model.TenQuyen}' không tồn tại!" });
            }

            var result = await _userManager.AddToRoleAsync(user, model.TenQuyen);
            if (result.Succeeded)
            {
                return Ok(new { message = $"Đã cấp quyền '{model.TenQuyen}' cho {model.Email}!" });
            }

            return BadRequest(new { message = "Cấp quyền thất bại!", errors = result.Errors });
        }

        // --- ENDPOINT MỚI: LẤY VAI TRÒ CỦA USER HIỆN TẠI ---
        [HttpGet("current-user-role")]
        [Authorize] // Chỉ cần đăng nhập (có token hợp lệ) là được gọi
        public async Task<IActionResult> GetCurrentUserRole()
        {
            // Lấy email từ Identity Claim mã hóa trong Token gửi lên
            var userEmail = User.Identity?.Name;
            if (string.IsNullOrEmpty(userEmail))
            {
                userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
            }

            var user = await _userManager.FindByEmailAsync(userEmail);
            if (user == null)
            {
                return NotFound(new { message = "Không tìm thấy thông tin tài khoản!" });
            }

            // Lấy danh sách Roles của User
            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                email = user.Email,
                roles = roles // Trả về mảng dạng ["Admin"] hoặc ["KhachHang"]
            });
        }
    }

    public class RequestGanQuyen
    {
        public string Email { get; set; }
        public string TenQuyen { get; set; }
    }
}