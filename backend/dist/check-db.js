"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('=== DATABASE CHECK ===\n');
    const campaigns = await prisma.campaign.findMany();
    console.log(`Campaigns (${campaigns.length}):`);
    campaigns.forEach(c => console.log(`  - ${c.title} (id: ${c.id.substring(0, 8)}..., active: ${c.isActive})`));
    const userCampaigns = await prisma.userCampaign.findMany({
        include: { user: true, campaign: true }
    });
    console.log(`\nUser Campaign Assignments (${userCampaigns.length}):`);
    userCampaigns.forEach(uc => console.log(`  - ${uc.user.email} -> "${uc.campaign.title}" (status: ${uc.status})`));
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
    console.log(`\nAll Users (${users.length}):`);
    users.forEach(u => console.log(`  - ${u.email} (role: ${u.role}, id: ${u.id.substring(0, 8)}...)`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check-db.js.map