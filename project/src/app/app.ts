import { Component } from '@angular/core';
import { EmployeeService } from './employee.service';
import {
  filter,
  from,
  groupBy,
  map,
  mergeMap,
  Observable,
  reduce,
  shareReplay,
  toArray
} from 'rxjs';
import { CommonModule } from '@angular/common';
import { Employee, EmployeeSummary } from './employee.model';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import ChartDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-root',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  employeesList$!: Observable<EmployeeSummary[]>;
  chartData$!: Observable<ChartData<'pie', number[], string>>;
  readonly pieChartPlugins = [ChartDataLabels];

  readonly pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right'
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed.toFixed(2)} h`
        }
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold'
        },
        formatter: (value, context) => {
          const dataset = context.chart.data.datasets[context.datasetIndex];
          const total = (dataset.data as number[]).reduce((sum, hours) => sum + hours, 0);

          return total > 0 ? `${((Number(value) / total) * 100).toFixed(1)}%` : '';
        }
      }
    }
  };

  constructor(private employeeService: EmployeeService) {
    this.init();
  }

  init() {
    this.employeesList$ = this.employeeService.getEmployees().pipe(
      mergeMap((employees) => from(employees)),
      filter(
        (employee): employee is Employee =>
          employee != null &&
          typeof employee.EmployeeName === 'string' &&
          employee.EmployeeName.trim().length > 0
      ),
      groupBy((employee) => employee.EmployeeName),
      mergeMap((employeeEntries) =>
        employeeEntries.pipe(
          reduce(
            (summary, employee) => {
              summary.entries.push(employee);
              summary.totalMinutes +=
                this.getTotalMinutesWorked(employee.StarTimeUtc, employee.EndTimeUtc) ?? 0;
              return summary;
            },
            {
              employeeName: employeeEntries.key,
              totalMinutes: 0,
              entries: [] as Employee[]
            }
          )
        )
      ),
      toArray(),
      map((summaries) =>
        summaries.sort((first, second) => second.totalMinutes - first.totalMinutes)
      ),
      shareReplay(1)
    );
    this.chartData$ = this.employeesList$.pipe(
      map((employees) => this.createChartData(employees))
    );
  }

  getTotalTimeWorked(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    // const minutes = totalMinutes % 60;

    return `${hours}hrs`;
  }

  hasWorkedLessThan100Hours(totalMinutes: number): boolean {
    return totalMinutes < 100 * 60;
  }

  private getTotalMinutesWorked(startTimeUtc: string, endTimeUtc: string): number | null {
    const start = Date.parse(startTimeUtc);
    const end = Date.parse(endTimeUtc);

    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      return null;
    }

    return Math.floor((end - start) / 60_000);
  }

  private createChartData(summaries: EmployeeSummary[]): ChartData<'pie', number[], string> {
    const sortedSummaries = [...summaries].sort(
      (first, second) => second.totalMinutes - first.totalMinutes
    );

    return {
      labels: sortedSummaries.map(({ employeeName }) => employeeName),
      datasets: [
        {
          label: 'Hours of work',
          data: sortedSummaries.map(({ totalMinutes }) => totalMinutes / 60),
          backgroundColor: sortedSummaries.map(
            (_, index) =>
              `hsl(${Math.round((index * 360) / sortedSummaries.length)}, 68%, 58%)`
          )
        }
      ]
    };
  }

  editEmployee(employee: EmployeeSummary): void {
    console.log('Edit employee:', employee);
  }
}
