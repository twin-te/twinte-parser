import _axios from 'axios'
import * as iconv from 'iconv-lite'
import * as fs from 'fs'

const axios = _axios.create({
  responseType: 'arraybuffer'
})
axios.interceptors.response.use(function(response) {
  response.data = iconv.decode(response.data, 'Shift_JIS')
  return response
})

export default async () => {
  if (fs.existsSync('./data.csv')) return fs.readFileSync('./data.csv', 'utf-8')
  const params = {
    pageId: 'SB0070',
    action: 'downloadList',
    hdnFy: '2019',
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
  fs.writeFileSync('./data.csv', res.data)
  return res.data
}
