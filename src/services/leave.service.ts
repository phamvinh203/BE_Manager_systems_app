import { prisma } from "../config/db.js";
import { LeaveType, LeaveStatus } from "../types/leave.type.js";

export class LeaveService {
  // LEAVE REQUEST METHODS

  // Tạo đơn xin nghỉ mới
  static async createRequest(employeeId: number, data: any) {
    const { leaveType, startDate, endDate, reason } = data;

    // Tính số ngày nghỉ
    const totalDays = this.calculateDays(new Date(startDate), new Date(endDate));

    // Kiểm tra xem nhân viên có đủ ngày phép không
    if (leaveType === LeaveType.ANNUAL || leaveType === LeaveType.SICK) {
      const currentYear = new Date().getFullYear();
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_year_leaveType: {
            employeeId,
            year: currentYear,
            leaveType,
          },
        },
      });

      if (!balance || balance.totalDays - balance.usedDays < totalDays) {
        throw new Error("Không đủ số ngày phép còn lại");
      }
    }

    // Tạo đơn xin nghỉ
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays,
        reason,
      },
      include: {
        employee: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            position: {
              select: {
                id: true,
                name: true,
              }
            },
            department: {
              select: {
                id: true,
                name: true,
              }
            },
          },
        },
      },
    });

    return leaveRequest;
  }

  // Lấy danh sách đơn của chính mình
  static async getMyRequests(employeeId: number, query: any) {
    const { status, year, page = 1, limit = 10 } = query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { employeeId };

    if (status) {
      where.status = status;
    }

    if (year) {
      where.startDate = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return {
      data: requests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  // Lấy chi tiết một đơn
  static async getRequestById(id: number, userId: number, userRole: string) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!request) {
      throw new Error("Không tìm thấy đơn xin nghỉ");
    }

    // Kiểm tra quyền truy cập
    const employee = await prisma.employee.findFirst({
      where: { userId },
    });

    if (!employee) {
      throw new Error("Không tìm thấy thông tin nhân viên");
    }

    const isOwner = request.employeeId === employee.id;
    const isAdmin = userRole === "ADMIN" || userRole === "HR";

    if (!isOwner && !isAdmin) {
      throw new Error("Bạn không có quyền xem đơn này");
    }

    return request;
  }

  // Hủy đơn (chỉ khi PENDING)
  static async cancelRequest(id: number, employeeId: number) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new Error("Không tìm thấy đơn xin nghỉ");
    }

    if (request.employeeId !== employeeId) {
      throw new Error("Bạn không có quyền hủy đơn này");
    }

    if (request.status !== LeaveStatus.PENDING) {
      throw new Error("Chỉ có thể hủy đơn đang chờ duyệt");
    }

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.CANCELLED,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedRequest;
  }

  // Xem đơn của nhân viên cấp dưới (cho manager)
  static async getTeamRequests(managerId: number, query: any) {
    const { status, year, page = 1, limit = 10 } = query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Lấy department do manager quản lý
    const department = await prisma.department.findFirst({
      where: { managerId },
    });

    if (!department) {
      throw new Error("Bạn không quản lý phòng ban nào");
    }

    const where: any = {
      employee: {
        departmentId: department.id,
      },
    };

    if (status) {
      where.status = status;
    }

    if (year) {
      where.startDate = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          employee: {
            select: {
              id: true,
              code: true,
              firstName: true,
              lastName: true,
              position: {
                select: {
                  name: true,
                },
              },
              department: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return {
      data: requests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  // Duyệt đơn
  static async approveRequest(id: number, approverId: number) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });

    if (!request) {
      throw new Error("Không tìm thấy đơn xin nghỉ");
    }

    if (request.status !== LeaveStatus.PENDING) {
      throw new Error("Đơn này không ở trạng thái chờ duyệt");
    }

    // Cập nhật leave balance
    if (request.leaveType === LeaveType.ANNUAL || request.leaveType === LeaveType.SICK) {
      const currentYear = new Date(request.startDate).getFullYear();
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_year_leaveType: {
            employeeId: request.employeeId,
            year: currentYear,
            leaveType: request.leaveType,
          },
        },
      });

      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            usedDays: {
              increment: request.totalDays,
            },
            pendingDays: {
              decrement: request.totalDays,
            },
          },
        });
      }
    }

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.APPROVED,
        approverId,
        approvedAt: new Date(),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedRequest;
  }

  // Từ chối đơn
  static async rejectRequest(id: number, approverId: number, rejectNote?: string) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });

    if (!request) {
      throw new Error("Không tìm thấy đơn xin nghỉ");
    }

    if (request.status !== LeaveStatus.PENDING) {
      throw new Error("Đơn này không ở trạng thái chờ duyệt");
    }

    // Cập nhật leave balance (giảm pending days)
    if (request.leaveType === LeaveType.ANNUAL || request.leaveType === LeaveType.SICK) {
      const currentYear = new Date(request.startDate).getFullYear();
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_year_leaveType: {
            employeeId: request.employeeId,
            year: currentYear,
            leaveType: request.leaveType,
          },
        },
      });

      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pendingDays: {
              decrement: request.totalDays,
            },
          },
        });
      }
    }

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.REJECTED,
        approverId,
        rejectedAt: new Date(),
        rejectNote,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedRequest;
  }

  // Xem tất cả đơn (có filter) - cho HR/Admin
  static async getAllRequests(query: any) {
  const { status, employeeId, year, departmentId, page = 1, limit = 10 } = query;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (employeeId) {
    where.employeeId = Number(employeeId);
  }

  if (year) {
    where.startDate = {
      gte: new Date(`${year}-01-01`),
      lte: new Date(`${year}-12-31`),
    };
  }

  // ✅ FILTER THEO DEPARTMENT
  if (departmentId) {
    where.employee = {
      departmentId: Number(departmentId),
    };
  }

  const [requests, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.leaveRequest.count({ where }),
  ]);

  return {
    data: requests,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}


  // LEAVE BALANCE METHODS

  // Xem số ngày phép của mình
  static async getMyBalance(employeeId: number, year?: number) {
    const currentYear = year || new Date().getFullYear();

    const balances = await prisma.leaveBalance.findMany({
      where: {
        employeeId,
        year: currentYear,
      },
      orderBy: { leaveType: "asc" },
    });

    return {
      year: currentYear,
      data: balances,
    };
  }

  // Xem số ngày phép của 1 nhân viên - cho HR/Admin
  static async getEmployeeBalance(employeeId: number, year?: number) {
    const currentYear = year || new Date().getFullYear();

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        code: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!employee) {
      throw new Error("Không tìm thấy nhân viên");
    }

    const balances = await prisma.leaveBalance.findMany({
      where: {
        employeeId,
        year: currentYear,
      },
      orderBy: { leaveType: "asc" },
    });

    return {
      employee,
      year: currentYear,
      data: balances,
    };
  }

  // Cập nhật số ngày phép - cho HR/Admin
  static async updateBalance(employeeId: number, data: any) {
    const { year, leaveType, totalDays } = data;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new Error("Không tìm thấy nhân viên");
    }

    const balance = await prisma.leaveBalance.upsert({
      where: {
        employeeId_year_leaveType: {
          employeeId,
          year,
          leaveType,
        },
      },
      create: {
        employeeId,
        year,
        leaveType,
        totalDays,
        usedDays: 0,
        pendingDays: 0,
      },
      update: {
        totalDays,
      },
      include: {
        employee: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return balance;
  }

  // Khởi tạo balance đầu năm cho tất cả nhân viên - cho Admin
  static async initializeBalanceForAllEmployees(year: number) {
    // Lấy tất cả nhân viên đang active
    const employees = await prisma.employee.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });

    const leaveTypes = [LeaveType.ANNUAL, LeaveType.SICK];

    // Mặc định: 12 ngày annual, 10 ngày sick
    const defaultDays: Record<LeaveType, number> = {
      [LeaveType.ANNUAL]: 12,
      [LeaveType.SICK]: 10,
      [LeaveType.UNPAID]: 0,
      [LeaveType.WFH]: 0,
    };

    const results = [];

    for (const employee of employees) {
      for (const leaveType of leaveTypes) {
        try {
          const balance = await prisma.leaveBalance.upsert({
            where: {
              employeeId_year_leaveType: {
                employeeId: employee.id,
                year,
                leaveType,
              },
            },
            create: {
              employeeId: employee.id,
              year,
              leaveType,
              totalDays: defaultDays[leaveType],
              usedDays: 0,
              pendingDays: 0,
            },
            update: {}, // Không update nếu đã tồn tại
          });
          results.push(balance);
        } catch (error) {
          console.error(`Lỗi khi tạo balance cho employee ${employee.id}:`, error);
        }
      }
    }

    return {
      message: `Đã khởi tạo balance cho năm ${year}`,
      total: results.length,
    };
  }

  // HELPER METHODS

  // Tính số ngày nghỉ
  static calculateDays(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 để tính cả ngày bắt đầu
  }

  // Kiểm tra xem user có phải là manager không
  static async isManager(userId: number): Promise<boolean> {
    const employee = await prisma.employee.findFirst({
      where: { userId },
    });

    if (!employee) {
      return false;
    }

    const department = await prisma.department.findFirst({
      where: { managerId: employee.id },
    });

    return !!department;
  }
}
