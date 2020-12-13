import _axios from 'axios'
import _axiosCookiejarSupport from 'axios-cookiejar-support'
import * as iconv from 'iconv-lite'
import * as fs from 'fs'
import * as colors from 'colors'

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

const searchAll = async (flowExecutionKey: string): Promise<string> => {
  const res = await axios.post<Buffer>(
    'https://kdb.tsukuba.ac.jp/campusweb/campussquare.do',
    postBody({
      _flowExecutionKey: flowExecutionKey,
      _eventId: 'searchOpeningCourse',
      index: '',
      locale: '',
      nendo: 2020,
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
  return extractFlowExecutionKey(iconv.decode(res.data, 'utf8'))
}

const downloadExcel = async (flowExecutionKey: string): Promise<Buffer> => {
  const res = await axios.post<Buffer>(
    'https://kdb.tsukuba.ac.jp/campusweb/campussquare.do',
    postBody({
      _flowExecutionKey: flowExecutionKey,
      _eventId: 'outputOpeningCourseExcel',
      index: '',
      locale: '',
      nendo: 2020,
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
  flowExecutionKey = await searchAll(flowExecutionKey)
  return downloadExcel(flowExecutionKey)
}
