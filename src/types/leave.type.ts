export enum LeaveType {
  ANNUAL = "ANNUAL",
  SICK = "SICK",
  UNPAID = "UNPAID",
  WFH = "WFH",
}

export enum LeaveStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export interface CreateLeaveRequestInput {
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export interface UpdateLeaveBalanceInput {
  year: number;
  leaveType: LeaveType;
  totalDays: number;
}

export interface LeaveRequestQuery {
  status?: LeaveStatus;
  employeeId?: number;
  year?: number;
  page?: number;
  limit?: number;
}

export interface LeaveBalanceQuery {
  year?: number;
}
