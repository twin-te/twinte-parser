import * as fs from 'fs'
import kdbGetter from './kdbDownloader'
import parse from './parser'
import * as colors from 'colors'
import * as commandLineArgs from 'command-line-args'

console.log('twinte-parser v1.3.2'.green.bold)

const ops = commandLineArgs([
  { name: 'year', alias: 'y', defaultValue: undefined }
])

const main = async () => {
  let csv: string

  if (fs.existsSync('./kdb.csv')) {
    console.log('i Cache file (kdb.csv) found.'.cyan)
    csv = fs.readFileSync('./kdb.csv', 'utf-8')
  } else {
    csv = await kdbGetter(ops.year)
    fs.writeFileSync('./kdb.csv', csv)
  }
  const classes = parse(csv)
  fs.writeFileSync('data.json', JSON.stringify(classes))
  console.log(
    'Parsed data has been saved at ${working directory}/data.json'.green
  )
}

main()
