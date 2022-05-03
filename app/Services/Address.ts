import { bnbGetAccount, bscGetAccountBalance, bscGetAccountBep20Address, ethGetAccountBalance, ethGetAccountErc20Address } from "@tatumio/tatum";

export async function getAddressBalance(token, address, contractAddress = "") {
    
    switch(token) {
        case 'erc20': 
            let erc20Bal = await ethGetAccountErc20Address(address, contractAddress)
            return erc20Bal?.balance;

        case 'eth': 
            let ethBal = await ethGetAccountBalance(address)
            return ethBal;

        case 'bnb':
            let bnbBal = await bnbGetAccount(address)
            return bnbBal;

        case 'bsc':
            let bscBal = await bscGetAccountBalance(address)
            return bscBal;

        case 'bep20':
            let bep20Bal = await bscGetAccountBep20Address(address, contractAddress)
            return bep20Bal;
    }
}

export async function getWalletAddress() {}
