import { Organization } from '../../src/common/services/organizations/organization.entity'
import { OrganizationType } from '../../src/organizations/interfaces'

const organizationMock: Organization = {
  publicId: 'some_public_id',
  id: '1',
  deletedAt: null,
  updatedAt: null,
  invitations: [],
  createdAt: new Date(),
  categories: [],
  name: 'My organization',
  type: OrganizationType.COMPANY,
  members: [],
  recipients: [],
  sources: []
}

export const organizationMocks = {
  organizationMock
}
