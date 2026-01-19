import { success } from "zod";
import { prisma } from "../config/db.js";
import { TaskStatus, TaskPriority, TaskType } from "../types/task.types.js";

export class TaskService {
  // ============== TASK CRUD METHODS ==============

  // Tạo task mới
  static async createTask(employeeId: number, data: any) {
    const { title, description, departmentId, priority, type, startDate, dueDate } = data;

    // Kiểm tra phòng ban tồn tại
    const department = await prisma.department.findUnique({
      where: { id: departmentId, deletedAt: null },
    });

    if (!department) {
      throw new Error("Không tìm thấy phòng ban");
    }

    // Tạo task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        departmentId,
        createdById: employeeId,
        priority: priority || TaskPriority.MEDIUM,
        type: type || TaskType.GENERAL,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: TaskStatus.TODO,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return task;
  }

  // Lấy danh sách task
  static async getTasks(query: any) {
    const { departmentId, status, priority, type, page = 1, limit = 10 } = query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { deletedAt: null };

    if (departmentId) {
      where.departmentId = Number(departmentId);
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (type) {
      where.type = type;
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
          { createdAt: "desc" },
        ],
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              assignments: true,
            },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  // Lấy chi tiết task theo ID
  static async getTaskById(taskId: number, userId: number, userRole: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            managerId: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new Error("Không tìm thấy task");
    }

    return task;
  }

  // Cập nhật task
  static async updateTask(taskId: number, employeeId: number, data: any) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: {
        department: {
          select: { managerId: true },
        },
      },
    });

    if (!task) {
      throw new Error("Không tìm thấy task");
    }

    // Kiểm tra quyền: chỉ người tạo hoặc manager mới được sửa
    const canEdit = task.createdById === employeeId || task.department.managerId === employeeId;
    if (!canEdit) {
      throw new Error("Bạn không có quyền cập nhật task này");
    }

    const { title, description, priority, type, startDate, dueDate } = data;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority }),
        ...(type !== undefined && { type }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedTask;
  }

  // Xóa task (soft delete)
  static async deleteTask(taskId: number, employeeId: number) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: {
        department: {
          select: { managerId: true },
        },
      },
    });

    if (!task) {
      throw new Error("Không tìm thấy task");
    }

    // Kiểm tra quyền
    const canDelete = task.createdById === employeeId || task.department.managerId === employeeId;
    if (!canDelete) {
      throw new Error("Bạn không có quyền xóa task này");
    }

    const deletedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.CANCELLED,
        deletedAt: new Date(),
      },
    });

    return deletedTask;
  }

  // ============== ASSIGNMENT METHODS ==============

  // Gán task cho nhân viên
  static async assignTask(taskId: number, employeeId: number, employeeIds: number[]) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: {
        department: {
          select: { managerId: true },
        },
      },
    });

    if (!task) {
      throw new Error("Không tìm thấy task");
    }

    // Kiểm tra quyền
    const canAssign = task.createdById === employeeId || task.department.managerId === employeeId;
    if (!canAssign) {
      throw new Error("Bạn không có quyền gán task này");
    }

    // Kiểm tra nhân viên thuộc cùng phòng ban
    const employees = await prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
        departmentId: task.departmentId,
        deletedAt: null,
      },
    });

    if (employees.length !== employeeIds.length) {
      const foundIds = employees.map((e) => e.id);
      const invalidIds = employeeIds.filter((id) => !foundIds.includes(id));
      throw new Error(`Một số nhân viên không tồn tại hoặc không thuộc phòng ban: ${invalidIds.join(", ")}`);
    }

    // Lấy danh sách đã được gán
    const existingAssignments = await prisma.taskAssignment.findMany({
      where: { taskId },
      select: { employeeId: true },
    });

    const existingEmployeeIds = new Set(existingAssignments.map((a) => a.employeeId));
    const newEmployeeIds = employeeIds.filter((id) => !existingEmployeeIds.has(id));

    if (newEmployeeIds.length === 0) {
      return {
        taskId,
        assignedCount: 0,
        message: "Tất cả nhân viên đã được gán trước đó",
      };
    }

    // Tạo assignments
    await prisma.taskAssignment.createMany({
      data: newEmployeeIds.map((empId) => ({
        taskId,
        employeeId: empId,
        status: TaskStatus.TODO,
        progress: 0,
      })),
    });

    // Cập nhật trạng thái task nếu đang TODO
    if (task.status === TaskStatus.TODO) {
      await prisma.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.IN_PROGRESS },
      });
    }

    return {
      taskId,
      assignedCount: newEmployeeIds.length,
    };
  }

  // Bỏ gán task
  static async unassignTask(taskId: number, employeeId: number, targetEmployeeId: number) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: {
        department: {
          select: { managerId: true },
        },
      },
    });

    if (!task) {
      throw new Error("Không tìm thấy task");
    }

    // Kiểm tra quyền
    const canUnassign = task.createdById === employeeId || task.department.managerId === employeeId;
    if (!canUnassign) {
      throw new Error("Bạn không có quyền bỏ gán task này");
    }

    const assignment = await prisma.taskAssignment.findUnique({
      where: {
        taskId_employeeId: { taskId, employeeId: targetEmployeeId },
      },
    });

    if (!assignment) {
      throw new Error("Nhân viên này chưa được gán task");
    }

    await prisma.taskAssignment.delete({
      where: {
        taskId_employeeId: { taskId, employeeId: targetEmployeeId },
      },
    });

    return { message: "Đã bỏ gán nhân viên khỏi task" };
  }

  // Lấy danh sách nhân viên được gán task
  static async getTaskAssignees(taskId: number) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
    });

    if (!task) {
      throw new Error("Không tìm thấy task");
    }

    const assignments = await prisma.taskAssignment.findMany({
      where: { taskId },
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
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: assignments.map((a) => ({
        employeeId: a.employee.id,
        code: a.employee.code,
        fullName: `${a.employee.firstName} ${a.employee.lastName}`.trim(),
        position: a.employee.position,
        status: a.status,
        progress: a.progress,
        assignedAt: a.assignedAt,
        completedAt: a.completedAt,
      })),
    };
  }

  // lấy task của phòng ban
  static async getTasksByDepartment(departmentId: number, query: any) {
    const { status, page = 1, limit = 10 } = query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;  
    const where: any = {
      departmentId,
      deletedAt: null,
    };
    if (status) {
      where.status = status;
    }
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [
          { priority: "desc" },
          { dueDate: "asc" },
          { createdAt: "desc" },
        ],
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);
    return {
      success: 'lấy danh sách task thành công',
      data: tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  // ============== MY TASKS METHODS ==============

  // Lấy danh sách task của tôi
  static async getMyTasks(employeeId: number, query: any) {
    const { status, page = 1, limit = 10 } = query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      employeeId,
      task: { deletedAt: null },
    };

    if (status) {
      where.status = status;
    }

    const [assignments, total] = await Promise.all([
      prisma.taskAssignment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [
          { status: "asc" },
          { task: { dueDate: "asc" } },
        ],
        include: {
          task: {
            select: {
              id: true,
              title: true,
              description: true,
              priority: true,
              type: true,
              dueDate: true,
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.taskAssignment.count({ where }),
    ]);

    return {
      data: assignments.map((a) => ({
        assignmentId: a.id,
        taskId: a.task.id,
        title: a.task.title,
        description: a.task.description,
        priority: a.task.priority,
        type: a.task.type,
        dueDate: a.task.dueDate,
        department: a.task.department,
        status: a.status,
        progress: a.progress,
        assignedAt: a.assignedAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  // Lấy chi tiết assignment của tôi
  static async getMyTaskDetail(assignmentId: number, employeeId: number) {
    const assignment = await prisma.taskAssignment.findFirst({
      where: {
        id: assignmentId,
        employeeId,
        task: { deletedAt: null },
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            description: true,
            priority: true,
            type: true,
            startDate: true,
            dueDate: true,
            status: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new Error("Không tìm thấy assignment hoặc bạn không có quyền truy cập");
    }

    return {
      assignmentId: assignment.id,
      task: assignment.task,
      status: assignment.status,
      progress: assignment.progress,
      assignedAt: assignment.assignedAt,
      completedAt: assignment.completedAt,
    };
  }

  // Cập nhật assignment
  static async updateAssignment(assignmentId: number, employeeId: number, data: any) {
    const assignment = await prisma.taskAssignment.findFirst({
      where: {
        id: assignmentId,
        employeeId,
      },
    });

    if (!assignment) {
      throw new Error("Không tìm thấy assignment hoặc bạn không có quyền truy cập");
    }

    const { status, progress } = data;

    // Validate status transitions
    if (status) {
      const validTransitions: Record<string, string[]> = {
        [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
        [TaskStatus.IN_PROGRESS]: [TaskStatus.REVIEW, TaskStatus.DONE, TaskStatus.CANCELLED],
        [TaskStatus.REVIEW]: [TaskStatus.IN_PROGRESS, TaskStatus.DONE],
        [TaskStatus.DONE]: [],
        [TaskStatus.CANCELLED]: [],
      };

      if (!validTransitions[assignment.status].includes(status)) {
        throw new Error(`Không thể chuyển trạng thái từ ${assignment.status} sang ${status}`);
      }
    }

    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
      if (status === TaskStatus.DONE) {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      }
    }

    if (progress !== undefined) {
      updateData.progress = progress;
    }

    const updatedAssignment = await prisma.taskAssignment.update({
      where: { id: assignmentId },
      data: updateData,
    });

    // Đồng bộ trạng thái task
    await this.syncTaskStatus(assignment.taskId);

    return updatedAssignment;
  }

  // Hoàn thành assignment
  static async completeAssignment(assignmentId: number, employeeId: number) {
    const assignment = await prisma.taskAssignment.findFirst({
      where: {
        id: assignmentId,
        employeeId,
      },
    });

    if (!assignment) {
      throw new Error("Không tìm thấy assignment hoặc bạn không có quyền truy cập");
    }

    if (assignment.status === TaskStatus.DONE) {
      throw new Error("Assignment đã hoàn thành trước đó");
    }

    if (assignment.status === TaskStatus.CANCELLED) {
      throw new Error("Không thể hoàn thành assignment đã hủy");
    }

    const updatedAssignment = await prisma.taskAssignment.update({
      where: { id: assignmentId },
      data: {
        status: TaskStatus.DONE,
        progress: 100,
        completedAt: new Date(),
      },
    });

    // Đồng bộ trạng thái task
    await this.syncTaskStatus(assignment.taskId);

    return updatedAssignment;
  }

  // ============== REVIEW & APPROVAL METHODS ==============

  // Chuyển task sang review
  static async setTaskReview(taskId: number, employeeId: number) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: {
        department: {
          select: { managerId: true },
        },
      },
    });

    if (!task) {
      throw new Error("Không tìm thấy task");
    }

    // Kiểm tra quyền
    const canReview = task.createdById === employeeId || task.department.managerId === employeeId;
    if (!canReview) {
      throw new Error("Bạn không có quyền review task này");
    }

    if (task.status !== TaskStatus.IN_PROGRESS && task.status !== TaskStatus.TODO) {
      throw new Error(`Không thể chuyển task sang REVIEW từ trạng thái ${task.status}`);
    }

    const [updatedTask] = await prisma.$transaction([
      prisma.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.REVIEW },
      }),
      prisma.taskStatusLog.create({
        data: {
          taskId,
          changedById: employeeId,
          oldStatus: task.status,
          newStatus: TaskStatus.REVIEW,
        },
      }),
    ]);

    return updatedTask;
  }

  // Phê duyệt task
  static async approveTask(taskId: number, employeeId: number) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: {
        department: {
          select: { managerId: true },
        },
      },
    });

    if (!task) {
      throw new Error("Không tìm thấy task");
    }

    // Kiểm tra quyền
    const canApprove = task.createdById === employeeId || task.department.managerId === employeeId;
    if (!canApprove) {
      throw new Error("Bạn không có quyền phê duyệt task này");
    }

    if (task.status !== TaskStatus.REVIEW) {
      throw new Error(`Không thể phê duyệt task không ở trạng thái REVIEW. Trạng thái hiện tại: ${task.status}`);
    }

    const [updatedTask] = await prisma.$transaction([
      prisma.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.DONE },
      }),
      prisma.taskStatusLog.create({
        data: {
          taskId,
          changedById: employeeId,
          oldStatus: task.status,
          newStatus: TaskStatus.DONE,
        },
      }),
      // Đánh dấu tất cả assignments là DONE
      prisma.taskAssignment.updateMany({
        where: { taskId },
        data: {
          status: TaskStatus.DONE,
          progress: 100,
          completedAt: new Date(),
        },
      }),
    ]);

    return updatedTask;
  }

  // ============== DASHBOARD & STATS METHODS ==============

  // Lấy thống kê task của phòng ban
  static async getDepartmentDashboard(departmentId: number) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId, deletedAt: null },
    });

    if (!department) {
      throw new Error("Không tìm thấy phòng ban");
    }

    const stats = await prisma.task.groupBy({
      by: ["status"],
      where: {
        departmentId,
        deletedAt: null,
      },
      _count: true,
    });

    const result = {
      total: 0,
      todo: 0,
      inProgress: 0,
      review: 0,
      done: 0,
      cancelled: 0,
    };

    stats.forEach((s) => {
      const count = s._count;
      result.total += count;

      switch (s.status) {
        case TaskStatus.TODO:
          result.todo = count;
          break;
        case TaskStatus.IN_PROGRESS:
          result.inProgress = count;
          break;
        case TaskStatus.REVIEW:
          result.review = count;
          break;
        case TaskStatus.DONE:
          result.done = count;
          break;
        case TaskStatus.CANCELLED:
          result.cancelled = count;
          break;
      }
    });

    return result;
  }

  // Lấy tiến độ task
  static async getTaskProgress(taskId: number) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
    });

    if (!task) {
      throw new Error("Không tìm thấy task");
    }

    const assignments = await prisma.taskAssignment.findMany({
      where: { taskId },
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

    return {
      data: assignments.map((a) => ({
        employeeId: a.employee.id,
        fullName: `${a.employee.firstName} ${a.employee.lastName}`.trim(),
        progress: a.progress,
        status: a.status,
      })),
    };
  }

  // Lấy lịch sử thay đổi task
  static async getTaskLogs(taskId: number) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
    });

    if (!task) {
      throw new Error("Không tìm thấy task");
    }

    const logs = await prisma.taskStatusLog.findMany({
      where: { taskId },
      include: {
        changedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { changedAt: "desc" },
    });

    return {
      data: logs.map((log) => ({
        id: log.id,
        changedBy: `${log.changedBy.firstName} ${log.changedBy.lastName}`.trim(),
        oldStatus: log.oldStatus,
        newStatus: log.newStatus,
        changedAt: log.changedAt,
      })),
    };
  }

  // ============== HELPER METHODS ==============

  // Đồng bộ trạng thái task dựa trên assignments
  private static async syncTaskStatus(taskId: number): Promise<void> {
    const assignments = await prisma.taskAssignment.findMany({
      where: { taskId },
    });

    if (assignments.length === 0) {
      return;
    }

    const allDone = assignments.every((a) => a.status === TaskStatus.DONE);
    const anyInProgress = assignments.some(
      (a) => a.status === TaskStatus.IN_PROGRESS || a.status === TaskStatus.REVIEW
    );

    let newStatus: TaskStatus | null = null;

    if (allDone) {
      newStatus = TaskStatus.REVIEW;
    } else if (anyInProgress) {
      newStatus = TaskStatus.IN_PROGRESS;
    }

    if (newStatus) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (task && task.status !== newStatus && task.status !== TaskStatus.DONE) {
        await prisma.task.update({
          where: { id: taskId },
          data: { status: newStatus },
        });
      }
    }
  }

  // Kiểm tra quyền quản lý task
  static async canManageTask(taskId: number, employeeId: number): Promise<boolean> {
    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: {
        department: {
          select: { managerId: true },
        },
      },
    });

    if (!task) {
      return false;
    }

    return task.createdById === employeeId || task.department.managerId === employeeId;
  }
}