using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using OtsApi.Data;
using OtsApi.Endpoints;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseNpgsql(builder.Configuration.GetConnectionString("Default")));
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

var app = builder.Build();

// Beklenmeyen hatalar ve boş hata yanıtları ProblemDetails (JSON) olarak döner.
// Okunamayan istek gövdesi (bozuk JSON vb.) 500 değil 400 döner.
app.UseExceptionHandler(new ExceptionHandlerOptions
{
    StatusCodeSelector = ex => ex is BadHttpRequestException bad ? bad.StatusCode : StatusCodes.Status500InternalServerError
});
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapStudentEndpoints();
app.MapCourseEndpoints();
app.MapProgressEndpoints();

app.Run();
