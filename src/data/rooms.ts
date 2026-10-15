import simpleImg     from "../assets/rooms/room-simple-real.jpeg";
import matrimonialImg from "../assets/rooms/room-matrimonial-real.jpeg";
import dobleImg       from "../assets/rooms/room-doble-real.jpeg";
import familiarImg    from "../assets/rooms/room-familiar-real.jpeg";
import tripleImg      from "../assets/rooms/room-triple-real.jpeg";
import cuadrupleImg   from "../assets/rooms/room-cuadruple-real.jpeg";

export type RoomCategory = "room";
export type AmenityKey =
  | "wifi"
  | "tv"
  | "shower"
  | "desk"
  | "closet"
  | "fan"
  | "breakfast"
  | "hairdryer"
  | "towels"
  | "iron"
  | "laundry";

export interface Room {
  id: string;
  /** Matches the `type` field in the admin `rooms` table — used for availability checks */
  adminType: string;
  nameKey: string;
  category: RoomCategory;
  image: string;
  gallery: string[];
  price: number;
  priceUSD: number;
  capacity: number;
  amenities: AmenityKey[];
}

const commonAmenities: AmenityKey[] = [
  "wifi",
  "tv",
  "shower",
  "breakfast",
  "hairdryer",
  "towels",
  "iron",
  "laundry",
  "desk",
  "closet",
  "fan",
];

export const rooms: Room[] = [
  {
    id: "simple",
    adminType: "SIMPLE",
    nameKey: "rooms.names.simple",
    category: "room",
    image: simpleImg,
    gallery: [simpleImg],
    price: 170,
    priceUSD: 19,
    capacity: 1,
    amenities: commonAmenities,
  },
  {
    id: "matrimonial",
    adminType: "MATRIMONIAL",
    nameKey: "rooms.names.matrimonial",
    category: "room",
    image: matrimonialImg,
    gallery: [matrimonialImg],
    price: 270,
    priceUSD: 30,
    capacity: 2,
    amenities: commonAmenities,
  },
  {
    id: "doble",
    adminType: "DOBLE",
    nameKey: "rooms.names.doble",
    category: "room",
    image: dobleImg,
    gallery: [dobleImg],
    price: 270,
    priceUSD: 30,
    capacity: 2,
    amenities: commonAmenities,
  },
  {
    id: "familiar",
    adminType: "FAMILIAR",
    nameKey: "rooms.names.familiar",
    category: "room",
    image: familiarImg,
    gallery: [familiarImg],
    price: 330,
    priceUSD: 36,
    capacity: 3,
    amenities: commonAmenities,
  },
  {
    id: "triple",
    adminType: "TRIPLE",
    nameKey: "rooms.names.triple",
    category: "room",
    image: tripleImg,
    gallery: [tripleImg],
    price: 330,
    priceUSD: 36,
    capacity: 3,
    amenities: commonAmenities,
  },
  {
    id: "cuadruple",
    adminType: "CUADRUPLE",
    nameKey: "rooms.names.cuadruple",
    category: "room",
    image: cuadrupleImg,
    gallery: [cuadrupleImg],
    price: 400,
    priceUSD: 44,
    capacity: 4,
    amenities: commonAmenities,
  },
];
