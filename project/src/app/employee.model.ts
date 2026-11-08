export interface Employee {
  Id: string;
  EmployeeName: string;
  StarTimeUtc: string;
  EndTimeUtc: string;
  EntryNotes: string;
  DeletedOn: Date | null;
}

export interface EmployeeSummary {
  employeeName: string;
  totalMinutes: number;
  entries: Employee[];
}
