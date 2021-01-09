import _axios from 'axios'
import _axiosCookiejarSupport from 'axios-cookiejar-support'
import * as iconv from 'iconv-lite'
import * as fs from 'fs'
import * as colors from 'colors'
import * as assert from 'assert'

export class NoCoursesFoundError extends Error {
  public constructor() {
    super('Search results are empty')
    Object.defineProperty(this, 'name', {
      configurable: true,
      enumerable: false,
      value: this.constructor.name,
      writable: true,
    })
    Error.captureStackTrace(this, NoCoursesFoundError)
  }
}

_axiosCookiejarSupport(_axios)

const axios = _axios.create({
  responseType: 'arraybuffer',
  withCredentials: true,
  jar: true,
})

const postBody = (obj: any) => {
  const urlParams = new URLSearchParams()
  Object.keys(obj).forEach((k) => urlParams.append(k, obj[k]))
  return urlParams
}

const extractFlowExecutionKey = (html: string) =>
  html.match(/&_flowExecutionKey=(.*?)"/m)[1]

const grantSession = async (): Promise<string> => {
  const res = await axios.get<Buffer>('https://kdb.tsukuba.ac.jp/')
  return extractFlowExecutionKey(iconv.decode(res.data, 'utf8'))
}

const searchAll = async (
  flowExecutionKey: string,
  year: number
): Promise<string> => {
  const res = await axios.post<Buffer>(
    'https://kdb.tsukuba.ac.jp/campusweb/campussquare.do',
    postBody({
      _flowExecutionKey: flowExecutionKey,
      _eventId: 'searchOpeningCourse',
      index: '',
      locale: '',
      nendo: year,
      termCode: '',
      dayCode: '',
      periodCode: '',
      campusCode: '',
      hierarchy1: '',
      hierarchy2: '',
      hierarchy3: '',
      hierarchy4: '',
      hierarchy5: '',
      freeWord: '',
      _gaiyoFlg: 1,
      _risyuFlg: 1,
      _excludeFukaikoFlg: 1,
      outputFormat: 0,
    })
  )
  const html = iconv.decode(res.data, 'utf8')
  if (html.includes('（全部で 0件あります）')) throw new NoCoursesFoundError()
  return extractFlowExecutionKey(html)
}

const downloadExcel = async (
  flowExecutionKey: string,
  year
): Promise<Buffer> => {
  const res = await axios.post<Buffer>(
    'https://kdb.tsukuba.ac.jp/campusweb/campussquare.do',
    postBody({
      _flowExecutionKey: flowExecutionKey,
      _eventId: 'outputOpeningCourseExcel',
      index: '',
      locale: '',
      nendo: year,
      termCode: '',
      dayCode: '',
      periodCode: '',
      campusCode: '',
      hierarchy1: '',
      hierarchy2: '',
      hierarchy3: '',
      hierarchy4: '',
      hierarchy5: '',
      freeWord: '',
      _gaiyoFlg: 1,
      _risyuFlg: 1,
      _excludeFukaikoFlg: 1,
      outputFormat: 1,
    })
  )
  assert(
    res.headers.contentType !==
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet .xlsx; charset=UTF-8'
  )
  return res.data
}

/**
 * KDBからCSVを取得
 */
export default async (
  year: number = new Date().getFullYear()
): Promise<Buffer> => {
  let flowExecutionKey = ''
  flowExecutionKey = await grantSession()
  flowExecutionKey = await searchAll(flowExecutionKey, year)
  return downloadExcel(flowExecutionKey, year)
}
