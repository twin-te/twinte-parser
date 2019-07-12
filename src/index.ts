import * as fs from 'fs'
import kdbGetter from './kdbGetter'
import parse from './csvParser'
import * as colors from 'colors'

console.log('twins-parser v0.0.1'.green.bold)

const main = async () => {
  const csv = await kdbGetter()
  const classes = parse(csv)
  fs.writeFileSync('data.json', JSON.stringify(classes))
  console.log(
    'Parsed data has been saved at ${working directory}/data.json'.green
  )
}

main()
