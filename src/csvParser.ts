import { Class, Day, Module } from './types'
import * as parseCsv from 'csv-parse/lib/sync'
import * as _cliProgress from 'cli-progress'

/**
 * '月1,2' 等の曜日と時限の文字列を解析し、分解する
 * 例: '月1,2' -> [{day: Day.Mon, period: 1}, {day: Day.Mon, period: 2}]
 * @param str 解析する文字列
 */
const analyzeDayAndPeriod = (str: string): { day: Day; period: number }[] => {
  const result: { day: Day; period: number }[] = []
  //全ての曜日に対して
  Object.entries(Day).forEach(k => {
    const day = k[1] as Day //月, 火 , .... , 日 のどれか
    // 1から6限について
    for (let i = 1; i <= 6; i++) {
      /*
       strが{曜日}(任意の文字列){時限} にマッチするか調べる
       任意の文字列を間に挟むことで検出が一度で済む
       例1: 月1,2 は、月.*1と月.*2のテストに合格する
       例2: 月・水3は、月.*3と水.*3のテストに合格する
       */
      if (new RegExp(`${day}.*` + i).test(str)) {
        result.push({
          day: day,
          period: i
        })
      }
    }
  })

  //どのテストにも合格しなかったが空文字でなければ仮にunknownとする
  if (str !== '' && result.length === 0)
    result.push({ day: Day.Unknown, period: 0 })

  return result
}

/**
 * '春ABC' 等のモジュールを示す文字列を解析し、分解する
 * 例: 春ABC -> [Module.SpringA, Module.SpringB, Module.SpringC]
 * @param str 解析する文字列
 */
const analyzeModule = (str: string): Module[] => {
  const result: Module[] = []

  // 特殊系のマッチング（通年、夏季休業中、春季休業中）
  if (str.includes(Module.Anual)) result.push(Module.Anual)
  if (str.includes(Module.SpringVacation)) result.push(Module.SpringVacation)
  if (str.includes(Module.SummerVacation)) result.push(Module.SummerVacation)

  /*
  /春[ABC]*A/は春A 春AB 春ABCに
  /春[ABC]*B/は春B 春AB 春BCに
  /春[ABC]*C/は春C 春ABC 春BC等にマッチする
   */
  if (/春[ABC]*A/gm.test(str)) result.push(Module.SpringA)
  if (/春[ABC]*B/gm.test(str)) result.push(Module.SpringB)
  if (/春[ABC]*C/gm.test(str)) result.push(Module.SpringC)

  if (/秋[ABC]*A/gm.test(str)) result.push(Module.FallA)
  if (/秋[ABC]*B/gm.test(str)) result.push(Module.FallB)
  if (/秋[ABC]*C/gm.test(str)) result.push(Module.FallC)

  //どのモジュールにも判定されなかったが空文字ではない場合、仮にunknownとする
  if (str !== '' && result.length === 0) result.push(Module.Unknown)

  return result
}

/**
 * CSVをパースする
 * @param csv KDBからダウンロードしたcsv文字列
 */
export default (csv: string): Class[] => {
  //コンソールの進捗バー
  const bar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic)

  const rows = parseCsv(csv)

  ////// コンソール表示
  console.log('●  Parsing'.green.bold)
  bar.start(rows.length, 0)
  let done = 0
  //////

  const classes = rows.map(columns => {
    const classData: Class = {
      id: columns[0],
      name: columns[1],
      details: [],
      teacher: columns[8]
    }

    const moduleString = columns[5]
    const periodString = columns[6]
    const roomString = columns[7]

    const moduleArray = moduleString.split('\n').filter(el => el !== '')
    const periodArray = periodString.split('\n').filter(el => el !== '')
    const roomArray = roomString.split('\n').filter(el => el !== '')

    const count = moduleArray.length

    for (let i = 0; i < count; i++) {
      const modules = analyzeModule(moduleArray[i])
      const when = analyzeDayAndPeriod(
        periodArray.length === 1 ? periodArray[0] : periodArray[i]
      )
      modules.forEach(mod =>
        when.forEach(w =>
          classData.details.push({
            module: mod,
            period: w.period,
            day: w.day,
            room: roomArray.length === 1 ? roomArray[0] : roomArray[i]
          })
        )
      )
    }
    done++
    bar.update(done)
    return classData
  })

  bar.stop()
  console.log('✔  Done'.green.bold)
  return classes
}
