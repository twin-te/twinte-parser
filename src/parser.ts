import { Lecture, Day, Module } from './types'
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
      if (new RegExp(`${day}.*${i}`).test(str)) {
        result.push({
          day: day,
          period: i
        })
      }
    }
    // 月1-4 のようなハイフン表記のテスト
    const longTermTest = new RegExp(`([${day}]).*(\\d)-(\\d)`).exec(str)
    if (longTermTest) {
      for (let i = Number(longTermTest[2]); i <= Number(longTermTest[3]); i++) {
        if (!result.find(el => el.day === day && el.period === i))
          result.push({
            day: day,
            period: i
          })
      }
    }
  })

  if (/集中/gm.test(str))
    result.push({
      day: Day.Intensive,
      period: 0
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
  
  /*
  /春[ABC]*A/は春A 春AB 春ABCに
  /春[ABC]*B/は春B 春AB 春BCに
  /春[ABC]*C/は春C 春ABC 春BC等にマッチする
   */
  if (/春[ABC]*A/gm.test(str)) result.push(Module.SpringA)
  if (/春[ABC]*B/gm.test(str)) result.push(Module.SpringB)
  if (/春[ABC]*C/gm.test(str)) result.push(Module.SpringC)
  
  // 春季休業中のマッチング
  if (str.includes(Module.SpringVacation)) result.push(Module.SpringVacation)

  if (/秋[ABC]*A/gm.test(str)) result.push(Module.FallA)
  if (/秋[ABC]*B/gm.test(str)) result.push(Module.FallB)
  if (/秋[ABC]*C/gm.test(str)) result.push(Module.FallC)

  // 秋季休業中、通年のマッチング
  if (str.includes(Module.SummerVacation)) result.push(Module.SummerVacation)
  if (str.includes(Module.Annual)) result.push(Module.Annual)

  //どのモジュールにも判定されなかったが空文字ではない場合、仮にunknownとする
  if (str !== '' && result.length === 0) result.push(Module.Unknown)

  return result
}

/**
 * 標準履修年次の文字列
 * '1' '1・2' '1 - 3' 等を解析して
 * [1], [1,2], [1,2,3] のような配列で返す
 * @param str 解析する文字列
 */
const analyzeYear = (str: string): number[] => {
  const res: number[] = []
  const seqRes = /(\d) - (\d)/gm.exec(str)
  if (seqRes) {
    for (let i = Number(seqRes[1]); i <= Number(seqRes[2]); i++) {
      res.push(i)
    }
  } else if (/・/.test(str)) {
    res.push(...str.split('・').map(e => Number(e)))
  }
  return res
}

/**
 * CSVをパースする
 * @param csv KDBからダウンロードしたcsv文字列
 */
export default (csv: string): Lecture[] => {
  //コンソールの進捗バー
  const bar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic)

  const rows = parseCsv(csv)

  ////// コンソール表示
  console.log('●  Parsing'.green.bold)
  bar.start(rows.length, 0)
  let done = 0
  //////

  const classes = rows.map(columns => {
    const classData: Lecture = {
      lectureCode: columns[0],
      name: columns[1],
      credits: Number(columns[3]),
      type: Number(columns[2]),
      overview: columns[9],
      remarks: columns[10],
      year: analyzeYear(columns[4]),
      details: [],
      instructor: columns[8]
    }

    const moduleString = columns[5]
    const periodString = columns[6]
    const roomString = columns[7]

    // 空文字は省く
    const moduleArray = moduleString.split('\n')
    const periodArray = periodString.split('\n')
    const roomArray = roomString.split('\n')

    const count = Math.max(
      moduleArray.length,
      Math.max(periodArray.length, roomArray.length)
    )

    for (let i = 0; i < count; i++) {
      const modules = analyzeModule(
        moduleArray.length === 1 ? moduleArray[0] : moduleArray[i]
      )
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
