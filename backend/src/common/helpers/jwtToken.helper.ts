import * as jose from 'jose'
import { ConfigService } from '@nestjs/config'

export const jwtTokenHelper = {
  parseJWT,
  getAuthIssuerJwks,
  getAuthIssuer,
  getAuthAudience
}

async function parseJWT(token: string): Promise<{ email: string; profileImage: string; verifierId: string } | null> {
  const jwks = jose.createRemoteJWKSet(new URL(getAuthIssuerJwks()))
  const jwtDecoded = await jose.jwtVerify(token, jwks, {
    algorithms: ['RS256']
  })

  if (!jwtDecoded?.payload) {
    return null
  }
  if (!jwtDecoded.payload['https://user/email']) {
    return null
  }

  return {
    email: jwtDecoded.payload['https://user/email'] as string,
    profileImage: null,
    verifierId: jwtDecoded.payload['https://user/email'] as string
  }
}

function getAuthIssuerJwks(): string {
  return `${getAuthIssuer()}.well-known/jwks.json`
}

function getAuthIssuer(): string {
  const configService = new ConfigService()
  return `${configService.get('AUTH0_ISSUER_URL')}/`
}
function getAuthAudience(): string {
  const configService = new ConfigService()
  return configService.get('AUTH0_AUDIENCE')
}
