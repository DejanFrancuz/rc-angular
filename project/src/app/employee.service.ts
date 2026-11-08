import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Observable } from "rxjs/internal/Observable";
import { Employee } from "./employee.model";

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {

  constructor(private router: Router, private httpClient: HttpClient) { }

  private readonly baseUrl = 'https://rc-vault-fap-live-1.azurewebsites.net/api';

  private readonly angularKey = 'vO17RnE8vuzXzPJo5eaLLjXjmRW07law99QTD90zat9FfOQJKKUcgQ==';

  public getEmployees(): Observable<Employee[]> {
    console.log('Fetching employees from API...');
    return this.httpClient.get<Employee[]>(`${this.baseUrl}/gettimeentries?code=${this.angularKey}`);
  }
}
