const Web3 = require('web3')
const BigNumber = require('bignumber.js')
const axios = require('axios').default
const Pair = require('./abi/Pair.json')
const networks = require('./networks.json')
const { readInfo, saveInfo, timeout, getStringDate } = require('./utils')

// prevent numbers from scientific notation
BigNumber.config({ EXPONENTIAL_AT: 1e9 })

async function getPlatforms() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/asset_platforms')
    const activeIds = Object.values(networks).map(({ chainId }) => chainId)

    return !response ? false : response.data.filter((item) => activeIds.includes(item.chain_identifier))
  } catch (error) {
    console.warn('Fail on fetching platforms')
    console.error(error)
    return false
  }
}

async function getTokenPrice(platformId, tokenAddress) {
  try {
    const response = await axios.get(
      [
        `https://api.coingecko.com/api/v3/simple/token_price/${platformId}`,
        `?contract_addresses=${tokenAddress}`,
        '&vs_currencies=usd',
      ].join('')
    )

    return response?.data?.[tokenAddress.toLowerCase()]?.usd || false
  } catch (error) {
    console.warn('Fail on fetching token price')
    console.error(error)
    return false
  }
}

async function collect() {
  try {
    const platforms = await getPlatforms()
    const stats = await readInfo('./stats.json')

    if (!stats?.length) return

    for (let itemIndex = 0; itemIndex < stats.length; itemIndex += 1) {
      const { info } = stats[itemIndex]
      const pools = info['Liquidity pools']

      if (!pools.length) continue

      const networkId = info['Network ID']
      const { rpc } = networks[networkId]
      const currentPlatform = platforms.find((item) => item.chain_identifier === Number(networkId))
      const web3 = new Web3(rpc)
      const data = []

      for (let i = 0; i < pools.length; i += 1) {
        const poolAddress = pools[i]
        const pairContract = new web3.eth.Contract(Pair.abi, poolAddress)
        let token0 = ''
        let reserve0
        let token1 = ''
        let reserve1

        try {
          token0 = await pairContract.methods.token0().call()
          await timeout(20)
          token1 = await pairContract.methods.token1().call()
          await timeout(20)
          const allReserves = await pairContract.methods.getReserves().call()

          // TODO: fetch it from the token contract
          const TOKEN_DECIMALS = 18
          const DECIMALS_DEVIDER = 10 ** TOKEN_DECIMALS

          reserve0 = new BigNumber(allReserves[0]).div(DECIMALS_DEVIDER)
          reserve1 = new BigNumber(allReserves[1]).div(DECIMALS_DEVIDER)
        } catch (error) {
          console.warn('Fail on token addresses fetching from the Pair contract')
          console.error(error)
        }

        let token0Price
        let token1Price

        try {
          await timeout(20)
          token0Price = await getTokenPrice(currentPlatform.id, token0)
          await timeout(20)
          token1Price = await getTokenPrice(currentPlatform.id, token1)
        } catch (error) {
          console.warn('Fail on token information fetching')
          console.error(error)
        }

        const getTotal = (usdLiquidity) =>
          !usdLiquidity ? '?' : usdLiquidity.isLessThan(0.0001) ? 'Too little' : usdLiquidity.toString()

        const usdLiquidity0 = reserve0 && token0Price ? reserve0.times(token0Price) : false
        const usdLiquidity1 = reserve1 && token1Price ? reserve1.times(token1Price) : false

        data.push({
          [poolAddress]: {
            'Token 1': `address: ${token0 || '?'}`,
            'Liquidity 1': `Token amount: ${reserve0 || '?'}; USD price: ${token0Price || '?'}; USD total: ${getTotal(
              usdLiquidity0
            )}`,
            'Token 2': `address: ${token1 || '?'}`,
            'Liquidity 2': `Token amount: ${reserve1 || '?'}; USD price: ${token1Price || '?'}; USD total: ${getTotal(
              usdLiquidity1
            )}`,
          },
        })
      }

      stats[itemIndex].info['Liquidity pools'] = data
    }

    await saveInfo(`./pools.json`, stats)
    // await saveInfo(`./pools_${getStringDate()}.json`, stats)
  } catch (error) {
    console.warn('Fail on pools info collection')
    console.error(error)
  }
}

collect()
