using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using WebNhaHangAPI.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. CẤU HÌNH DATABASE CONNECTION (MySQL)
var chuoiKetNoi = "server=127.0.0.1;port=3306;database=web_dat_ban_nha_hang;user=root;password=123456";
builder.Services.AddDbContext<DbContextNhaHang>(options =>
    options.UseMySql(chuoiKetNoi, ServerVersion.AutoDetect(chuoiKetNoi)));

// 2. CẤU HÌNH IDENTITY API ENDPOINTS VÀ ROLES
builder.Services.AddIdentityApiEndpoints<IdentityUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<DbContextNhaHang>();

builder.Services.Configure<IdentityOptions>(options =>
{
    options.ClaimsIdentity.RoleClaimType = System.Security.Claims.ClaimTypes.Role;
});

// 3. CẤU HÌNH CORS (Cho phép giao diện gọi API không bị chặn bảo mật)
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

// 4. CẤU HÌNH GIAO DIỆN SCALAR ĐỂ THỬ NGHIỆM VÀ PASTE TOKEN JWT
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

app.UseHttpsRedirection();

// 5. ĐIỀU HƯỚNG URL ĐỂ VÀO GIAO DIỆN KHÔNG BỊ TRÙNG ENDPOINT API GỐC
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value;

    // Nếu vào trang gốc hoặc gõ /trang-chu, lôi file trang chủ index.html ra chạy ngầm
    if (string.Equals(path, "/", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(path, "/trang-chu", StringComparison.OrdinalIgnoreCase))
    {
        context.Request.Path = "/index.html";
    }
    // Nếu vào /dang-nhap, lôi file login.html ra chạy ngầm
    else if (string.Equals(path, "/dang-nhap", StringComparison.OrdinalIgnoreCase))
    {
        context.Request.Path = "/login.html";
    }
    // Nếu vào /dang-ky, lôi file register.html ra chạy ngầm
    else if (string.Equals(path, "/dang-ky", StringComparison.OrdinalIgnoreCase))
    {
        context.Request.Path = "/register.html";
    }

    await next();
});

// 6. KÍCH HOẠT ĐỌC FILE TĨNH TỪ THƯ MỤC wwwroot
app.UseStaticFiles();

// 7. KÍCH HOẠT CORS POLICY
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// MAPPING CÁC ENDPOINT AUTHENTICATION GỐC CỦA IDENTITY (/login và /register nhận dữ liệu POST)
app.MapIdentityApi<IdentityUser>();
app.MapControllers();

// 8. TỰ ĐỘNG KHỞI TẠO CÁC QUYỀN (ROLES) VÀ TÀI KHOẢN ADMIN MẶC ĐỊNH
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

    // Tự động kiểm tra và gán quyền Admin cho tài khoản quản trị mặc định khi có trong DB
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