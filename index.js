const Web3 = require('web3')
const networks = require('./networks.json')
const Storage = require('./abi/StorageV2.json')
const Factory = require('./abi/Factory.json')
const { saveInfo, timeout, getStringDate } = require('./utils')

const EXCLUDED_DOMAINS = /(localhost)|(onout\.xyz)|(testing)|(127.0.0.1)/
const APP_STORAGE_KEY = 'definance'
const STORAGE_NETWORK_ID = 56

async function collectDomainStats(domainData) {
  try {
    const definanceData = domainData[APP_STORAGE_KEY]

    if (!definanceData) return false

    const { contracts } = definanceData
    const chainIds = contracts && Object.keys(contracts)

    if (!chainIds?.length) return false

    let stats = {}

    for (let y = 0; y < chainIds.length; y += 1) {
      const chainId = chainIds[y]

      if (!networks[chainId]) continue

      const { name: networkName, rpc } = networks[chainId]
      const { factory } = contracts[chainId]
      const web3 = new Web3(rpc)
      const factoryContract = new web3.eth.Contract(Factory.abi, factory)

      stats = {
        ['Network']: networkName,
        ['Network ID']: chainId,
      }

      try {
        const { totalSwaps, totalFee, protocolFee, allFeeToProtocol } = await factoryContract.methods.allInfo().call()

        stats = {
          ...stats,
          ['Factory']: factory,
          ['Total swaps']: totalSwaps,
          ['Total fee']: totalFee,
          ['Protocol fee']: protocolFee,
          ['All fee to protocol']: allFeeToProtocol,
        }
      } catch (error) {
        console.error('Fail to fetch Factory information')
        console.error(error)
      }

      await timeout(100)

      try {
        const poolsLength = await factoryContract.methods.allPairsLength().call()

        if (poolsLength) {
          const pools = []

          for (let i = 0; i < poolsLength; i += 1) {
            const poolAddress = await factoryContract.methods.allPairs(i).call()

            pools.push(poolAddress)
          }

          stats = {
            ...stats,
            ['Liquidity pools']: pools,
          }
        }
      } catch (error) {
        console.error('Fail to manage pools information')
        console.error(error)
      }
    }

    return stats
  } catch (error) {
    console.error(error)
    return false
  }
}

async function collectStats() {
  const { default: chalk } = await import('chalk')
  const { storage, rpc } = networks[STORAGE_NETWORK_ID]
  const web3 = new Web3(rpc)
  const storageContract = new web3.eth.Contract(Storage.abi, storage)

  try {
    const allKeys = await storageContract.methods.allKeys().call()
    const allKeysData = await storageContract.methods.allKeysData().call()

    for (let x = 0; x < allKeysData.length; x += 1) {
      const currentDomain = allKeys[x]

      if (currentDomain.match(EXCLUDED_DOMAINS)) continue

      const { info = '{}' } = allKeysData[x]
      const data = JSON.parse(info)

      if (!data?.[APP_STORAGE_KEY]) continue

      const domainInfo = await collectDomainStats(data)

      await saveInfo('./stats.json', {
        domain: currentDomain,
        info: domainInfo || 'no information',
      })
    }
  } catch (error) {
    console.log(chalk.bgRed(`Fail on Storage methods`))
    console.error(error)
  }
}

collectStats()
