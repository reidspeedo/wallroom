import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.session.deleteMany();
  await prisma.userSetting.deleteMany();

  // Create admin settings
  console.log('Creating admin settings...');
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const boardPublicToken = crypto.randomBytes(32).toString('hex');

  const settings = await prisma.userSetting.create({
    data: {
      adminPasswordHash,
      boardPublicToken,
      pollIntervalSeconds: 10,
      timeZone: 'America/New_York',
      bookingDurations: [15, 30, 60, 90, 120],
      extendIncrements: [15, 30]
    }
  });

  console.log('✓ Admin settings created');
  console.log(`  Admin password: admin123`);
  console.log(
    `  Board URL: http://localhost:3000/board/${settings.boardPublicToken}`
  );

  // Create sample rooms
  console.log('Creating sample rooms...');
  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        name: 'Conference Room A',
        description: 'Large conference room with projector',
        color: '#3b82f6',
        isActive: true,
        displayOrder: 1,
        capacity: 12
      }
    }),
    prisma.room.create({
      data: {
        name: 'Conference Room B',
        description: 'Medium meeting room',
        color: '#10b981',
        isActive: true,
        displayOrder: 2,
        capacity: 8
      }
    }),
    prisma.room.create({
      data: {
        name: 'Small Meeting Room',
        description: 'Cozy room for small team meetings',
        color: '#f59e0b',
        isActive: true,
        displayOrder: 3,
        capacity: 4
      }
    }),
    prisma.room.create({
      data: {
        name: 'Phone Booth 1',
        description: 'Private space for calls',
        color: '#8b5cf6',
        isActive: true,
        displayOrder: 4,
        capacity: 1
      }
    }),
    prisma.room.create({
      data: {
        name: 'Phone Booth 2',
        description: 'Private space for calls',
        color: '#ec4899',
        isActive: true,
        displayOrder: 5,
        capacity: 1
      }
    })
  ]);

  console.log(`✓ Created ${rooms.length} rooms`);

  // Create sample bookings
  console.log('Creating sample bookings...');
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const inThirtyMinutes = new Date(now.getTime() + 30 * 60 * 1000);
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  const inTwoHours = new Date(now.getTime() + 120 * 60 * 1000);
  const inThreeHours = new Date(now.getTime() + 180 * 60 * 1000);

  const bookings = await Promise.all([
    // Current booking for Conference Room A
    prisma.booking.create({
      data: {
        roomId: rooms[0].id,
        title: 'Team Standup',
        startTime: oneHourAgo,
        endTime: inThirtyMinutes,
        status: 'active',
        source: 'board'
      }
    }),
    // Upcoming booking for Conference Room A
    prisma.booking.create({
      data: {
        roomId: rooms[0].id,
        title: 'Product Review',
        startTime: inOneHour,
        endTime: inTwoHours,
        status: 'active',
        source: 'board'
      }
    }),
    // Current booking for Small Meeting Room
    prisma.booking.create({
      data: {
        roomId: rooms[2].id,
        title: '1-on-1 with Manager',
        startTime: now,
        endTime: inOneHour,
        status: 'active',
        source: 'board'
      }
    }),
    // Upcoming booking for Conference Room B
    prisma.booking.create({
      data: {
        roomId: rooms[1].id,
        title: 'Design Workshop',
        startTime: inTwoHours,
        endTime: inThreeHours,
        status: 'active',
        source: 'board'
      }
    })
  ]);

  console.log(`✓ Created ${bookings.length} sample bookings`);

  console.log('\n✅ Seeding completed successfully!');
  console.log('\nYou can now:');
  console.log('1. Login to admin: http://localhost:3000/admin/login');
  console.log('   Username: (none) Password: admin123');
  console.log(
    `2. View board: http://localhost:3000/board/${settings.boardPublicToken}`
  );
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
