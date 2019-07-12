import { Class, Module, Day } from './types'
import * as parseCsv from 'csv-parse/lib/sync'

const analyzePeriod = (str: string): { day: Day; period: number }[] => {
  const result: { day: Day; period: number }[] = []
  Object.entries(Day).forEach(k => {
    const day = k[0] as Day
    for (let i = 1; i <= 6; i++) {
      if (new RegExp(`${day}.*` + i).test(str)) {
        result.push({
          day: day,
          period: i
        })
      }
    }
  })
  return result
}

export default (csv: string) => {
  const rows: any[] = []
  rows.concat(parseCsv(csv))
  rows.map(row => {
    const columns = row.split(',')
    const classData: Class = {
      id: columns[0],
      name: columns[1],
      details: [],
      teacher: columns[8]
    }
    console.log(columns)
    const moduleString = columns[5]
    const periodString = columns[6]
    const roomString = columns[7]

    let moduleArray: string[] = []
    let periodArray: string[] = []
    let roomArray: string[] = []

    moduleArray = moduleString.split('\n')
    periodArray = periodString.split('\n')
    roomArray = roomString.split('\n')

    if (
      moduleArray.length !== periodArray.length ||
      periodArray.length !== roomArray.length ||
      roomArray.length !== moduleArray.length
    )
      throw Error('配列の長さが一致しません')

    const count = moduleArray.length

    for (let i = 0; i < count; i++) {
      console.log(analyzePeriod(periodArray[i]))
    }
  })
}
