import { ERole } from '../../roles/interfaces'
import { Role } from '../services/roles/role.entity'
import {BaseEntity} from '../../core/entities/base.entity';

export const accessControlHelper = {
  canUserSetRole
}

function canUserSetRole(param: { currentUserRole: Role; changeToRole: ERole }) {
  switch (param.currentUserRole.name) {
    case ERole.Admin: {
      if (param.changeToRole !== ERole.Employee) {
        return false
      }
    }
  }
  return true
}
