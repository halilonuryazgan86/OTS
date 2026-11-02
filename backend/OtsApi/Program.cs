using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OtsApi.Data;
using OtsApi.Endpoints;
using OtsApi.Models;

var builder = WebApplication.CreateBuilder(args);

var jwt = builder.Configuration.GetSection("Jwt");
var jwtKey = jwt["Key"];
if (string.IsNullOrEmpty(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32)
    throw new InvalidOperationException("Jwt:Key ayarı en az 32 byte olmalı.");

builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Default")));
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
{
    o.MapInboundClaims = false;
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidIssuer = jwt["Issuer"],
        ValidAudience = jwt["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        NameClaimType = "name",
        RoleClaimType = "role"
    };
});
// Şifresini değiştirmesi gereken kullanıcı (geçici şifreli veli) yalnızca "SignedIn" uç noktalarına (/me, /password) erişir.
static bool PasswordOk(AuthorizationHandlerContext c) => !c.User.HasClaim(claim => claim.Type == AuthEndpoints.MustChangePasswordClaim);
builder.Services.AddAuthorizationBuilder()
    .SetDefaultPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().RequireAssertion(PasswordOk).Build())
    .AddPolicy("SignedIn", p => p.RequireAuthenticatedUser())
    .AddPolicy("Teacher", p => p.RequireRole(nameof(UserRole.Teacher)).RequireAssertion(PasswordOk))
    .AddPolicy("Parent", p => p.RequireRole(nameof(UserRole.Parent)).RequireAssertion(PasswordOk));

// Kaba kuvvet ve toplu hesap açmaya karşı: IP başına dakikada 5 giriş, 10 dakikada 5 kayıt denemesi.
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("login", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(1) }));
    o.AddPolicy("register", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(10) }));
});

var app = builder.Build();

// Beklenmeyen hatalar ve boş hata yanıtları ProblemDetails (JSON) olarak döner.
// Okunamayan istek gövdesi (bozuk JSON vb.) 500 değil 400 döner.
app.UseExceptionHandler(new ExceptionHandlerOptions
{
    StatusCodeSelector = ex => ex is BadHttpRequestException bad ? bad.StatusCode : StatusCodes.Status500InternalServerError
});
app.UseStatusCodePages();

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    await DevSeed.RunAsync(app);
}

app.MapAuthEndpoints();
app.MapStudentEndpoints();
app.MapCourseEndpoints();
app.MapProgressEndpoints();
app.MapDashboardEndpoints();
app.MapReportEndpoints();

app.Run();
