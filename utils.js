const fs = require('node:fs')

function getStringDate() {
  return new Date().toISOString().split('T')[0]
}

async function timeout(ms) {
  return new Promise((res) => setTimeout(() => res(true), ms))
}

const format = {
  html: /.+\.html$/,
  json: /.+\.json$/,
}

async function saveInfo(file, content, flag = 'w') {
  return new Promise((resolve, reject) => {
    try {
      const currentRawData = fs.readFileSync(file)

      if (file.match(format.json)) {
        const currentData = JSON.parse(currentRawData)

        currentData.push(content)

        fs.writeFile(file, JSON.stringify(currentData), { flag }, (error) => {
          return error ? reject(error) : resolve(true)
        })
      }

      if (file.match(format.html)) {
        fs.writeFile(file, content, { flag }, (error) => {
          return error ? reject(error) : resolve(true)
        })
      }
    } catch (error) {
      console.warn('Attention: cannot save info')
      console.error(error)
      reject(error)
    }
  })
}

async function readInfo(file) {
  return new Promise((resolve, reject) => {
    try {
      fs.readFile(file, 'utf8', (error, jsonString) => {
        if (error) return reject(error)

        resolve(JSON.parse(jsonString))
      })
    } catch (error) {
      console.warn('Attention: cannot read info')
      console.error(error)
      reject(error)
    }
  })
}

function getHtmlTemplate(bodyContent) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>-</title>
      <style>
        body {
          max-width: 60rem;
          margin: 1rem auto;
          font-size: 1.1rem;
        }
        header {
          font-size: 2rem;
          display: flex;
          flex-direction: column;
        }
        .circle {
          display: inline-block;
          width: 1.6rem;
          height: 1.6rem;
          border-radius: 50%;
          background-color: rgba(0, 0, 0, 0.436);
        }
        .circle.green {
          background-color: rgb(12, 156, 12);
        }
        .item {
          padding: 0.4rem 0.8rem;
          margin: 3rem 0;
          border-radius: 0.5rem;
          border: 1px solid rgba(0, 0, 0, 0.436);
        }
        .item.green {
          border: 3px solid rgb(12, 156, 12);
        }
        .item__title {
          padding: 0;
          margin: 0;
        }
        .item__content {
          padding: 0.5rem;
          border-radius: 0.5rem;
          overflow: auto;
          background-color: rgba(54, 0, 81, 0.064);
        }
      </style>
    </head>
    <body>
      <header>
        <div><span class="circle"></span> - No liquidity information</div>
        <div><span class="circle green"></span> - Has liquidity pools</div>
      </header>
      ${bodyContent}
    </body>
    </html>
  `
}

function getItemTemplate({ title, body, hasLiquidityInfo }) {
  return `
    <div class="item ${hasLiquidityInfo ? 'green' : ''}">
      <h2 class="item__title">${title}</h2>
      <pre class="item__content">${body}</pre>
    </div>
  `
}

function jsonToHtml(json) {
  const htmlItems = []

  for (const itemInfo of json) {
    const { domain = '!!! No title !!!', info = {} } = itemInfo

    htmlItems.push(
      getItemTemplate({
        title: domain,
        body: JSON.stringify(info, undefined, 2),
        hasLiquidityInfo: !!info?.['Liquidity pools']?.length,
      })
    )
  }

  return getHtmlTemplate(`
    <main>
      ${htmlItems.join('\n')}
    </main>
  `)
}

module.exports = {
  getStringDate,
  timeout,
  saveInfo,
  readInfo,
  jsonToHtml,
}
