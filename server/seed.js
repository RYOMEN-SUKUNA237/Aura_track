const bcrypt = require('bcryptjs');
const pool = require('./db');

async function seed() {
  console.log('🌱 Seeding Supabase database...\n');

  // ─── ADMIN USER ────────────────────────────────────────────────────
  const { rows: existingAdmin } = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
  if (existingAdmin.length === 0) {
    const hash = await bcrypt.hash('admin123', 12);
    await pool.query(
      'INSERT INTO users (username, email, password, full_name, phone, role) VALUES ($1, $2, $3, $4, $5, $6)',
      ['admin', 'admin@auratrack.com', hash, 'Admin User', '+1 (800) 555-0199', 'admin']
    );
    console.log('✅ Admin user created (username: admin, password: admin123)');
  } else {
    console.log('⏭  Admin user already exists.');
  }

  // ─── COURIERS ──────────────────────────────────────────────────────
  const { rows: [{ count: courierCount }] } = await pool.query('SELECT COUNT(*) as count FROM couriers');
  if (parseInt(courierCount) === 0) {
    const couriers = [
      ['AT-CUR-7X92KP', 'Marcus Johnson', 'marcus@auratrack.com', '+1 555-0101', 'van', 'TX-4821-MJ', 'Downtown Houston', 'on-delivery', 342, 4.8, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fm=jpg&fit=crop&w=100&q=80'],
      ['AT-CUR-3B81NQ', 'Sofia Martinez', 'sofia@auratrack.com', '+1 555-0102', 'motorcycle', 'TX-1192-SM', 'Midtown', 'active', 578, 4.9, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?fm=jpg&fit=crop&w=100&q=80'],
      ['AT-CUR-9D44RL', 'Emily Chen', 'emily@auratrack.com', '+1 555-0103', 'car', 'TX-8830-EC', 'Galleria Area', 'on-break', 124, 4.6, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?fm=jpg&fit=crop&w=100&q=80'],
      ['AT-CUR-5F27WT', 'David Okafor', 'david@auratrack.com', '+1 555-0104', 'truck', 'TX-6654-DO', 'Industrial District', 'active', 891, 4.7, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?fm=jpg&fit=crop&w=100&q=80'],
      ['AT-CUR-2H65YM', 'Jake Williams', 'jake@auratrack.com', '+1 555-0105', 'van', 'TX-3347-JW', 'Medical Center', 'inactive', 56, 4.3, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?fm=jpg&fit=crop&w=100&q=80'],
    ];

    for (const c of couriers) {
      await pool.query(
        'INSERT INTO couriers (courier_id, name, email, phone, vehicle_type, license_plate, zone, status, total_deliveries, rating, avatar) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
        c
      );
    }
    console.log(`✅ ${couriers.length} couriers created.`);
  } else {
    console.log(`⏭  ${courierCount} couriers already exist.`);
  }

  // ─── CUSTOMERS ─────────────────────────────────────────────────────
  const { rows: [{ count: customerCount }] } = await pool.query('SELECT COUNT(*) as count FROM customers');
  if (parseInt(customerCount) === 0) {
    const customers = [
      ['AT-CST-TX8801', 'TechFlow Inc.', 'John Rivera', 'john@techflow.com', '+1 555-2001', '500 Tech Lane', 'Houston', 'TX', 'US', '77001', 'business'],
      ['AT-CST-NY3302', 'MedPharma Global', 'Dr. Sarah Lin', 'sarah@medpharma.com', '+1 555-2002', '200 Pharma Blvd', 'New York', 'NY', 'US', '10001', 'business'],
      ['AT-CST-MI4403', 'AutoMakers Co.', 'Mike Torres', 'mike@automakers.com', '+1 555-2003', '800 Motor Ave', 'Detroit', 'MI', 'US', '48201', 'business'],
      ['AT-CST-FL5504', null, 'Lisa Morgan', 'lisa.morgan@email.com', '+1 555-2004', '45 Palm Street', 'Miami', 'FL', 'US', '33101', 'individual'],
      ['AT-CST-MA6605', 'Book Depot', 'Robert Kim', 'robert@bookdepot.com', '+1 555-2005', '12 Library Rd', 'Boston', 'MA', 'US', '02101', 'business'],
      ['AT-CST-CA7706', 'Fresh Foods Co.', 'Anna Perez', 'anna@freshfoods.com', '+1 555-2006', '90 Market St', 'San Francisco', 'CA', 'US', '94101', 'business'],
      ['AT-CST-GA8807', null, 'James Brown', 'james.b@email.com', '+1 555-2007', '33 Peach Lane', 'Atlanta', 'GA', 'US', '30301', 'individual'],
      ['AT-CST-IL9908', 'City Hospital', 'Dr. Karen White', 'karen@cityhospital.org', '+1 555-2008', '1 Health Pkwy', 'Chicago', 'IL', 'US', '60601', 'business'],
    ];

    for (const c of customers) {
      await pool.query(
        'INSERT INTO customers (customer_id, company_name, contact_name, email, phone, address, city, state, country, postal_code, type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
        c
      );
    }
    console.log(`✅ ${customers.length} customers created.`);
  } else {
    console.log(`⏭  ${customerCount} customers already exist.`);
  }

  // ─── SHIPMENTS ─────────────────────────────────────────────────────
  const { rows: [{ count: shipmentCount }] } = await pool.query('SELECT COUNT(*) as count FROM shipments');
  if (parseInt(shipmentCount) === 0) {
    // Use relative times so seed data always produces moving markers
    const now = Date.now();
    const hours = (h) => h * 3600000;
    const days = (d) => d * 86400000;

    // departed_at in the past, estimated_delivery in the future → shipments are actively progressing
    const shipments = [
      ['AT-8842-X9', 'TechFlow Inc.', 'john@techflow.com', '+1 555-2001', 'Global Parts Ltd.', 'parts@globalparts.com', '+1 555-3001', 'Houston, TX', 'Los Angeles, CA', 29.7604, -95.3698, 34.0522, -118.2437, 'in-transit', 'AT-CUR-7X92KP', 'AT-CST-TX8801', '24.5 kg', '60x40x30 cm', 'Electronics', 0, false,
        new Date(now + days(2)).toISOString().split('T')[0],
        new Date(now - hours(18)).toISOString()],
      ['AT-3291-K4', 'MedPharma Global', 'sarah@medpharma.com', '+1 555-2002', 'City Hospital', 'karen@cityhospital.org', '+1 555-2008', 'New York, NY', 'Chicago, IL', 40.7128, -74.006, 41.8781, -87.6298, 'out-for-delivery', 'AT-CUR-3B81NQ', 'AT-CST-NY3302', '8.2 kg', '30x20x15 cm', 'Pharmaceuticals', 0, false,
        new Date(now + hours(8)).toISOString().split('T')[0],
        new Date(now - hours(30)).toISOString()],
      ['AT-5510-A2', 'AutoMakers Co.', 'mike@automakers.com', '+1 555-2003', 'Precision Motors', 'pm@precisionmotors.com', '+1 555-3003', 'Detroit, MI', 'Houston, TX', 42.3314, -83.0458, 29.7604, -95.3698, 'picked-up', 'AT-CUR-5F27WT', 'AT-CST-MI4403', '150.0 kg', '120x80x60 cm', 'Auto Parts', 0, false,
        new Date(now + days(4)).toISOString().split('T')[0],
        new Date(now - hours(4)).toISOString()],
      ['AT-7723-M6', 'Fashion House', 'info@fashionhouse.com', '+1 555-3004', 'Retail Store #42', 'store42@retail.com', '+1 555-3005', 'Miami, FL', 'Atlanta, GA', 25.7617, -80.1918, 33.749, -84.388, 'pending', null, 'AT-CST-FL5504', '5.1 kg', '40x30x20 cm', 'Apparel', 0, false,
        new Date(now + days(3)).toISOString().split('T')[0],
        null],
      ['AT-1198-B7', 'Book Depot', 'robert@bookdepot.com', '+1 555-2005', 'University Library', 'library@university.edu', '+1 555-3006', 'Boston, MA', 'Philadelphia, PA', 42.3601, -71.0589, 39.9526, -75.1652, 'delivered', 'AT-CUR-9D44RL', 'AT-CST-MA6605', '32.0 kg', '50x40x40 cm', 'Books & Documents', 100, false,
        new Date(now - days(1)).toISOString().split('T')[0],
        new Date(now - days(3)).toISOString()],
      ['AT-6645-Z1', 'Fresh Foods Co.', 'anna@freshfoods.com', '+1 555-2006', 'Restaurant Group', 'orders@restgroup.com', '+1 555-3007', 'San Francisco, CA', 'Seattle, WA', 37.7749, -122.4194, 47.6062, -122.3321, 'paused', 'AT-CUR-7X92KP', 'AT-CST-CA7706', '45.0 kg', '80x60x40 cm', 'Perishables', 0, true,
        new Date(now + days(1.5)).toISOString().split('T')[0],
        new Date(now - hours(12)).toISOString()],
    ];

    for (const s of shipments) {
      await pool.query(`
        INSERT INTO shipments (tracking_id, sender_name, sender_email, sender_phone, receiver_name, receiver_email, receiver_phone, origin, destination, origin_lat, origin_lng, dest_lat, dest_lng, status, courier_id, customer_id, weight, dimensions, cargo_type, progress, is_paused, estimated_delivery, departed_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
      `, s);
    }

    // Set paused_at for the paused shipment
    await pool.query('UPDATE shipments SET paused_at = $1 WHERE tracking_id = $2',
      [new Date(now - hours(2)).toISOString(), 'AT-6645-Z1']);

    console.log(`✅ ${shipments.length} shipments created.`);

    // Add tracking history for each shipment
    const { rows: allShipments } = await pool.query('SELECT * FROM shipments');

    for (const s of allShipments) {
      await pool.query(
        'INSERT INTO tracking_history (shipment_id, tracking_id, status, location, notes, updated_by) VALUES ($1,$2,$3,$4,$5,$6)',
        [s.id, s.tracking_id, 'pending', s.origin, 'Shipment created.', 'admin']
      );
      if (s.status !== 'pending') {
        await pool.query(
          'INSERT INTO tracking_history (shipment_id, tracking_id, status, location, notes, updated_by) VALUES ($1,$2,$3,$4,$5,$6)',
          [s.id, s.tracking_id, 'picked-up', s.origin, 'Package picked up by courier.', 'admin']
        );
      }
      if (['in-transit', 'out-for-delivery', 'delivered', 'paused'].includes(s.status)) {
        await pool.query(
          'INSERT INTO tracking_history (shipment_id, tracking_id, status, location, notes, updated_by) VALUES ($1,$2,$3,$4,$5,$6)',
          [s.id, s.tracking_id, 'in-transit', 'En Route', 'Shipment is in transit.', 'admin']
        );
      }
      if (s.status === 'out-for-delivery') {
        await pool.query(
          'INSERT INTO tracking_history (shipment_id, tracking_id, status, location, notes, updated_by) VALUES ($1,$2,$3,$4,$5,$6)',
          [s.id, s.tracking_id, 'out-for-delivery', s.destination, 'Out for delivery.', 'admin']
        );
      }
      if (s.status === 'delivered') {
        await pool.query(
          'INSERT INTO tracking_history (shipment_id, tracking_id, status, location, notes, updated_by) VALUES ($1,$2,$3,$4,$5,$6)',
          [s.id, s.tracking_id, 'delivered', s.destination, 'Delivered successfully.', 'admin']
        );
      }
      if (s.status === 'paused') {
        await pool.query(
          'INSERT INTO tracking_history (shipment_id, tracking_id, status, location, notes, updated_by) VALUES ($1,$2,$3,$4,$5,$6)',
          [s.id, s.tracking_id, 'paused', 'En Route', 'Shipment paused — awaiting clearance.', 'admin']
        );
      }
    }
    console.log('✅ Tracking history created for all shipments.');
  } else {
    console.log(`⏭  ${shipmentCount} shipments already exist.`);
  }

  // ─── NOTIFICATIONS ─────────────────────────────────────────────────
  const { rows: [{ count: notifCount }] } = await pool.query('SELECT COUNT(*) as count FROM notifications');
  if (parseInt(notifCount) === 0) {
    const notifs = [
      ['Courier Marcus Johnson picked up AT-8842-X9', 'Shipment is now in transit to Los Angeles, CA.', 'info'],
      ['Shipment AT-3291-K4 out for delivery', 'Package is being delivered to City Hospital, Chicago.', 'info'],
      ['Shipment AT-6645-Z1 PAUSED', 'Fresh Foods shipment paused — awaiting customs clearance.', 'warning'],
      ['Shipment AT-1198-B7 delivered', 'Book Depot shipment delivered to University Library.', 'success'],
      ['New customer registered', 'James Brown (AT-CST-GA8807) registered as individual customer.', 'info'],
    ];

    for (const n of notifs) {
      await pool.query('INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)', n);
    }
    console.log(`✅ ${notifs.length} notifications created.`);
  }

  console.log('\n🎉 Supabase database seeded successfully!');
  console.log('──────────────────────────────────────');
  console.log('Admin Login:  username: admin  |  password: admin123');
  console.log('──────────────────────────────────────\n');

  await pool.end();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
