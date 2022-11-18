const { readInfo, saveInfo, jsonToHtml } = require('./utils')

async function doIt() {
  try {
    const json = await readInfo('pools.json')
    const result = jsonToHtml(json)

    saveInfo('index.html', result)
  } catch (error) {
    console.error(error)
  }
}

doIt()
