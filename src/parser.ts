import { Course, Day, Module } from './types'
import { read as readXLSX, utils } from 'xlsx'
import * as assert from 'assert'

/**
 * '月1,2' 等の曜日と時限の文字列を解析し、分解する
 * 例: '月1,2' -> [{day: Day.Mon, period: 1}, {day: Day.Mon, period: 2}]
 * @param str 解析する文字列
 */
const analyzeDayAndPeriod = (str: string): { day: Day; period: number }[] => {
  const result: { day: Day; period: number }[] = []
  /* 本来時限区切り（木1,2）で使われているカンマが
   * ```
   * 水2
   * 月・金3
   * ```
   * のように本来改行で区切られている書式の省略版として
   * 「水2,月・金3」のように使われていることを発見したので
   * 「,曜日」でsplitして解析を行う
   */
  str.split(/,(?=[日月火水木金土])/).forEach((
    str //全ての曜日に対して
  ) =>
    Object.entries(Day).forEach((k) => {
      const day = k[1] as Day //月, 火 , .... , 日 のどれか
      // 1から8限について
      for (let i = 1; i <= 8; i++) {
        /*
           strが{曜日}(任意の文字列){時限} にマッチするか調べる
           任意の文字列を間に挟むことで検出が一度で済む
           例1: 月1,2 は、月.*1と月.*2のテストに合格する
           例2: 月・水3は、月.*3と水.*3のテストに合格する
           */
        if (new RegExp(`${day}.*${i}`).test(str)) {
          result.push({
            day: day,
            period: i,
          })
        }
      }
      // 月1-4 のようなハイフン表記のテスト
      const longTermTest = new RegExp(`([${day}]).*(\\d)-(\\d)`).exec(str)
      if (longTermTest) {
        for (
          let i = Number(longTermTest[2]);
          i <= Number(longTermTest[3]);
          i++
        ) {
          if (!result.find((el) => el.day === day && el.period === i))
            result.push({
              day: day,
              period: i,
            })
        }
      }
    })
  )

  // 集中
  if (str.includes(Day.Intensive))
    result.push({
      day: Day.Intensive,
      period: 0,
    })

  // 応談
  if (str.includes(Day.Appointment))
    result.push({
      day: Day.Appointment,
      period: 0,
    })

  // 随時
  if (str.includes(Day.AnyTime))
    result.push({
      day: Day.AnyTime,
      period: 0,
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

  //「 春学期」記述の場合、kdb内部では春A～夏季扱いになっていた
  if (str.includes('春学期'))
    result.push(
      Module.SpringA,
      Module.SpringB,
      Module.SpringC,
      Module.SummerVacation
    )

  // 夏季休業中、通年のマッチング
  if (str.includes(Module.SummerVacation)) result.push(Module.SummerVacation)

  if (/秋[ABC]*A/gm.test(str)) result.push(Module.FallA)
  if (/秋[ABC]*B/gm.test(str)) result.push(Module.FallB)
  if (/秋[ABC]*C/gm.test(str)) result.push(Module.FallC)

  //「 秋学期」記述の場合、kdb内部では秋A～春季扱いになっていた
  if (str.includes('秋学期'))
    result.push(Module.FallA, Module.FallB, Module.FallC, Module.SpringVacation)

  // 春季休業中のマッチング
  if (str.includes(Module.SpringVacation)) result.push(Module.SpringVacation)

  // 通年のマッチング
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
    res.push(...str.split('・').map((e) => Number(e)))
  } else if (!Number.isNaN(parseInt(str))) {
    res.push(parseInt(str))
  }
  return res
}

const analyzeRow = (columns: string[]) => {
  const courseData: Course = {
    code: columns[0],
    name: columns[1],
    credits: !Number.isNaN(parseInt(columns[3])) ? Number(columns[3]) : 0,
    type: Number(columns[2]),
    overview: columns[9],
    remarks: columns[10],
    recommendedGrade: analyzeYear(columns[4]),
    schedules: [],
    instructor: columns[8],
    error: false,
    lastUpdate: new Date(columns[18] + '+09:00'), // JST保証
  }

  const moduleString = columns[5]
  const periodString = columns[6]
  const roomString = columns[7]

  const moduleArray = moduleString.split('\r\n')
  const periodArray = periodString.split('\r\n')
  const roomArray = roomString.split('\r\n')

  const count = Math.max(
    moduleArray.length,
    Math.max(periodArray.length, roomArray.length)
  )

  // データが壊れている可能性がある場合
  if (
    !(
      (moduleArray.length === count || moduleArray.length === 1) &&
      (periodArray.length === count || periodArray.length === 1) &&
      (roomArray.length === count || roomArray.length === 1)
    )
  ) {
    courseData.error = true
  }

  for (let i = 0; i < count; i++) {
    const modules = analyzeModule(
      moduleArray.length === 1 ? moduleArray[0] : moduleArray[i] || 'unknown'
    )
    const when = analyzeDayAndPeriod(
      periodArray.length === 1 ? periodArray[0] : periodArray[i] || 'unknown'
    )
    modules.forEach((mod) =>
      when.forEach((w) =>
        courseData.schedules.push({
          module: mod,
          period: w.period,
          day: w.day,
          room: roomArray.length === 1 ? roomArray[0] : roomArray[i] || '',
        })
      )
    )
  }
  return courseData
}

/**
 * Excelファイルをパースする
 * @param data xlsxファイルのバイナリ
 */
export default (data: Buffer): Course[] => {
  const sheet = readXLSX(data).Sheets['開設科目一覧']
  assert(sheet)
  const courses: Course[] = []

  for (let r = 5; ; r++) {
    // sheetの終端で終了
    if (typeof sheet[utils.encode_cell({ r, c: 0 })] === 'undefined') break

    const columns: string[] = []
    for (let c = 0; c <= 18; c++)
      columns.push(sheet[utils.encode_cell({ r, c })].v)

    // 科目番号が空の行はスキップ
    if (columns[0] === '') continue
    courses.push(analyzeRow(columns))
  }
  return courses
}
