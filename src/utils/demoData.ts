import { format } from 'date-fns';
import type { Room, Booking, CostCatalogItem, Forecast } from '../types/models';

/**
 * Demo data seeder for first-time app initialization
 */

export function generateDemoRooms(): Room[] {
  const now = new Date().toISOString();
  
  return [
    {
      id: crypto.randomUUID(),
      name: 'Ocean View Suite',
      number: '101',
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: 'Mountain Lodge',
      number: '202',
      createdAt: now,
    },
  ];
}

export function generateDemoCostCatalog(): CostCatalogItem[] {
  return [
    // Room costs
    {
      id: crypto.randomUUID(),
      type: 'room',
      label: 'Cleaning',
      unitCost: 25,
      defaultQty: 1,
      isActive: true,
    },
    {
      id: crypto.randomUUID(),
      type: 'room',
      label: 'Laundry',
      unitCost: 15,
      defaultQty: 1,
      isActive: true,
    },
    {
      id: crypto.randomUUID(),
      type: 'room',
      label: 'Amenities',
      unitCost: 10,
      defaultQty: 1,
      isActive: true,
    },
    // Hotel costs
    {
      id: crypto.randomUUID(),
      type: 'hotel',
      label: 'Marketing',
      unitCost: 20,
      defaultQty: 1,
      isActive: true,
    },
    {
      id: crypto.randomUUID(),
      type: 'hotel',
      label: 'Payment Fees',
      unitCost: 12,
      defaultQty: 1,
      isActive: true,
    },
    {
      id: crypto.randomUUID(),
      type: 'hotel',
      label: 'Maintenance',
      unitCost: 30,
      defaultQty: 1,
      isActive: true,
    },
  ];
}

export function generateDemoBookings(rooms: Room[], costCatalog: CostCatalogItem[]): Booking[] {
  const now = new Date();
  const currentMonth = format(now, 'yyyy-MM');
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  
  // Create bookings with different date ranges in current month
  const booking1StartDate = new Date(year, month, 5);
  const booking1EndDate = new Date(year, month, 8);
  
  const booking2StartDate = new Date(year, month, 15);
  const booking2EndDate = new Date(year, month, 20);

  const roomCosts = costCatalog.filter(c => c.type === 'room' && c.isActive);
  const hotelCosts = costCatalog.filter(c => c.type === 'hotel' && c.isActive);

  const selectedRoomCosts1 = roomCosts.slice(0, 2).map(cost => ({
    catalogId: cost.id,
    labelSnapshot: cost.label,
    unitCostSnapshot: cost.unitCost,
    qty: cost.defaultQty,
    total: cost.unitCost * cost.defaultQty,
  }));

  const selectedHotelCosts1 = hotelCosts.slice(0, 1).map(cost => ({
    catalogId: cost.id,
    labelSnapshot: cost.label,
    unitCostSnapshot: cost.unitCost,
    qty: cost.defaultQty,
    total: cost.unitCost * cost.defaultQty,
  }));

  const selectedRoomCosts2 = roomCosts.slice(0, 1).map(cost => ({
    catalogId: cost.id,
    labelSnapshot: cost.label,
    unitCostSnapshot: cost.unitCost,
    qty: cost.defaultQty,
    total: cost.unitCost * cost.defaultQty,
  }));

  const selectedHotelCosts2 = hotelCosts.slice(0, 2).map(cost => ({
    catalogId: cost.id,
    labelSnapshot: cost.label,
    unitCostSnapshot: cost.unitCost,
    qty: cost.defaultQty,
    total: cost.unitCost * cost.defaultQty,
  }));

  const totalRoomCosts1 = selectedRoomCosts1.reduce((sum, c) => sum + c.total, 0);
  const totalHotelCosts1 = selectedHotelCosts1.reduce((sum, c) => sum + c.total, 0);
  const nightsCount1 = 3; // 5-8
  const income1 = nightsCount1 * 120;
  const extraExpenses1 = 10;

  const totalRoomCosts2 = selectedRoomCosts2.reduce((sum, c) => sum + c.total, 0);
  const totalHotelCosts2 = selectedHotelCosts2.reduce((sum, c) => sum + c.total, 0);
  const nightsCount2 = 5; // 15-20
  const income2 = nightsCount2 * 150;
  const extraExpenses2 = 20;

  const grossProfit1 = income1 - totalRoomCosts1;
  const netProfit1 = grossProfit1 - (totalHotelCosts1 + extraExpenses1);
  const potentialProfit1 = income1 - (totalRoomCosts1 + totalHotelCosts1);

  const grossProfit2 = income2 - totalRoomCosts2;
  const netProfit2 = grossProfit2 - (totalHotelCosts2 + extraExpenses2);
  const potentialProfit2 = income2 - (totalRoomCosts2 + totalHotelCosts2);

  return [
    {
      id: crypto.randomUUID(),
      roomId: rooms[0].id,
      startDate: format(booking1StartDate, 'yyyy-MM-dd'),
      endDate: format(booking1EndDate, 'yyyy-MM-dd'),
      monthKey: currentMonth,
      weekOfMonth: 1,
      pricePerNight: 120,
      nightsCount: nightsCount1,
      income: income1,
      extraExpenses: extraExpenses1,
      selectedRoomCosts: selectedRoomCosts1,
      selectedHotelCosts: selectedHotelCosts1,
      totals: {
        totalRoomCosts: totalRoomCosts1,
        totalHotelCosts: totalHotelCosts1,
        totalOrderExpenses: totalRoomCosts1 + totalHotelCosts1,
      },
      metrics: {
        potentialProfit: potentialProfit1,
        grossProfit: grossProfit1,
        netProfit: netProfit1,
      },
      customer: {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+1234567890',
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: crypto.randomUUID(),
      roomId: rooms[1].id,
      startDate: format(booking2StartDate, 'yyyy-MM-dd'),
      endDate: format(booking2EndDate, 'yyyy-MM-dd'),
      monthKey: currentMonth,
      weekOfMonth: 3,
      pricePerNight: 150,
      nightsCount: nightsCount2,
      income: income2,
      extraExpenses: extraExpenses2,
      selectedRoomCosts: selectedRoomCosts2,
      selectedHotelCosts: selectedHotelCosts2,
      totals: {
        totalRoomCosts: totalRoomCosts2,
        totalHotelCosts: totalHotelCosts2,
        totalOrderExpenses: totalRoomCosts2 + totalHotelCosts2,
      },
      metrics: {
        potentialProfit: potentialProfit2,
        grossProfit: grossProfit2,
        netProfit: netProfit2,
      },
      customer: {
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];
}

export function generateDemoForecasts(): Forecast[] {
  const now = new Date();
  const currentMonth = format(now, 'yyyy-MM');
  
  return [
    {
      id: crypto.randomUUID(),
      monthKey: currentMonth,
      category: 'Expected Bookings',
      expectedAmount: 5000,
      confidence: 85,
      createdAt: now.toISOString(),
    },
  ];
}
