import { prisma } from "./lib/prisma.js";
async function main() {
    const user = await prisma.user.create({
        data: {
            email: "test@outbox.local",
            name: "Outbox Test User",
        },
    });
    console.log("Created user:", user);
    const users = await prisma.user.findMany();
    console.log("Users in database:", users);
}
main()
    .catch((error) => {
    console.error("Database test failed:", error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
