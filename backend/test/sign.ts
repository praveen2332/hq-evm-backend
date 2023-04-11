import { Wallet, providers } from 'ethers'

export class Signer {
  signer: Wallet

  getSigner(mnemonic) {
    if (!this.signer) {
      const provider = new providers.JsonRpcProvider('https://rinkeby.infura.io/v3/b46167d4ce7e4190bff6c46f2eb6363d')
      const wallet = new Wallet(mnemonic)
      wallet.connect(provider)
      this.signer = wallet
    }

    return this.signer
  }
}
