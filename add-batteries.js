const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🔋 Adding batteries to stations...");

  const batteryData = [
    { stationId: 1, slotId: 4, count: 3 },
    { stationId: 2, slotId: 13, count: 4 },
    { stationId: 3, slotId: 19, count: 4 },
    { stationId: 4, slotId: 27, count: 3 },
  ];

  let batteryCode = 7;
  for (const data of batteryData) {
    for (let i = 0; i < data.count; i++) {
      const uid = `UID-${batteryCode}`;
      const code = `BAT${String(batteryCode).padStart(3, "0")}`;
      
      // Check if battery already exists
      const existing = await prisma.battery.findUnique({
        where: { uid: uid },
      });
      
      if (!existing) {
        await prisma.battery.create({
          data: {
            uid: uid,
            batteryCode: code,
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
            batteryUid: uid,
          },
        });

        console.log(`✅ Created battery ${code} in station ${data.stationId}`);
      } else {
        console.log(`⚠️  Battery ${code} already exists`);
      }

      batteryCode++;
    }
  }

  // Update available slots for each station
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

    console.log(`✅ Updated station ${stationId}: ${totalSlots - fullSlots}/${totalSlots} available slots`);
  }

  console.log("🎉 Batteries added successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
