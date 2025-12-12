
export interface Transaction {
  id: string;
  stationName: string;
  date: string;
  time: string;
  cost: number;
}

export interface WalletTransaction {
  id:string;
  type: 'Top Up' | 'Withdraw' | 'Payment';
  date: string;
  amount: number;
}

export interface Station {
    id: string;
    name: string;
    address: string;
    distance: number; // in km
    availableBatteries: number;
    totalSlots: number;
    latitude: number;
    longitude: number;
}
