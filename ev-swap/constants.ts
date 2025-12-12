import type { Transaction, WalletTransaction, Station } from "./types";

// API Configuration
export const API_BASE_URL = "http://192.168.80.120:3000";

export const MOCK_HISTORY: Transaction[] = [
  {
    id: "1",
    stationName: "Central Station A",
    date: "2023-10-26",
    time: "10:30 AM",
    cost: 5.5,
  },
  {
    id: "2",
    stationName: "Westside Hub",
    date: "2023-10-24",
    time: "05:45 PM",
    cost: 4.75,
  },
  {
    id: "3",
    stationName: "Downtown Point",
    date: "2023-10-22",
    time: "08:00 AM",
    cost: 6.0,
  },
];

export const MOCK_WALLET_TRANSACTIONS: WalletTransaction[] = [
  { id: "w1", type: "Top Up", date: "2023-10-25", amount: 20.0 },
  { id: "w2", type: "Payment", date: "2023-10-24", amount: -4.75 },
  { id: "w3", type: "Withdraw", date: "2023-10-23", amount: -10.0 },
  { id: "w4", type: "Payment", date: "2023-10-22", amount: -6.0 },
];

export const MOCK_STATIONS: Station[] = [
  {
    id: "s1",
    name: "City Center Station",
    address: "123 Main St, Cityville",
    distance: 1.2,
    availableBatteries: 8,
    totalSlots: 10,
    latitude: 34.0522,
    longitude: -118.2437,
  },
  {
    id: "s2",
    name: "Uptown Swap Point",
    address: "456 Oak Ave, Uptown",
    distance: 2.5,
    availableBatteries: 5,
    totalSlots: 8,
    latitude: 34.0622,
    longitude: -118.2537,
  },
  {
    id: "s3",
    name: "Riverside Exchange",
    address: "789 Pine Ln, Riverside",
    distance: 3.1,
    availableBatteries: 12,
    totalSlots: 12,
    latitude: 34.0422,
    longitude: -118.2337,
  },
  {
    id: "s4",
    name: "Suburbia Battery Hub",
    address: "101 Maple Dr, Suburbia",
    distance: 5.8,
    availableBatteries: 3,
    totalSlots: 5,
    latitude: 34.0722,
    longitude: -118.2637,
  },
];
