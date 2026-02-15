import type { SelectedCost } from './models';

export interface BookingInput {
  roomId: string;
  startDate: string;
  endDate: string;
  pricePerNight: number;
  extraExpenses: number;
  selectedRoomCosts: SelectedCost[];
  selectedHotelCosts: SelectedCost[];
  customer?: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  };
  createdAt?: string;
}