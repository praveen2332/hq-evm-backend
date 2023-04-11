import * as request from 'supertest'
import { Signer } from './sign'

export async function auth(app, mnemonic) {
  const address = '0x36De3d08157b8Ed6C0eCc45553d0fE918d49e959'
  const userRes = await request(app.getHttpServer()).get(`/user/${address}`)
  const signer = new Signer()
  const nonce = userRes.body.data.nonce
  const signature = await signer.getSigner(mnemonic).signMessage(nonce)
  const res = await request(app.getHttpServer()).post('/auth').send({ address, signature })

  return res.body.data.access_token
}
