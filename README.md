[![npm version](https://badge.fury.io/js/twinte-parser.svg)](https://badge.fury.io/js/twinte-parser)
![NPM](https://img.shields.io/npm/l/twinte-parser.svg)
# twinte-parser
Twinte内部で利用するために開発された
`KdB（筑波大学教育課程編成支援システム 開設科目一覧）`
のパーサー。

# 構成
## KdBDownloader
KDBからCSVファイルをダウンロードする。

```typescript
import { donwloadKDB } from 'twinte-parser'

const csv = await downloadKDB()
```

## Parser
KdBから取得したcsvをオブジェクトに変換する。

```typescript
import parseKDB from 'twinte-parser'
// or
import { parseKDB } from 'twinte-parser'

const courses = parseKDB(csv)
```

## 型
### Module
```typescript
enum Module {
  SpringA = '春A',
  SpringB = '春B',
  SpringC = '春C',
  FallA = '秋A',
  FallB = '秋B',
  FallC = '秋C',
  SummerVacation = '夏季休業中',
  SpringVacation = '春季休業中',
  Annual = '通年',
  Unknown = '不明'
}
```

### Day
```typescript
enum Day {
  Sun = '日',
  Mon = '月',
  Tue = '火',
  Wed = '水',
  Thu = '木',
  Fri = '金',
  Sat = '土',
  Intensive = '集中',
  Unknown = '不明'
}

```

### Course
```typescript
interface Course {
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
  lastUpdate: Date
  error: boolean
}
```

ここで`schedules`が配列になっていることに注意。

例えば春AB・月曜１限・3A201の授業があった場合、

```typescript
{
  code: 'XXXXXXX',
  name: "名前",
  schedules: [
      {
        module: "春A",
        day: "月",
        period: 1,
        room: "3A201"
      },
      {
        module: "春B",
        day: "月",
        period: 1,
        room: "3A201"
      }
  ]
}
```

のようになる。これはモジュールごとに教室や開講時間が変更になる場合に対応するためである。

# ライセンス
MIT
