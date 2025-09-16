import Dexie, { Table } from 'dexie';
import { Client } from '@/types';

// Extended Client type for local storage with additional fields
interface LocalClient extends Client {
  createdAt?: string;
}

// Database definition
class ClientsDatabase extends Dexie {
  clients!: Table<LocalClient>;

  constructor() {
    super('ClientsDatabase');
    this.version(1).stores({
      clients: 'id, name, status, owner, createdAt, segment'
    });
  }
}

const clientsDB = new ClientsDatabase();

// Store for managing clients with IndexedDB persistence
export class ClientsStore {
  static async createClient(clientData: Omit<LocalClient, 'id'> & { id?: string }): Promise<LocalClient> {
    const client: LocalClient = {
      ...clientData,
      id: clientData.id || crypto.randomUUID(),
      createdAt: clientData.createdAt || new Date().toISOString()
    };
    
    await clientsDB.clients.put(client);
    return client;
  }

  static async updateClient(id: string, updates: Partial<Omit<LocalClient, 'id'>>): Promise<LocalClient | null> {
    const existing = await clientsDB.clients.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    await clientsDB.clients.put(updated);
    return updated;
  }

  static async getClient(id: string): Promise<LocalClient | null> {
    return await clientsDB.clients.get(id) || null;
  }

  static async getAllClients(): Promise<LocalClient[]> {
    return await clientsDB.clients.orderBy('createdAt').reverse().toArray();
  }

  static async deleteClient(id: string): Promise<void> {
    await clientsDB.clients.delete(id);
  }

  static async upsertClient(client: LocalClient): Promise<void> {
    const clientWithDate = {
      ...client,
      createdAt: client.createdAt || new Date().toISOString()
    };
    await clientsDB.clients.put(clientWithDate);
  }

  static async bulkUpsertClients(clients: LocalClient[]): Promise<void> {
    await clientsDB.clients.bulkPut(clients);
  }

  static async searchClients(query: string): Promise<LocalClient[]> {
    const lowerQuery = query.toLowerCase();
    return await clientsDB.clients
      .filter(client => 
        client.name.toLowerCase().includes(lowerQuery) ||
        client.owner?.toLowerCase().includes(lowerQuery) ||
        client.segment?.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  }

  static async getClientsByOwner(owner: string): Promise<LocalClient[]> {
    return await clientsDB.clients
      .where('owner')
      .equals(owner)
      .toArray();
  }

  // Diagnostic helpers
  static async saveDiagnostic(key: string, data: any): Promise<void> {
    localStorage.setItem(`diag:${key}`, JSON.stringify({
      ...data,
      timestamp: new Date().toISOString()
    }));
  }

  static getDiagnostic(key: string): any | null {
    try {
      const data = localStorage.getItem(`diag:${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}