const cheerio = require('cheerio');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const _ = require('lodash');
const program = require('commander');
const moment = require('moment');

program
  .version('0.0.1')
  .option('-n, --name [string]', '查询关键字 如: 藿香')
  .option('-p, --p [number]', '起始页码 如: 1')
  .option('-s, --pageSize [number]', '每页条数 如: 20')
  .option('-d, --drugtypess [string]', '药物类型 如: 全部')
  .option('-e, --end [number]', '终止页 如: 100')
  .option('-f, --filename [string]', '存储路径 如: result.txt')
  .parse(process.argv);

const now = moment().format('YYYY-MM-DD_HH:mm:ss');
const { name = '', p = 1, pageSize = 20, drugtypess = '全部', end, filename = `${now}.txt` } = program;

const CONSTANT = {
  NAME: name,
  START_PAGE: p,
  PAGE_SIZE: pageSize,
  DRUG_TYPESS: drugtypess,
  END_PAGE: end,
  FILENAME: filename,
};

console.log(process.argv.slice(2).join(' '));

if (!CONSTANT.NAME) {
  console.log('no name specified, process exit with code 2');
  process.exit(2);
}

const baseUrl = 'https://db.yaozh.com';

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Referer': 'https://db.yaozh.com',
  },
});

const url = 'https://db.yaozh.com/drugad';

async function getPageData(p) {
  const { data } = await instance({
    method: 'get',
    url,
    params: {
      drugtypess: CONSTANT.DRUG_TYPESS,
      name: CONSTANT.NAME,
      p,
      pageSize:CONSTANT.PAGE_SIZE,
    },
  });
  return data;
}

async function getHrefs(data) {
  const $ = cheerio.load(data);
  const $table = $('table.table.table-striped tbody');
  const $trs = $table.find('tr');
  const rows = [];
  for (let i = 0; i < $trs.length; i++) {
    const tr = $trs[i];
    const tds = $(tr).find('td');
    const a = $(tr).find('a')[0];
    const href = `${baseUrl}${$(a).attr('href')}`;
    const p = _.map(tds, item => $(item).text());
    p.push(href);
    const detailPage = await getSingleData(href);
    await sleep(1000);
    const ad = getSingleAd(detailPage);
    p.push(ad);
    rows.push(p.join(','));
  }

  return rows;
}

async function sleep(ms) {
  return new Promise(rsv => {
    setTimeout(rsv, ms);
  });
}

(async () => {
  for (let i = CONSTANT.START_PAGE; ; i++) {
    const data = await getPageData(i);
    const rows = await getHrefs(data);
    _.forEach(rows, row => appendToFile(CONSTANT.FILENAME, `${row}\n`));
    console.log(`target page ${i} success! wait 2s and start next one...`);
    await sleep(1000);
    if (CONSTANT.END_PAGE && CONSTANT.START_PAGE >= CONSTANT.END_PAGE) {
      break;
    }
  }
})()
  .then()
  .catch(e => {
    fs.appendFileSync('error.log', JSON.stringify(e));
    console.log('something went wrong, process exit with code 3');
    process.exit(3);
  });

async function getSingleData(url) {
  const { data } = await instance.get(url);
  return data;
}

function getSingleAd(data) {
  const $ = cheerio.load(data);
  const $table = $('.body.detail-main table.table');
  const $spans = $table.find('tr > td > span');
  const href = $spans.last().find('a').attr('href');
  return href;
}

function appendToFile(filename, data) {
  fs.appendFileSync(filename, data, 'utf8');
}
