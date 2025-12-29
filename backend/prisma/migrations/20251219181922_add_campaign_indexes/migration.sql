-- CreateIndex
CREATE INDEX "campaigns_is_active_idx" ON "campaigns"("is_active");

-- CreateIndex
CREATE INDEX "campaigns_type_is_active_idx" ON "campaigns"("type", "is_active");
