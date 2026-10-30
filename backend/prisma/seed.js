const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Event Ticketing Platform Database...');

  // 1. Clean existing records
  await prisma.bookingItem.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.seat.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.venue.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Users
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@eventtix.com',
      name: 'System Admin',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const organizer = await prisma.user.create({
    data: {
      email: 'organizer@eventtix.com',
      name: 'Global Concerts Ltd',
      passwordHash,
      role: 'ORGANIZER',
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      email: 'user@eventtix.com',
      name: 'Jane Doe',
      passwordHash,
      role: 'USER',
    },
  });

  console.log(`👤 Created Users: Admin (${admin.email}), Organizer (${organizer.email}), User (${demoUser.email})`);

  // 3. Create Venue
  const venue = await prisma.venue.create({
    data: {
      name: 'Grand Arena Stadium',
      location: 'New York City, NY',
      capacity: 64,
    },
  });

  console.log(`🏟️ Created Venue: ${venue.name}`);

  // 4. Create Event
  const event = await prisma.event.create({
    data: {
      title: 'Coldplay - Music of the Spheres World Tour',
      description: 'Experience an unforgettable night of live music, light shows, and energy.',
      venueId: venue.id,
      organizerId: organizer.id,
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    },
  });

  console.log(`🎫 Created Event: ${event.title} (ID: ${event.id})`);

  // 5. Generate 64 Seats (8 Rows x 8 Columns)
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seatData = [];

  for (const row of rows) {
    const isVip = ['A', 'B'].includes(row);
    const price = isVip ? 250.00 : 120.00;
    const section = isVip ? 'VIP Orchestra' : 'Standard Grandstand';

    for (let col = 1; col <= 8; col++) {
      seatData.push({
        venueId: venue.id,
        eventId: event.id,
        section,
        rowNumber: row,
        seatNumber: `${row}${col}`,
        price,
        status: 'AVAILABLE',
      });
    }
  }

  await prisma.seat.createMany({ data: seatData });

  console.log(`💺 Created ${seatData.length} seats for Event`);
  console.log('✅ Database Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });