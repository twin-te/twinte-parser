import * as fs from 'fs'
import downloadKdb from './kdbDownloader'
import parse from './parser'
import * as colors from 'colors'
import * as commandLineArgs from 'command-line-args'

console.log('twinte-parser v2.0.0')

const ops = commandLineArgs([
  { name: 'year', alias: 'y', defaultValue: undefined },
])

const main = async () => {
  let xlsx: Buffer

  if (fs.existsSync('./kdb.xlsx')) {
    console.log('Cache file (kdb.xlsx) found.')
    xlsx = fs.readFileSync('./kdb.xlsx')
  } else {
    console.log('Downloading xlsx from kdb.\nIt may take a few minutes.')
    xlsx = await downloadKdb(ops.year)
    fs.writeFileSync('./kdb.xlsx', xlsx)
  }
  console.log('parsing...')
  const courses = parse(xlsx)
  console.log(`${courses.length} courses have been parsed.`)
  fs.writeFileSync('data.json', JSON.stringify(courses))
  console.log('Data has been saved at ./data.json')
}

main()
