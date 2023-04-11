import { Invitation } from '../../src/common/services/invitations/invitation.entity'
import { InvitationStatus } from '../../src/invitations/interface'
import { INVITATION_EXPIRED } from '../../src/common/constants'
import { organizationMocks } from './organization.mock'
import { rolesMock } from './roles.mock'
import { jwtMock } from './jwt.mock'

const expiredAt = new Date()
expiredAt.setHours(expiredAt.getHours() + INVITATION_EXPIRED)

const inviteByEmailMock: Invitation = {
  firstName: 'Invited',
  lastName: 'User',
  status: InvitationStatus.INVITED,
  role: rolesMock.employeeMock,
  message: '',
  email: jwtMock.validEmail.verifierId,
  address: null,
  organization: organizationMocks.organizationMock,
  createdAt: new Date(),
  updatedAt: new Date(),
  expiredAt: expiredAt,
  deletedAt: null,
  publicId: 'some_public_id',
  id: '1',
  invitedBy: null
}

const inviteByWalletMock: Invitation = {
  firstName: 'Invited',
  lastName: 'User',
  status: InvitationStatus.INVITED,
  role: rolesMock.employeeMock,
  message: '',
  email: null,
  address: jwtMock.validAddress.address,
  organization: organizationMocks.organizationMock,
  createdAt: new Date(),
  updatedAt: new Date(),
  expiredAt: expiredAt,
  deletedAt: null,
  publicId: 'some_public_id',
  id: '1',
  invitedBy: null
}

export const invitationMocks = {
  inviteByEmailMock,
  inviteByWalletMock
}
