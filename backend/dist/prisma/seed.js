"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting seed...');
    console.log('📁 Creating categories...');
    const hotCoffees = await prisma.category.upsert({
        where: { id: 'cat-hot-coffees' },
        update: {},
        create: {
            id: 'cat-hot-coffees',
            brand: client_1.Brand.coffee,
            name: 'Hot Coffees',
            nameTr: 'Sıcak Kahveler',
            description: 'Our finest selection of hot coffee drinks',
            descriptionTr: 'En kaliteli sıcak kahve seçkimiz',
            sortOrder: 1,
            isActive: true,
        },
    });
    const coldCoffees = await prisma.category.upsert({
        where: { id: 'cat-cold-coffees' },
        update: {},
        create: {
            id: 'cat-cold-coffees',
            brand: client_1.Brand.coffee,
            name: 'Cold Coffees',
            nameTr: 'Soğuk Kahveler',
            description: 'Refreshing cold coffee beverages',
            descriptionTr: 'Serinletici soğuk kahve içecekleri',
            sortOrder: 2,
            isActive: true,
        },
    });
    const desserts = await prisma.category.upsert({
        where: { id: 'cat-desserts' },
        update: {},
        create: {
            id: 'cat-desserts',
            brand: client_1.Brand.coffee,
            name: 'Desserts',
            nameTr: 'Tatlılar',
            description: 'Delicious desserts to complement your coffee',
            descriptionTr: 'Kahvenize eşlik edecek lezzetli tatlılar',
            sortOrder: 3,
            isActive: true,
        },
    });
    const beverages = await prisma.category.upsert({
        where: { id: 'cat-beverages' },
        update: {},
        create: {
            id: 'cat-beverages',
            brand: client_1.Brand.coffee,
            name: 'Beverages',
            nameTr: 'İçecekler',
            description: 'Non-coffee beverages',
            descriptionTr: 'Kahve dışı içecekler',
            sortOrder: 4,
            isActive: true,
        },
    });
    console.log('✅ Categories created');
    console.log('☕ Creating products...');
    const hotCoffeeProducts = [
        { name: 'Latte', nameTr: 'Latte', price: 65, desc: 'Smooth espresso with steamed milk', descTr: 'Yumuşak espresso ve buharda ısıtılmış süt' },
        { name: 'Americano', nameTr: 'Americano', price: 55, desc: 'Espresso with hot water', descTr: 'Sıcak su ile espresso' },
        { name: 'Cappuccino', nameTr: 'Cappuccino', price: 60, desc: 'Espresso with foamed milk', descTr: 'Köpürtülmüş süt ile espresso' },
        { name: 'Mocha', nameTr: 'Mocha', price: 70, desc: 'Espresso with chocolate and steamed milk', descTr: 'Çikolata ve süt ile espresso' },
        { name: 'Flat White', nameTr: 'Flat White', price: 65, desc: 'Strong espresso with velvety milk', descTr: 'Güçlü espresso ve kadifemsi süt' },
        { name: 'Macchiato', nameTr: 'Macchiato', price: 50, desc: 'Espresso marked with milk foam', descTr: 'Süt köpüğü ile lekelenmiş espresso' },
    ];
    for (let i = 0; i < hotCoffeeProducts.length; i++) {
        const p = hotCoffeeProducts[i];
        await prisma.product.upsert({
            where: { id: `prod-hot-${i + 1}` },
            update: {},
            create: {
                id: `prod-hot-${i + 1}`,
                categoryId: hotCoffees.id,
                name: p.name,
                nameTr: p.nameTr,
                description: p.desc,
                descriptionTr: p.descTr,
                price: p.price,
                isCoffee: true,
                isActive: true,
                sortOrder: i + 1,
            },
        });
    }
    const coldCoffeeProducts = [
        { name: 'Iced Latte', nameTr: 'Buzlu Latte', price: 70, desc: 'Chilled latte over ice', descTr: 'Buz üzerinde soğuk latte' },
        { name: 'Cold Brew', nameTr: 'Cold Brew', price: 65, desc: 'Slow-steeped cold coffee', descTr: 'Yavaş demlenen soğuk kahve' },
        { name: 'Frappuccino', nameTr: 'Frappuccino', price: 75, desc: 'Blended iced coffee drink', descTr: 'Karıştırılmış buzlu kahve içeceği' },
        { name: 'Iced Americano', nameTr: 'Buzlu Americano', price: 60, desc: 'Espresso with cold water and ice', descTr: 'Soğuk su ve buz ile espresso' },
        { name: 'Iced Mocha', nameTr: 'Buzlu Mocha', price: 75, desc: 'Chilled mocha over ice', descTr: 'Buz üzerinde soğuk mocha' },
    ];
    for (let i = 0; i < coldCoffeeProducts.length; i++) {
        const p = coldCoffeeProducts[i];
        await prisma.product.upsert({
            where: { id: `prod-cold-${i + 1}` },
            update: {},
            create: {
                id: `prod-cold-${i + 1}`,
                categoryId: coldCoffees.id,
                name: p.name,
                nameTr: p.nameTr,
                description: p.desc,
                descriptionTr: p.descTr,
                price: p.price,
                isCoffee: true,
                isActive: true,
                sortOrder: i + 1,
            },
        });
    }
    const dessertProducts = [
        { name: 'Cheesecake', nameTr: 'Cheesecake', price: 85, desc: 'Creamy New York style cheesecake', descTr: 'Kremalı New York usulü cheesecake' },
        { name: 'Brownie', nameTr: 'Brownie', price: 45, desc: 'Rich chocolate brownie', descTr: 'Yoğun çikolatalı brownie' },
        { name: 'Cookie', nameTr: 'Kurabiye', price: 25, desc: 'Fresh baked chocolate chip cookie', descTr: 'Taze pişmiş çikolata parçacıklı kurabiye' },
        { name: 'Tiramisu', nameTr: 'Tiramisu', price: 90, desc: 'Classic Italian coffee dessert', descTr: 'Klasik İtalyan kahveli tatlı' },
        { name: 'Croissant', nameTr: 'Kruvasan', price: 40, desc: 'Buttery French pastry', descTr: 'Tereyağlı Fransız hamur işi' },
    ];
    for (let i = 0; i < dessertProducts.length; i++) {
        const p = dessertProducts[i];
        await prisma.product.upsert({
            where: { id: `prod-dessert-${i + 1}` },
            update: {},
            create: {
                id: `prod-dessert-${i + 1}`,
                categoryId: desserts.id,
                name: p.name,
                nameTr: p.nameTr,
                description: p.desc,
                descriptionTr: p.descTr,
                price: p.price,
                isCoffee: false,
                isActive: true,
                sortOrder: i + 1,
            },
        });
    }
    const beverageProducts = [
        { name: 'Fresh Orange Juice', nameTr: 'Taze Portakal Suyu', price: 50, desc: 'Freshly squeezed orange juice', descTr: 'Taze sıkılmış portakal suyu' },
        { name: 'Lemonade', nameTr: 'Limonata', price: 40, desc: 'Refreshing homemade lemonade', descTr: 'Serinletici ev yapımı limonata' },
        { name: 'Water', nameTr: 'Su', price: 15, desc: 'Still mineral water', descTr: 'Doğal mineralli su' },
        { name: 'Sparkling Water', nameTr: 'Maden Suyu', price: 20, desc: 'Sparkling mineral water', descTr: 'Gazlı maden suyu' },
        { name: 'Hot Chocolate', nameTr: 'Sıcak Çikolata', price: 55, desc: 'Rich and creamy hot chocolate', descTr: 'Yoğun ve kremalı sıcak çikolata' },
        { name: 'Tea', nameTr: 'Çay', price: 25, desc: 'Selection of premium teas', descTr: 'Premium çay seçkisi' },
    ];
    for (let i = 0; i < beverageProducts.length; i++) {
        const p = beverageProducts[i];
        await prisma.product.upsert({
            where: { id: `prod-bev-${i + 1}` },
            update: {},
            create: {
                id: `prod-bev-${i + 1}`,
                categoryId: beverages.id,
                name: p.name,
                nameTr: p.nameTr,
                description: p.desc,
                descriptionTr: p.descTr,
                price: p.price,
                isCoffee: false,
                isActive: true,
                sortOrder: i + 1,
            },
        });
    }
    console.log('✅ Products created');
    console.log('🎁 Creating campaigns...');
    await prisma.campaign.upsert({
        where: { id: 'campaign-free-coffee' },
        update: {},
        create: {
            id: 'campaign-free-coffee',
            type: client_1.CampaignType.auto,
            title: 'Free Coffee',
            titleTr: 'Bedava Kahve',
            description: 'Earn 10 points and get a free coffee!',
            descriptionTr: '10 puan kazanın, bedava kahve alın!',
            rewardType: client_1.RewardType.free_coffee,
            rewardValue: 1,
            requiredPoints: 10,
            isActive: true,
        },
    });
    console.log('✅ Campaigns created');
    console.log('🏆 Creating badges...');
    const badges = [
        {
            id: 'badge-first-order',
            name: 'First Timer',
            nameTr: 'İlk Adım',
            description: 'Made your first order',
            descriptionTr: 'İlk siparişini verdin',
            criteriaType: client_1.BadgeCriteriaType.first_order,
            criteriaValue: 1,
        },
        {
            id: 'badge-coffee-lover',
            name: 'Coffee Lover',
            nameTr: 'Kahve Aşığı',
            description: 'Ordered 10 coffees',
            descriptionTr: '10 kahve sipariş ettin',
            criteriaType: client_1.BadgeCriteriaType.coffee_count,
            criteriaValue: 10,
        },
        {
            id: 'badge-coffee-addict',
            name: 'Coffee Addict',
            nameTr: 'Kahve Bağımlısı',
            description: 'Ordered 50 coffees',
            descriptionTr: '50 kahve sipariş ettin',
            criteriaType: client_1.BadgeCriteriaType.coffee_count,
            criteriaValue: 50,
        },
        {
            id: 'badge-point-master',
            name: 'Point Master',
            nameTr: 'Puan Ustası',
            description: 'Earned 100 points',
            descriptionTr: '100 puan kazandın',
            criteriaType: client_1.BadgeCriteriaType.points_earned,
            criteriaValue: 100,
        },
        {
            id: 'badge-lucky-spinner',
            name: 'Lucky Spinner',
            nameTr: 'Şanslı Çevirici',
            description: 'Won on the wheel',
            descriptionTr: 'Çarktan ödül kazandın',
            criteriaType: client_1.BadgeCriteriaType.wheel_wins,
            criteriaValue: 1,
        },
    ];
    for (const badge of badges) {
        await prisma.badge.upsert({
            where: { id: badge.id },
            update: {},
            create: badge,
        });
    }
    console.log('✅ Badges created');
    const categoryCount = await prisma.category.count();
    const productCount = await prisma.product.count();
    const campaignCount = await prisma.campaign.count();
    const badgeCount = await prisma.badge.count();
    console.log(`
🌱 Seed completed!
   📁 Categories: ${categoryCount}
   ☕ Products: ${productCount}
   🎁 Campaigns: ${campaignCount}
   🏆 Badges: ${badgeCount}
  `);
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map