import { MAPBOX_TOKEN } from './mapbox';

// ─── REALISTIC TRANSPORT SPEEDS ─────────────────────────────────────
const SPEEDS = {
  localTruck: 60,    // km/h — city pickup/delivery
  longHaulTruck: 80, // km/h — highway
  plane: 900,        // km/h — cargo aircraft
  ship: 35,          // km/h — cargo vessel (~19 knots)
  rail: 120,         // km/h — freight rail
};

// Fixed transfer/loading times at hubs (hours)
const TRANSFER = {
  airport: 4,  // security screening, loading, documentation
  seaport: 8,  // customs, container loading
};

// ─── TYPES ────────────────────────────────────────────────────────────
export interface TransportLeg {
  mode: 'truck' | 'plane' | 'ship' | 'rail';
  icon: string;
  label: string;
  from: string;
  to: string;
  distanceKm: number;
  durationHours: number;
  speedKmh: number;
}

export interface TransportPlan {
  id: 'road' | 'air' | 'sea';
  planName: string;
  icon: string;
  legs: TransportLeg[];
  totalDistanceKm: number;
  totalDurationHours: number;
  estimatedDeliveryDate: string; // YYYY-MM-DD
  isRecommended?: boolean;
}

// ─── HELPERS ─────────────────────────────────────────────────────────
function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
}

function hoursToDeliveryDate(hours: number): string {
  const ms = hours * 3600 * 1000;
  return new Date(Date.now() + ms).toISOString().split('T')[0];
}

export function formatPlanDuration(hours: number): string {
  const totalMins = Math.round(hours * 60);
  const days = Math.floor(totalMins / 1440);
  const remHours = Math.floor((totalMins % 1440) / 60);
  const mins = totalMins % 60;
  if (days > 0) return `${days}d ${remHours}h`;
  if (remHours > 0) return `${remHours}h ${mins}m`;
  return `${mins}m`;
}

async function findNearestHub(
  coords: [number, number],
  type: 'airport' | 'port'
): Promise<{ name: string; coords: [number, number] } | null> {
  if (!MAPBOX_TOKEN) return null;
  try {
    const query = type === 'airport' ? 'international airport' : 'seaport cargo terminal';
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?proximity=${coords[0]},${coords[1]}&access_token=${MAPBOX_TOKEN}&limit=1&types=poi,place`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const f = data.features[0];
      const shortName = f.place_name.split(',').slice(0, 2).join(',').trim();
      return { name: shortName, coords: f.center as [number, number] };
    }
  } catch (e) {
    console.error('Hub lookup error:', e);
  }
  return null;
}

// ─── MAIN PLANNER ────────────────────────────────────────────────────
export async function buildTransportPlans(
  originName: string,
  destName: string,
  originCoords: [number, number],
  destCoords: [number, number],
  routeDistanceKm: number
): Promise<TransportPlan[]> {
  const plans: TransportPlan[] = [];
  const straightKm = haversineKm(originCoords, destCoords);

  // ── PLAN 1: Road Only (always available) ─────────────────────────
  {
    const legs: TransportLeg[] = [];
    let totalHours = 0;

    if (routeDistanceKm <= 150) {
      const dur = routeDistanceKm / SPEEDS.localTruck;
      legs.push({ mode: 'truck', icon: '🚛', label: 'Local Delivery', from: originName, to: destName, distanceKm: Math.round(routeDistanceKm), durationHours: dur, speedKmh: SPEEDS.localTruck });
      totalHours = dur + 0.5;
    } else if (routeDistanceKm <= 600) {
      const dur = routeDistanceKm / SPEEDS.longHaulTruck;
      legs.push({ mode: 'truck', icon: '🚛', label: 'Regional Truck', from: originName, to: destName, distanceKm: Math.round(routeDistanceKm), durationHours: dur, speedKmh: SPEEDS.longHaulTruck });
      totalHours = dur + 1;
    } else {
      const localKm = Math.min(80, routeDistanceKm * 0.05);
      const hwKm = routeDistanceKm - localKm * 2;
      const t1 = localKm / SPEEDS.localTruck;
      const t2 = hwKm / SPEEDS.longHaulTruck;
      const t3 = localKm / SPEEDS.localTruck;
      legs.push({ mode: 'truck', icon: '🚛', label: 'Local Pickup', from: originName, to: 'Highway Entry', distanceKm: Math.round(localKm), durationHours: t1, speedKmh: SPEEDS.localTruck });
      legs.push({ mode: 'truck', icon: '🚛', label: 'Long-Haul Truck', from: 'Highway Entry', to: 'Highway Exit', distanceKm: Math.round(hwKm), durationHours: t2, speedKmh: SPEEDS.longHaulTruck });
      legs.push({ mode: 'truck', icon: '🚛', label: 'Last-Mile Delivery', from: 'Highway Exit', to: destName, distanceKm: Math.round(localKm), durationHours: t3, speedKmh: SPEEDS.localTruck });
      totalHours = t1 + t2 + t3 + 2;
    }

    plans.push({
      id: 'road', planName: 'Road Only', icon: '🚛', legs,
      totalDistanceKm: Math.round(routeDistanceKm),
      totalDurationHours: totalHours,
      estimatedDeliveryDate: hoursToDeliveryDate(totalHours + 2),
    });
  }

  // ── PLAN 2: Air Freight (distance > 800 km) ───────────────────────
  if (routeDistanceKm > 800) {
    const [oAirportRaw, dAirportRaw] = await Promise.all([
      findNearestHub(originCoords, 'airport'),
      findNearestHub(destCoords, 'airport'),
    ]);
    const oAirport = oAirportRaw ?? { name: `${originName.split(',')[0]} Airport`, coords: originCoords };
    const dAirport = dAirportRaw ?? { name: `${destName.split(',')[0]} Airport`, coords: destCoords };

    const d1 = haversineKm(originCoords, oAirport.coords);
    const d2 = haversineKm(oAirport.coords, dAirport.coords);
    const d3 = haversineKm(dAirport.coords, destCoords);
    const t1 = Math.max(0.5, d1 / SPEEDS.localTruck);
    const t2 = d2 / SPEEDS.plane;
    const t3 = Math.max(0.5, d3 / SPEEDS.localTruck);
    const totalHours = t1 + TRANSFER.airport + t2 + TRANSFER.airport + t3;

    plans.push({
      id: 'air', planName: 'Air Freight', icon: '✈️',
      legs: [
        { mode: 'truck', icon: '🚛', label: 'Truck to Airport', from: originName, to: oAirport.name, distanceKm: Math.round(d1), durationHours: t1, speedKmh: SPEEDS.localTruck },
        { mode: 'plane', icon: '✈️', label: 'Cargo Flight', from: oAirport.name, to: dAirport.name, distanceKm: Math.round(d2), durationHours: t2, speedKmh: SPEEDS.plane },
        { mode: 'truck', icon: '🚛', label: 'Last-Mile Delivery', from: dAirport.name, to: destName, distanceKm: Math.round(d3), durationHours: t3, speedKmh: SPEEDS.localTruck },
      ],
      totalDistanceKm: Math.round(d1 + d2 + d3),
      totalDurationHours: totalHours,
      estimatedDeliveryDate: hoursToDeliveryDate(totalHours + 4),
      isRecommended: routeDistanceKm > 2000,
    });
  }

  // ── PLAN 3: Sea Freight (straight-line > 3500 km — intercontinental) ─
  if (straightKm > 3500) {
    const [oPortRaw, dPortRaw] = await Promise.all([
      findNearestHub(originCoords, 'port'),
      findNearestHub(destCoords, 'port'),
    ]);
    const oPort = oPortRaw ?? { name: `${originName.split(',')[0]} Seaport`, coords: originCoords };
    const dPort = dPortRaw ?? { name: `${destName.split(',')[0]} Seaport`, coords: destCoords };

    const d1 = haversineKm(originCoords, oPort.coords);
    const d2 = haversineKm(oPort.coords, dPort.coords);
    const d3 = haversineKm(dPort.coords, destCoords);
    const t1 = Math.max(1, d1 / SPEEDS.longHaulTruck);
    const t2 = d2 / SPEEDS.ship;
    const t3 = Math.max(1, d3 / SPEEDS.longHaulTruck);
    const totalHours = t1 + TRANSFER.seaport + t2 + TRANSFER.seaport + t3;

    plans.push({
      id: 'sea', planName: 'Sea Freight', icon: '🚢',
      legs: [
        { mode: 'truck', icon: '🚛', label: 'Truck to Seaport', from: originName, to: oPort.name, distanceKm: Math.round(d1), durationHours: t1, speedKmh: SPEEDS.longHaulTruck },
        { mode: 'ship', icon: '🚢', label: 'Cargo Vessel', from: oPort.name, to: dPort.name, distanceKm: Math.round(d2), durationHours: t2, speedKmh: SPEEDS.ship },
        { mode: 'truck', icon: '🚛', label: 'Last-Mile Delivery', from: dPort.name, to: destName, distanceKm: Math.round(d3), durationHours: t3, speedKmh: SPEEDS.longHaulTruck },
      ],
      totalDistanceKm: Math.round(d1 + d2 + d3),
      totalDurationHours: totalHours,
      estimatedDeliveryDate: hoursToDeliveryDate(totalHours + 8),
    });
  }

  // Mark recommended plan (air if long, road if short)
  if (plans.length > 1 && !plans.some(p => p.isRecommended)) {
    const rec = routeDistanceKm > 2000
      ? plans.find(p => p.id === 'air')
      : plans.find(p => p.id === 'road');
    if (rec) rec.isRecommended = true;
  }

  return plans;
}
