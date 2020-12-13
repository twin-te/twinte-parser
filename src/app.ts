import * as fs from 'fs'
import kdbGetter from './kdbDownloader'
import parse from './parser'
import * as colors from 'colors'
import * as commandLineArgs from 'command-line-args'

console.log('twinte-parser v1.3.2')

const ops = commandLineArgs([
  { name: 'year', alias: 'y', defaultValue: undefined },
])

const main = async () => {
  let xlsx: Buffer

  if (fs.existsSync('./kdb.xlsx')) {
    console.log('i Cache file (kdb.xlsx) found.')
    xlsx = fs.readFileSync('./kdb.xlsx')
  } else {
    xlsx = await kdbGetter(ops.year)
    fs.writeFileSync('./kdb.xlsx', xlsx)
  }
  const classes = parse(xlsx)
  fs.writeFileSync('data.json', JSON.stringify(classes))
  console.log(
    'Parsed data has been saved at ${working directory}/data.json'
  )
}

main()
