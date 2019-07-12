import { Class } from './types/index'
import kdbGetter from './kdbGetter'
import csvParser from './csvParser'

const main = async () => {
  const csv = await kdbGetter()
  console.log('downloaded')
  csvParser(csv)
}

main()
