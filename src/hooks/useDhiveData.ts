import type { SpendHistoryItem } from '../types/business';
import { DhiveService } from '../services/dhive-service';


export interface DhiveTransaction {
  cashback: string;
  cashbackPercent: string;
  spendingAmount: string;
  trxnTs: string;
  country: string;
  city: string;
  state: string;
  businessName: string;
}

export const getFormattedSpendHistory = async (
  username: string,
  filterDays: number
): Promise<DhiveTransaction[]> => {
  try {
    // Calculate filter date (current date - filterDays)
    const currentDate = new Date();
    const filterTimestamp = new Date();
    filterTimestamp.setDate(currentDate.getDate() - filterDays);

    // Use centralized cached fetch (newest -> oldest)
    const transfers = await DhiveService.getTransferHistorySinceDateWithCache(
      username,
      filterTimestamp
    );

    const transactions: DhiveTransaction[] = transfers
      .filter((tx: any) => {
        const op = (tx.op as any)[1];
        const memo: string = op?.memo || '';
        const from: string = op?.from;
        const isTransfer = (tx.op as any)[0] === 'transfer';
        return (
          isTransfer &&
          from === 'thedistriator' &&
          memo.startsWith('You claimed back')
        );
      })
      .map((tx: any) => {
        const details = (tx.op as any)[1];
        const cashback: string = details.amount;
        const timestamp: string = tx.timestamp;
        const memo: string = details.memo || '';

        let cashbackPercent = '0.00 %';
        let spendingAmount = '0.000 HBD';
        let businessName = '';

          // Extract cashback percentage
        const cashbackMatch = memo.match(/You claimed back (\d+(\.\d+)?) %/);
        if (cashbackMatch) {
          cashbackPercent = `${cashbackMatch[1]} %`;
            const cashbackValue = parseFloat(cashback.split(' ')[0]); // Convert cashback to number
          const percentValue = parseFloat(cashbackMatch[1]);

          if (percentValue > 0) {
            spendingAmount = `${(cashbackValue / percentValue * 100).toFixed(3)} HBD`;
          }
        }

          // Extract business name (between "a" and "-")
        const businessMatch = memo.match(/(?<=& adding review of )(.*?)(?= - https:\/\/)/);
        if (businessMatch) {
          businessName = businessMatch[1];
        }

        return {
          cashback,
          cashbackPercent,
          spendingAmount,
          trxnTs: timestamp,
            country: "",
            city: "",
            state: "",
            businessName
        };
      });

    return transactions;

  } catch (error) {
    console.error('Error fetching account history:', error);
    throw error;
  }
};

// React equivalent of Flutter's _getSpendingData method (date grouping only)
export const getSpendingDataByDate = (spendHistory: SpendHistoryItem[]): Record<string, number> => {
  const spendingData: Record<string, number> = {};

  spendHistory.forEach(item => {
    // Parse the timestamp to DateTime  
    const dateKey = new Date(item.trxnTs);
    const key = dateKey.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: '2-digit'
    }).replace(/\//g, '/'); // Format as dd/MM/yy

    // Parse spending amount
    const amount = parseFloat(item.spendingAmount?.split(" ")[0] || "0") || 0;

    // Aggregate the amounts
    spendingData[key] = (spendingData[key] || 0) + amount;
  });

  // Sort the dates correctly
  const sortedEntries = Object.entries(spendingData).sort(([a], [b]) => {
    const [dayA, monthA, yearA] = a.split('/').map(Number);
    const [dayB, monthB, yearB] = b.split('/').map(Number);
    
    const dateA = new Date(2000 + yearA, monthA - 1, dayA);
    const dateB = new Date(2000 + yearB, monthB - 1, dayB);
    
    return dateA.getTime() - dateB.getTime();
  });

  return Object.fromEntries(sortedEntries);
};
