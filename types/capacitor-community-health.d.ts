// Type stubs for @capacitor-community/health
// Install the real package for iOS builds: npm install @capacitor-community/health
declare module '@capacitor-community/health' {
  export interface HealthQueryResult {
    value: number
    startDate: string
    endDate: string
    unit?: string
  }

  export interface Health {
    requestAuthorization(options: { read: string[]; write?: string[] }): Promise<void>
    query(options: {
      startDate: string
      endDate: string
      dataType: string
      limit?: number
    }): Promise<HealthQueryResult[]>
  }

  export const Health: Health
}
