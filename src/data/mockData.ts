import { Apartment, Bag, Mission, StockItem, User } from '../types';

export const mockUsers: User[] = [
{
  id: 'u1',
  name: 'Admin Principal',
  role: 'admin',
  email: 'admin@conciergerie.fr'
},
{
  id: 'u2',
  name: 'Marie Dupont',
  role: 'agent',
  email: 'marie@conciergerie.fr'
},
{
  id: 'u3',
  name: 'Jean Martin',
  role: 'agent',
  email: 'jean@conciergerie.fr'
}];


export const mockStock: StockItem[] = [
{
  id: 's1',
  name: 'Parure Lit 140cm',
  category: 'linge',
  quantity: 15,
  alertThreshold: 5
},
{
  id: 's2',
  name: 'Parure Lit 160cm',
  category: 'linge',
  quantity: 8,
  alertThreshold: 3
},
{
  id: 's3',
  name: 'Serviette Bain',
  category: 'linge',
  quantity: 40,
  alertThreshold: 10
},
{
  id: 's4',
  name: 'Serviette Main',
  category: 'linge',
  quantity: 35,
  alertThreshold: 10
},
{
  id: 's5',
  name: 'Tapis de Bain',
  category: 'linge',
  quantity: 12,
  alertThreshold: 4
},
{
  id: 's6',
  name: 'Torchon',
  category: 'linge',
  quantity: 25,
  alertThreshold: 5
},
{
  id: 's7',
  name: 'Dosettes Nespresso',
  category: 'consommable',
  quantity: 150,
  alertThreshold: 20
},
{
  id: 's8',
  name: 'Dosettes Senseo',
  category: 'consommable',
  quantity: 20,
  alertThreshold: 10
},
{
  id: 's9',
  name: 'Papier Toilette',
  category: 'consommable',
  quantity: 60,
  alertThreshold: 10
},
{
  id: 's10',
  name: 'Sac Poubelle 30L',
  category: 'consommable',
  quantity: 100,
  alertThreshold: 15
}];


export const mockApartments: Apartment[] = [
{
  id: 'a1',
  name: 'Studio Marais',
  address: '12 Rue des Rosiers, 75004 Paris',
  description: 'Code porte immeuble: 1234A',
  hasCodeBox: true,
  codeBox: '4567',
  cleaningPrice: 40,
  bedCount: 1,
  coffeeType: 'nespresso',
  bagId: 'b1',
  createdAt: new Date().toISOString()
},
{
  id: 'a2',
  name: 'Loft Bastille',
  address: '45 Rue de la Roquette, 75011 Paris',
  description: 'Attention escalier étroit',
  hasCodeBox: true,
  codeBox: '8901',
  cleaningPrice: 60,
  bedCount: 2,
  coffeeType: 'nespresso',
  bagId: 'b2',
  createdAt: new Date().toISOString()
},
{
  id: 'a3',
  name: 'Appartement République',
  address: '10 Place de la République, 75010 Paris',
  description: 'Clés chez le gardien si boîtier HS',
  hasCodeBox: true,
  codeBox: '2345',
  cleaningPrice: 50,
  bedCount: 1,
  coffeeType: 'senseo',
  bagId: 'b3',
  createdAt: new Date().toISOString()
},
{
  id: 'a4',
  name: 'Duplex Montmartre',
  address: '22 Rue Lepic, 75018 Paris',
  description: 'Vue imprenable, ne pas oublier de fermer les volets',
  hasCodeBox: false,
  cleaningPrice: 80,
  bedCount: 3,
  coffeeType: 'filter',
  bagId: 'b4',
  createdAt: new Date().toISOString()
},
{
  id: 'a5',
  name: 'Studio Canal',
  address: '5 Quai de Valmy, 75010 Paris',
  hasCodeBox: true,
  codeBox: '6789',
  cleaningPrice: 35,
  bedCount: 1,
  coffeeType: 'nespresso',
  bagId: 'b5',
  createdAt: new Date().toISOString()
}];


export const mockBags: Bag[] = [
{
  id: 'b1',
  apartmentId: 'a1',
  status: 'prêt',
  items: [
  { stockItemId: 's1', quantity: 1 },
  { stockItemId: 's3', quantity: 2 },
  { stockItemId: 's4', quantity: 2 },
  { stockItemId: 's5', quantity: 1 },
  { stockItemId: 's7', quantity: 4 },
  { stockItemId: 's9', quantity: 2 }]

},
{
  id: 'b2',
  apartmentId: 'a2',
  status: 'à_préparer',
  items: [
  { stockItemId: 's2', quantity: 1 },
  { stockItemId: 's1', quantity: 1 },
  { stockItemId: 's3', quantity: 4 },
  { stockItemId: 's4', quantity: 4 },
  { stockItemId: 's5', quantity: 2 },
  { stockItemId: 's7', quantity: 6 },
  { stockItemId: 's9', quantity: 3 }]

},
{
  id: 'b3',
  apartmentId: 'a3',
  status: 'sale',
  items: [
  { stockItemId: 's1', quantity: 1 },
  { stockItemId: 's3', quantity: 2 },
  { stockItemId: 's4', quantity: 2 },
  { stockItemId: 's5', quantity: 1 },
  { stockItemId: 's8', quantity: 4 },
  { stockItemId: 's9', quantity: 2 }]

},
{
  id: 'b4',
  apartmentId: 'a4',
  status: 'en_lavage',
  items: [
  { stockItemId: 's1', quantity: 2 },
  { stockItemId: 's2', quantity: 1 },
  { stockItemId: 's3', quantity: 6 },
  { stockItemId: 's4', quantity: 6 },
  { stockItemId: 's5', quantity: 2 },
  { stockItemId: 's9', quantity: 4 }]

},
{
  id: 'b5',
  apartmentId: 'a5',
  status: 'à_préparer_incomplet',
  items: [
  { stockItemId: 's1', quantity: 1 },
  { stockItemId: 's3', quantity: 2 },
  { stockItemId: 's4', quantity: 2 },
  { stockItemId: 's5', quantity: 1 },
  { stockItemId: 's7', quantity: 4 }]

}];


const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

export const mockMissions: Mission[] = [
{
  id: 'm1',
  apartmentId: 'a1',
  date: today.toISOString().split('T')[0],
  time: '11:00',
  agentId: 'u2',
  status: 'en_cours',
  bagId: 'b1',
  createdAt: yesterday.toISOString(),
  isManual: false
},
{
  id: 'm2',
  apartmentId: 'a2',
  date: tomorrow.toISOString().split('T')[0],
  time: '10:00',
  agentId: 'u3',
  status: 'à_faire',
  bagId: 'b2',
  createdAt: yesterday.toISOString(),
  isManual: false
},
{
  id: 'm3',
  apartmentId: 'a3',
  date: yesterday.toISOString().split('T')[0],
  time: '14:00',
  agentId: 'u2',
  status: 'terminée',
  bagId: 'b3',
  createdAt: yesterday.toISOString(),
  isManual: false
},
{
  id: 'm4',
  apartmentId: 'a5',
  date: today.toISOString().split('T')[0],
  time: '13:00',
  agentId: 'u3',
  status: 'à_faire',
  bagId: 'b5',
  createdAt: yesterday.toISOString(),
  isManual: true,
  notes: 'Ménage approfondi demandé'
}];