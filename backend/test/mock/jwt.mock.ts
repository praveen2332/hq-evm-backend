import { JwtPayload } from '../../src/auth/interfaces'

export const validAddress: JwtPayload = {
  verifierId: '',
  address: '0x4F8E252C7d53fa8B9AEa3BdC28A72ee6a9643c90',
  walletId: '1',
  authId: '',
  accountId: '1',
  provider: 'wallet',
  organizationId: '9ad43486-7e8a-4176-9123-d695fce3ab03',
  iat: 1670570809,
  exp: 1670743609
}

export const validEmail: JwtPayload = {
  verifierId: 'email@hq.xyz',
  address: '',
  walletId: '',
  authId: '2',
  accountId: '3',
  provider: 'email',
  organizationId: '28e8ff1e-f250-4e2f-b668-9672e1af4df8',
  iat: 1670574627,
  exp: 1670747427
}

export const jwtMock = {
  validAddress,
  validEmail
}
