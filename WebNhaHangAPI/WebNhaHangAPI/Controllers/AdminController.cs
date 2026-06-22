using Microsoft.AspNetCore.Authorization; // 1. THÊM DÒNG NÀY
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace WebNhaHangAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")] //Chỉ ai có quyền Admin mới được vào controller này
    public class AdminController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public AdminController(UserManager<IdentityUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }

        [HttpPost("set-role")]
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
    }

    public class RequestGanQuyen
    {
        public string Email { get; set; }
        public string TenQuyen { get; set; }
    }
}