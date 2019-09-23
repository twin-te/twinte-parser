import _axios from 'axios'
import * as iconv from 'iconv-lite'
import * as fs from 'fs'
import * as colors from 'colors'

const axios = _axios.create({
  responseType: 'arraybuffer' //Shift_JIS のデータを受け取る都合でbufferで受け取る
})
axios.interceptors.response.use(function(response) {
  response.data = iconv.decode(response.data, 'Shift_JIS') // Shift_JIS to UTF-8
  return response
})

/**
 * KDBからCSVを取得
 */
export default async (
  year: number = new Date().getFullYear()
): Promise<string> => {
  console.log('Downloading csv from kdb...'.cyan)
  const params = {
    pageId: 'SB0070',
    action: 'downloadList',
    hdnFy: year,
    hdnTermCode: '',
    hdnDayCode: '',
    hdnPeriodCode: '',
    hdnAgentName: '',
    hdnOrg: '',
    hdnIsManager: '',
    hdnReq: '',
    hdnFac: '',
    hdnDepth: '',
    hdnChkSyllabi: false,
    hdnChkAuditor: false,
    hdnCourse: '',
    hdnKeywords: '',
    hdnFullname: '',
    hdnDispDay: '',
    hdnDispPeriod: '',
    hdnOrgName: '',
    hdnReqName: '',
    cmbDwldtype: 'csv'
  }
  const urlParams = new URLSearchParams()
  Object.keys(params).forEach(k => urlParams.append(k, params[k]))
  const res = await axios({
    method: 'post',
    url: 'https://kdb.tsukuba.ac.jp',
    data: urlParams,
    headers: {
      'Accept-Encoding': '',
      'Accept-Language': 'ja,ja-JP;q=0.9,en;q=0.8'
    }
  })
  console.log('✔  Done'.cyan.bold)
  return res.data
}
