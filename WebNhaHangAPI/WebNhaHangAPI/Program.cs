using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using WebNhaHangAPI.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. ĐÃ ĐỔI: Chuỗi kết nối trỏ thẳng lên database mây Clever Cloud của bạn
var chuoiKetNoi = "server=bztgqose7xabliatj3rz-mysql.services.clever-cloud.com;port=3306;database=bztgqose7xabliatj3rz;user=upuauqgeul6xwjpm;password=kedUwT6udn4qWpyHehGz";

builder.Services.AddDbContext<DbContextNhaHang>(options =>
    options.UseMySql(chuoiKetNoi, ServerVersion.AutoDetect(chuoiKetNoi)));

builder.Services.AddIdentityApiEndpoints<IdentityUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<DbContextNhaHang>();

builder.Services.Configure<IdentityOptions>(options =>
{
    options.ClaimsIdentity.RoleClaimType = System.Security.Claims.ClaimTypes.Role;
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

// ĐÃ SỬA: Tạm thời tắt chuyển hướng HTTPS tự động nếu Render của bạn dùng giao thức proxy HTTP nội bộ (tránh lỗi vòng lặp)
// app.UseHttpsRedirection(); 

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

// 2. ĐÃ ĐỔI: Bỏ điều kiện IsDevelopment để khi lên Render bạn vẫn mở được giao diện test API /scalar/v1
app.MapOpenApi();
app.MapScalarApiReference();

app.MapIdentityApi<IdentityUser>();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();

    string[] tenCacQuyen = { "Admin", "KhachHang" };
    foreach (var tenQuyen in tenCacQuyen)
    {
        if (!await roleManager.RoleExistsAsync(tenQuyen))
        {
            await roleManager.CreateAsync(new IdentityRole(tenQuyen));
        }
    }

    var adminUser = await userManager.FindByEmailAsync("admin@gmail.com");
    if (adminUser != null)
    {
        if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }
    }
}

app.Run();