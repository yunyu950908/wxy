```javascript
program
  .version('0.0.1')
  .option('-n, --name [string]', '查询关键字 如: 藿香')
  .option('-p, --p [number]', '起始页码 如: 1')
  .option('-s, --pageSize [number]', '每页条数 如: 20')
  .option('-d, --drugtypess [string]', '药物类型 如: 全部')
  .option('-e, --end [number]', '终止页 如: 100')
  .option('-f, --filename [string]', '存储路径 如: result.txt')
  .parse(process.argv);
```

```bash
node index.js -n "清热" -p 1 -s 20 -d "全部" -e 3 -f "清热.txt"
```
