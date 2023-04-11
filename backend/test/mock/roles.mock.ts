import { ERole } from '../../src/roles/interfaces'
import { Role } from '../../src/common/services/roles/role.entity'

const adminMock: Role = {
  name: ERole.Admin,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  invitations: [],
  members: [],
  permissions: [],
  id: '1'
}

const employeeMock: Role = {
  name: ERole.Employee,
  ...adminMock
}

export const rolesMock = {
  adminMock,
  employeeMock
}
