const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data (safe to skip if tables don't exist yet)
  try {
    await prisma.payment.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.battery.deleteMany();
    await prisma.slot.deleteMany();
    await prisma.station.deleteMany();
    await prisma.customer.deleteMany();
  } catch (e) {
    console.log("⚠️  Some tables not found, continuing...", e.message);
  }

  console.log("✅ Cleared existing data");

  // Create test user
  const hashedPassword = await bcrypt.hash("password123", 10);
  const customer = await prisma.customer.create({
    data: {
      username: "testlogin",
      passwordHash: hashedPassword,
      fullName: "Test User",
      email: "test@evswap.com",
      phone: "0123456789",
      balance: 500000,
    },
  });
  console.log("✅ Created test user");

  // Create stations
  const stations = [
    {
      name: "STATION_01",
      location: "PTIT Ha Noi",
      status: "active",
      totalSlots: 6,
      availableSlots: 3,
    },
    {
      name: "STATION_02",
      location: "BKDN Da Nang",
      status: "low_battery",
      totalSlots: 6,
      availableSlots: 2,
    },
    {
      name: "STATION_03",
      location: "Vincom Tran Duy Hung, Ha Noi",
      status: "active",
      totalSlots: 8,
      availableSlots: 4,
    },
    {
      name: "STATION_06",
      location: "Aeon Mall, Da Nang",
      status: "active",
      totalSlots: 8,
      availableSlots: 5,
    },
  ];

  for (const stationData of stations) {
    const station = await prisma.station.create({
      data: stationData,
    });

    // Create slots for each station
    for (let i = 1; i <= station.totalSlots; i++) {
      await prisma.slot.create({
        data: {
          stationId: station.id,
          slotNumber: i,
          status: "empty",
          isBatteryPresent: false,
        },
      });
    }

    console.log(
      `✅ Created station: ${station.name} with ${station.totalSlots} slots`
    );
  }

  // Create batteries
  const batteryData = [
    { stationId: 1, slotId: 4, count: 3 },
    { stationId: 2, slotId: 13, count: 4 },
    { stationId: 3, slotId: 19, count: 4 },
    { stationId: 4, slotId: 27, count: 3 },
  ];

  let batteryCode = 7;
  for (const data of batteryData) {
    for (let i = 0; i < data.count; i++) {
      const battery = await prisma.battery.create({
        data: {
          batteryCode: `BAT${String(batteryCode).padStart(3, "0")}`,
          stationId: data.stationId,
          slotId: data.slotId + i,
          status: "full",
          chargeLevel: 100,
          health: 100,
          chargeCycles: 0,
        },
      });

      // Update slot
      await prisma.slot.update({
        where: { id: data.slotId + i },
        data: {
          status: "full",
          isBatteryPresent: true,
        },
      });

      batteryCode++;
    }
  }

  console.log("✅ Created batteries");

  // Update available slots
  for (let stationId = 1; stationId <= 4; stationId++) {
    const fullSlots = await prisma.slot.count({
      where: {
        stationId: stationId,
        status: "full",
      },
    });

    const totalSlots = await prisma.slot.count({
      where: { stationId: stationId },
    });

    await prisma.station.update({
      where: { id: stationId },
      data: {
        availableSlots: totalSlots - fullSlots,
      },
    });
  }

  console.log("✅ Updated available slots");
  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
