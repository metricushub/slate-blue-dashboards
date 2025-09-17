import Dexie, { Table } from 'dexie';

export interface ClientFinance {
  id: string; // clientId
  contractStatus: 'Ativo' | 'Pendente' | 'Encerrado';
  nextDueDate: string; // YYYY-MM-DD
  amountMonthly: number;
  method: 'Boleto' | 'Pix' | 'Cartão';
  updatedAt: string;
}

interface ClientFinanceDatabase extends Dexie {
  clientFinances: Table<ClientFinance>;
}

const clientFinanceDb = new Dexie('ClientFinanceDatabase') as ClientFinanceDatabase;

clientFinanceDb.version(1).stores({
  clientFinances: 'id, contractStatus, nextDueDate, updatedAt'
});

export const clientFinanceOperations = {
  async upsert(clientId: string, data: Omit<ClientFinance, 'id' | 'updatedAt'>): Promise<ClientFinance> {
    const finance: ClientFinance = {
      ...data,
      id: clientId,
      updatedAt: new Date().toISOString()
    };
    await clientFinanceDb.clientFinances.put(finance);
    return finance;
  },

  async getByClientId(clientId: string): Promise<ClientFinance | undefined> {
    return await clientFinanceDb.clientFinances.get(clientId);
  },

  async getAll(): Promise<ClientFinance[]> {
    return await clientFinanceDb.clientFinances.toArray();
  },

  async delete(clientId: string): Promise<void> {
    await clientFinanceDb.clientFinances.delete(clientId);
  }
};

// Criar dados de exemplo para alguns clientes
const initializeSampleData = async () => {
  try {
    const existingData = await clientFinanceDb.clientFinances.count();
    if (existingData === 0) {
      const sampleFinances: ClientFinance[] = [
        {
          id: 'client-1',
          contractStatus: 'Ativo',
          nextDueDate: '2024-12-20',
          amountMonthly: 2500,
          method: 'Boleto',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'client-2',
          contractStatus: 'Pendente',
          nextDueDate: '2024-12-15',
          amountMonthly: 4200,
          method: 'Pix',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'client-3',
          contractStatus: 'Ativo',
          nextDueDate: '2024-12-10',
          amountMonthly: 3800,
          method: 'Cartão',
          updatedAt: new Date().toISOString()
        }
      ];
      await clientFinanceDb.clientFinances.bulkAdd(sampleFinances);
    }
  } catch (error) {
    console.error('Erro ao inicializar dados de exemplo:', error);
  }
};

// Inicializar dados de exemplo
initializeSampleData();

export default clientFinanceDb;