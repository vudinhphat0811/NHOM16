using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using WebNhaHangAPI.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Chuỗi kết nối database mây Clever Cloud
var chuoiKetNoi = "server=bztgqose7xabliatj3rz-mysql.services.clever-cloud.com;port=3306;database=bztgqose7xabliatj3rz;user=upuauqgeul6xwjpm;password=kedUwT6udn4qWpyHehGz;SslMode=None";
builder.Services.AddDbContext<DbContextNhaHang>(options =>
    options.UseMySql(chuoiKetNoi, ServerVersion.AutoDetect(chuoiKetNoi)));

builder.Services.AddIdentityApiEndpoints<IdentityUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<DbContextNhaHang>();

builder.Services.Configure<IdentityOptions>(options =>
{
    options.ClaimsIdentity.RoleClaimType = System.Security.Claims.ClaimTypes.Role;
    // Cấu hình pass đơn giản hơn cho đồ án nếu cần thiết
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = false;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        var scheme = new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "Hãy paste đoạn Token của bạn vào đây (Không cần gõ chữ Bearer)"
        };
        document.Components ??= new Microsoft.OpenApi.Models.OpenApiComponents();
        document.Components.SecuritySchemes.Add("Bearer", scheme);
        document.SecurityRequirements.Add(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            [new Microsoft.OpenApi.Models.OpenApiSecurityScheme { Reference = new Microsoft.OpenApi.Models.OpenApiReference { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } }] = Array.Empty<string>()
        });
        return Task.CompletedTask;
    });
});

var app = builder.Build();

// Điều hướng file tĩnh
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value;

    if (string.Equals(path, "/", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(path, "/trang-chu", StringComparison.OrdinalIgnoreCase))
    {
        context.Request.Path = "/index.html";
    }
    else if (string.Equals(path, "/dang-nhap", StringComparison.OrdinalIgnoreCase))
    {
        context.Request.Path = "/login.html";
    }
    else if (string.Equals(path, "/dang-ky", StringComparison.OrdinalIgnoreCase))
    {
        context.Request.Path = "/register.html";
    }
    else if (string.Equals(path, "/dat-ban", StringComparison.OrdinalIgnoreCase))
    {
        context.Request.Path = "/order.html";
    }
    else if (string.Equals(path, "/admin/dashboard", StringComparison.OrdinalIgnoreCase) ||
             string.Equals(path, "/admin/dashboard.html", StringComparison.OrdinalIgnoreCase))
    {
        context.Request.Path = "/admin/dashboard.html";
    }

    await next();
});

app.UseStaticFiles();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapOpenApi();
app.MapScalarApiReference();
app.MapIdentityApi<IdentityUser>();
app.MapControllers();

// ================= TỰ ĐỘNG KHỞI TẠO VAI TRÒ VÀ TÀI KHOẢN ADMIN =================
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();

    // ĐÃ CHỈNH: Đổi "KhachHang" thành "Customer" để đồng bộ 100% với file Front-end tab-role.html
    string[] tenCacQuyen = { "Admin", "Customer" };
    foreach (var tenQuyen in tenCacQuyen)
    {
        if (!await roleManager.RoleExistsAsync(tenQuyen))
        {
            await roleManager.CreateAsync(new IdentityRole(tenQuyen));
        }
    }

    // ĐÃ THÊM: Tự động kiểm tra và tạo thẳng tài khoản Admin nếu chưa tồn tại trên database mây
    string adminEmail = "admin@gmail.com";
    var adminUser = await userManager.FindByEmailAsync(adminEmail);

    if (adminUser == null)
    {
        var newAdmin = new IdentityUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            EmailConfirmed = true
        };

        // Tạo tài khoản với mật khẩu mặc định: Admin@123
        var createAdminResult = await userManager.CreateAsync(newAdmin, "Admin@123");
        if (createAdminResult.Succeeded)
        {
            await userManager.AddToRoleAsync(newAdmin, "Admin");
        }
    }
    else
    {
        // Nếu tài khoản đã có sẵn nhưng chưa được set quyền thì ép gán quyền Admin luôn
        if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }
    }
}

app.Run();