import prisma from '../src/config/db.js';
import { hashPassword } from '../src/utils/crypto.js';

async function main() {
  console.log('Replacing all database records with minimal test data...');

  await prisma.$transaction(async (tx) => {
    await tx.report.deleteMany();
    await tx.notification.deleteMany();
    await tx.batteryInventory.deleteMany();
    await tx.chargingSession.deleteMany();
    await tx.slotAllocation.deleteMany();
    await tx.booking.deleteMany();
    await tx.chargingSlot.deleteMany();
    await tx.vehicle.deleteMany();
    await tx.stationManager.deleteMany();
    await tx.customer.deleteMany();
    await tx.chargingStation.deleteMany();
    await tx.user.deleteMany();

    const admin = await tx.user.create({
      data: {
        name: 'Test Admin',
        email: 'admin@evcharge.com',
        password: hashPassword('adminpass123'),
        role: 'Admin',
      },
    });

    const managerUser = await tx.user.create({
      data: {
        name: 'Test Manager',
        email: 'john.manager@evcharge.com',
        password: hashPassword('managerpass123'),
        role: 'Station Manager',
      },
    });

    const customerUser = await tx.user.create({
      data: {
        name: 'Test Customer',
        email: 'alice@customer.com',
        password: hashPassword('customerpass123'),
        role: 'Customer',
      },
    });

    const station = await tx.chargingStation.create({
      data: {
        station_name: 'Test EV Charging Station',
        address: '1 Test Street',
        city: 'Ahmedabad',
        latitude: 23.0225,
        longitude: 72.5714,
        total_slots: 2,
        available_slots: 2,
        status: 'Active',
      },
    });

    const customer = await tx.customer.create({
      data: {
        user_id: customerUser.user_id,
        name: customerUser.name,
        address: '1 Test Street, Ahmedabad',
        preferred_station_id: station.station_id,
      },
    });

    await tx.stationManager.create({
      data: {
        user_id: managerUser.user_id,
        station_id: station.station_id,
        shift: 'Morning',
      },
    });

    await tx.vehicle.create({
      data: {
        customer_id: customer.customer_id,
        vehicle_number: 'TEST-EV-001',
        vehicle_model: 'Test Electric Car',
        battery_model: 'Test Battery',
        battery_capacity: 60,
        current_charge: 35,
        vehicle_type: 'Car',
      },
    });

    await tx.chargingSlot.createMany({
      data: [
        { station_id: station.station_id, slot_number: 1, charging_speed: 'Fast' },
        { station_id: station.station_id, slot_number: 2, charging_speed: 'Normal' },
      ],
    });

    console.log(
      `Test data created: ${admin.email}, ${managerUser.email}, ${customerUser.email}; ` +
      `${station.station_name} (${station.total_slots} available slots).`
    );
  }, { maxWait: 10000, timeout: 60000 });
}

main()
  .catch((error) => {
    console.error('Failed to replace database test data:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
