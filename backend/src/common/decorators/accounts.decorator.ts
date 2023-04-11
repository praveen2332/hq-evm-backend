import { SetMetadata } from '@nestjs/common'

export const CHECK_ACCOUNTS_KEY = 'check_account'
export const CheckAccounts = (action: string) => SetMetadata(CHECK_ACCOUNTS_KEY, action)
