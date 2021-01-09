export interface Course {
  code: string
  name: string
  credits: number
  overview: string
  remarks: string
  type: number
  recommendedGrade: number[]
  schedules: {
    module: Module
    day: Day
    period: number
    room: string
  }[]
  instructor: string
  error: boolean
  lastUpdate: Date
}

export enum Module {
  SpringA = '春A',
  SpringB = '春B',
  SpringC = '春C',
  FallA = '秋A',
  FallB = '秋B',
  FallC = '秋C',
  SummerVacation = '夏季休業中',
  SpringVacation = '春季休業中',
  Annual = '通年',
  Unknown = '不明',
}

export enum Day {
  Sun = '日',
  Mon = '月',
  Tue = '火',
  Wed = '水',
  Thu = '木',
  Fri = '金',
  Sat = '土',
  Intensive = '集中',
  Unknown = '不明',
}
