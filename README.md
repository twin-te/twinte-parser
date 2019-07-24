[![npm version](https://badge.fury.io/js/twinte-parser.svg)](https://badge.fury.io/js/twinte-parser)
![NPM](https://img.shields.io/npm/l/twinte-parser.svg)
# twinte-parser
Twinte内部で利用するために開発された
`KdB（筑波大学教育課程編成支援システム 開設科目一覧）`
のパーサー。

# 構成
## KdBDownloader
KDBからCSVファイルをダウンロードする。

js例
```js
const csv = await require('twinte-parser').downloadKDB()
```
ts例
```typescript
import { donwloadKDB } from 'twinte-parser'

const csv = await downloadKDB()
```

## Parser
KdBから取得したcsvをオブジェクトに変換する。

js例
```js
const classes = require('twinte-parser').parseKDB(csv)
```

ts例
```typescript
import parseKDB from 'twinte-parser'
// or
import { parseKDB } from 'twinte-parser'

const classes = parseKDB(csv)
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
  Unknown = '不明'
}
```

### Class
```typescript
interface Class {
  id: string
  name: string
  details: {
    module: Module
    day: Day
    period: number
    room: string
  }[]
  instructor: string
}
```

ここで`details`が配列になっていることに注意。

例えば春AB・月曜１限・3A201の授業があった場合、

```typescript
{
  id: 'XXXXXXX',
  name: "名前",
  details: [
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
