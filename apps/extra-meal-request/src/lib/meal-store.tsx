import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type RequestStatus = 'Submitted' | 'Approved' | 'Rejected' | 'Cancelled';
export type MealRequest = {
  sharePointId?: number; id: string; recordId: string; serviceDate: string; requester: string; requesterEmail: string; department: string; purpose: string;
  startDate: string; endDate: string; durationHours?: number; mealCategory: string; quantity: number;
  additional: string; status: RequestStatus; createdAt: string; reminderAt?: string; approvalTrigger: boolean;
};
export type Settings = { approverName: string; approverEmail: string; reminderHours: number; departments: string[]; meals: string[]; admins: string[]; vehicleAdmins: string[] };

type Store = { settings: Settings; setSettings: (settings: Settings) => void };
const initialSettings: Settings = { approverName: 'Rendra Wijaya', approverEmail: 'rendra.wijaya@example.com', reminderHours: 24, departments: ['Commercial','Finance & Accounting','HR','IT&S','Lab','Maintenance','Operation','PD (Logistic)','Procurement','SHE'], meals: ['Lunch','Dinner','Other'], admins: ['admin.meal@example.com'], vehicleAdmins: ['riyan.sugara@ineos.com', 'aris.kristanto@ineos.com', 'defiani.defiani@ineos.com'] };
const MealStoreContext = createContext<Store | null>(null);

export function MealStoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const value = useMemo<Store>(() => ({ settings, setSettings }), [settings]);
  return <MealStoreContext.Provider value={value}>{children}</MealStoreContext.Provider>;
}
export function useMealStore() { const store = useContext(MealStoreContext); if (!store) throw new Error('MealStoreProvider is required'); return store; }
export function inclusiveDates(start: string, end: string) { if (!start || !end) return []; const dates: Date[] = []; const cursor = new Date(`${start}T00:00:00`); const finish = new Date(`${end}T00:00:00`); while (cursor <= finish) { dates.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1); } return dates; }
