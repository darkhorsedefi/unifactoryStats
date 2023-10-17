from web3 import Web3
import json

def initialize_web3():
    w3 = Web3(Web3.HTTPProvider('https://bsc-dataseed1.binance.org/'))
    if not w3.is_connected():
        print("Not connected to Binance Smart Chain network!")
        exit()
    return w3

def load_abi(filename):
    with open(filename, "r") as abi_file:
        return json.load(abi_file)

def load_contract_addresses(filename):
    with open(filename, "r") as f:
        data = json.load(f)
        return data['contract_addresses']

def calculate_reserve_and_portion(contract, contract_address, user_address):
    try:
        balance = contract.functions.balanceOf(user_address).call()
        total_supply = contract.functions.totalSupply().call()
        portion = (balance / total_supply) * 100

        token0_address = contract.functions.token0().call()
        token1_address = contract.functions.token1().call()
        reserves = contract.functions.getReserves().call()

        usd_value = 0
        if token0_address == '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c':
            reserve = reserves[0] / (10**18)
            usd_value = reserve * 200 * (balance / total_supply)
        elif token1_address == '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c':
            reserve = reserves[1] / (10**18)
            usd_value = reserve * 200 * (balance / total_supply)

        return portion, usd_value

    except Exception as e:
        print(f"Error with contract {contract_address}: {str(e)}")
        return None, 0

def main():
    w3 = initialize_web3()
    ABI = load_abi("lptoken.abi")
    contract_addresses = load_contract_addresses("lptokens.json")
    user_address = w3.to_checksum_address('0xDf50EF7E506536354e7a805442dcBF25c7Ac249B')

    total_usd_value = 0

    for contract_address in contract_addresses:
        try:
            contract = w3.eth.contract(address=w3.to_checksum_address(contract_address), abi=ABI)
            portion, usd_value = calculate_reserve_and_portion(contract, contract_address, user_address)

            if portion is not None:
                total_usd_value += usd_value
                print(f"Contract {contract_address}:")
                print(f"Portion of total supply: {portion:.2f}%")
                print(f"USD Value: ${usd_value:,.2f}\n")

        except Exception as e:
            print(f"Error with contract {contract_address}: {str(e)}")

    print(f"Total USD Value: ${total_usd_value:,.2f}")

if __name__ == "__main__":
    main()
