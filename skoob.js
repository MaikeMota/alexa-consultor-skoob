require('dotenv').config();

const iconv = require('iconv-lite');
const cheerio = require('cheerio');
const axios = require('axios');

const {
    TITLE_SELECTOR, SUBTITLE_SELECTOR, RATING_SELECTOR,
    DESCRIPTION_SELECTOR, AUTHOR_SELECTOR, THUMB_SELECTOR,
    RATING_VOTES_SELECTOR, TRADING_SELECTOR,
    USER_AGENT, BASE_API, SEARCH_ENDPOINT, BOOK_ENDPOINT
} = process.env;

const api = axios.create({
    baseURL: BASE_API,
    responseType: 'arraybuffer',
    responseEncoding: 'binary'
});
api.interceptors.response.use(decodeResponse);
api.defaults.headers.common["User-Agent"] = USER_AGENT;

async function searchBook(bookName) {
    let response = await api.get(`${SEARCH_ENDPOINT}${encodeURIComponent(bookName)}`);
    return JSON.parse(response.data).results;
}

async function getBookData(bookId) {
    let response = await api.get(`${BOOK_ENDPOINT}${bookId}`);
    const $ = cheerio.load(response.data, {
        normalizeWhitespace: true,
        decodeEntities: false
    });
    const title = $(TITLE_SELECTOR).text();
    const subtitle = $(SUBTITLE_SELECTOR).text();
    const rating = $(RATING_SELECTOR).text();
    let ratingVotes = $(RATING_VOTES_SELECTOR).text();

    if (ratingVotes) {
        let matching = ratingVotes.match(/[0-9]{1,}[.]?[0-9]{1,}/g)
        if (matching) ratingVotes = matching[0];
    }

    let tradingUnits = $(TRADING_SELECTOR).text();

    if (tradingUnits) {
        let matching = tradingUnits.match(/[0-9]{1,}[.]?[0-9]{1,}/g)
        if (matching) tradingUnits = matching[0];

    }
    const description = $(DESCRIPTION_SELECTOR).text();
    const author = $(AUTHOR_SELECTOR).text();
    const thumb = $(THUMB_SELECTOR).attr('src');

    let bookData = {
        title,
        subtitle,
        description,
        rating,
        ratingVotes,
        tradingUnits,
        author,
        thumb
    }
    return bookData;
}

function decodeResponse(response) {
    let ctype = response.headers["content-type"];
    const charset = 'charset=';
    if (ctype.includes(charset)) {
        let ctypeIndex = ctype.indexOf(charset);
        let encoding = ctype.substring(ctypeIndex + charset.length, ctype.lenght);
        response.data = iconv.decode(response.data, encoding);
    }
    return response;
}

module.exports = {
    getBookData,
    searchBook
}