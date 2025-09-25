/*
  Warnings:

  - A unique constraint covering the columns `[refreshToken]` on the table `Authtoken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Authtoken_refreshToken_key" ON "public"."Authtoken"("refreshToken");
