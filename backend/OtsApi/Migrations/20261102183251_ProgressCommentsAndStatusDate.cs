using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace OtsApi.Migrations
{
    /// <inheritdoc />
    public partial class ProgressCommentsAndStatusDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "StatusDate",
                table: "Progresses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProgressComments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StudentId = table.Column<int>(type: "integer", nullable: false),
                    TopicId = table.Column<int>(type: "integer", nullable: false),
                    AuthorId = table.Column<int>(type: "integer", nullable: false),
                    Text = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProgressComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProgressComments_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProgressComments_Topics_TopicId",
                        column: x => x.TopicId,
                        principalTable: "Topics",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProgressComments_Users_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProgressComments_AuthorId",
                table: "ProgressComments",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_ProgressComments_CreatedAt",
                table: "ProgressComments",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ProgressComments_StudentId_TopicId_CreatedAt",
                table: "ProgressComments",
                columns: new[] { "StudentId", "TopicId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ProgressComments_TopicId",
                table: "ProgressComments",
                column: "TopicId");

            // Veri taşıma (elle eklendi): mevcut öğretmen notları ilk yorum olarak korunur,
            // mevcut kayıtların işlem tarihi bilinen en iyi değerle doldurulur; ardından Note kolonu kaldırılır.
            migrationBuilder.Sql("""
                INSERT INTO "ProgressComments" ("StudentId", "TopicId", "AuthorId", "Text", "CreatedAt")
                SELECT p."StudentId", p."TopicId", s."TeacherId", left(p."Note", 1000), p."UpdatedAt"
                FROM "Progresses" p JOIN "Students" s ON s."Id" = p."StudentId"
                WHERE p."Note" IS NOT NULL AND btrim(p."Note") <> '' AND s."TeacherId" IS NOT NULL;

                UPDATE "Progresses" SET "StatusDate" = COALESCE("CompletedAt", "UpdatedAt")
                WHERE "Status" <> 'NotStarted';
                """);

            migrationBuilder.DropColumn(
                name: "Note",
                table: "Progresses");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "Progresses",
                type: "text",
                nullable: true);

            // Geri alırken her konunun öğretmen tarafından yazılan en son yorumu tekrar not olur.
            migrationBuilder.Sql("""
                UPDATE "Progresses" p SET "Note" = c."Text"
                FROM (SELECT DISTINCT ON (pc."StudentId", pc."TopicId") pc."StudentId", pc."TopicId", pc."Text"
                      FROM "ProgressComments" pc JOIN "Students" s ON s."Id" = pc."StudentId" AND s."TeacherId" = pc."AuthorId"
                      ORDER BY pc."StudentId", pc."TopicId", pc."CreatedAt" DESC) c
                WHERE p."StudentId" = c."StudentId" AND p."TopicId" = c."TopicId";
                """);

            migrationBuilder.DropTable(
                name: "ProgressComments");

            migrationBuilder.DropColumn(
                name: "StatusDate",
                table: "Progresses");
        }
    }
}
