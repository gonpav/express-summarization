require('dotenv').config();

const express = require('express');
const app = express();
const axios = require('axios');
const { JSDOM } = require("jsdom");
const { Configuration, OpenAIApi } = require('openai');

const { OpenAI } = require ('langchain/llms/openai');
const { loadSummarizationChain }  = require ('langchain/chains');
const { RecursiveCharacterTextSplitter }  = require ('langchain/text_splitter');


const fs = require('fs');

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function preprocessHTML(html) {
    const dom = new JSDOM(html);
    const text = dom.window.document.body.textContent;

    // Preprocess the text using JavaScript's string methods.
    const lines = text.split('\n');
    const filteredLines = lines.filter((line) => line.trim().length > 0);
    const joinedText = filteredLines.join('\n');

    const tokens = joinedText.split(/\s+/);
    const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but']);
    const filteredTokens = tokens.filter(token => !stopWords.has(token.toLowerCase()));
    const lemmatizedTokens = filteredTokens.map(token => token.replace(/s$/, ''));  
    return joinedText;
}

function preprocessHTML2(html) {
    const dom = new JSDOM(html);
    let text = dom.window.document.body.textContent;

    // Preprocess the text using JavaScript's string methods.
    const tokens = text.split(/\s+/);
    const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'but']);
    const filteredTokens = tokens.filter(token => !stopWords.has(token.toLowerCase()));
    const lemmatizedTokens = filteredTokens.map(token => token.replace(/s$/, ''));   
    return lemmatizedTokens.join(' ');
    //return lemmatizedTokens;
}

function preprocessHTML3(html) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const scripts = document.querySelectorAll('script, style');
    scripts.forEach((script) => {
        script.remove();
    });
    const text = document.body.textContent || "";
    return text.replace(/\s+/g, " ").trim();
}

function preprocessHTML4(html) {

    const text = preprocessHTML3(html);

    // npm install natural
    // npm install stopword
    const natural = require('natural');
    const tokenizer = new natural.WordTokenizer();
    const stopWords = require('stopword');


    // Tokenize the text
    const tokens = tokenizer.tokenize(text);

    // Remove stop words
    const filtered_tokens = stopWords.removeStopwords(tokens);

    // Lemmatize the tokens
    const lemmatizer = new natural.Lemmatizer();
    const lemmatized_tokens = filtered_tokens.map(token => lemmatizer.lemmatize(token));

    return lemmatized_tokens;
}

async function getArticleSummary (article){
    return new Promise((resolve, reject) => {
        axios.get(article.url)
        .then(async (response) => {
            const data = response.data;

            // Save data in the raw_data.txt file 
            {
                const file = fs.createWriteStream(__dirname + '/raw_data.txt');
                file.write(data);
            } 

            // Extract text from the web-page using JavaScript's DOMParser.
            let text = preprocessHTML3(data);
            {
                const file = fs.createWriteStream(__dirname + '/processed3_data.txt');
                file.write(text);
            } 
            
            const model = new OpenAI({ temperature: 0 });
            const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
            const docs = await textSplitter.createDocuments([text]);

              // This convenience function creates a document chain prompted to summarize a set of documents.
            const chain = loadSummarizationChain(model, { type: "map_reduce" });
            const summary = await chain.call({
                input_documents: docs,
            });
            article.summary = summary.text;
            //console.log(summary);
            resolve();    
        });
    });
}

async function getArticleSummary2 (article){
    return new Promise((resolve, reject) => {
        axios.get(article.url)
        .then((response) => {
            // article.pageData = response.data;     

            const data = response.data;

            // Extract text from the web-page using JavaScript's DOMParser.
            let text = preprocessHTML3(data);

            // Make a short summary of the text using GPT-3.
            text = "This code creates an Express app with a /news endpoint that accepts a url query parameter. When a request is made to this endpoint, it uses axios to make an HTTP GET request to the specified URL. ";

            const configuration = new Configuration({
                apiKey: process.env.OPENAI_API_KEY,
            });
            const openai = new OpenAIApi(configuration);
            const prompt = "Please summarize the following text in 5 words:\n" + text;
            const modelEngine = "text-davinci-003";
			const summariesPromises = openai.createCompletion({
				model: modelEngine,
				prompt: prompt,
				temperature: 0.5,
				max_tokens: 60,
				// top_p: 1.0,
				// frequency_penalty: 0.5,
				// presence_penalty: 0.0,
				// stop: ['You:'],
			})
            .then(response => {
                const summary = response.data.choices[0].text.trim();
                article.pageData = summary;
                console.log(summary);
                resolve();    
            })
            .catch(error => {
                console.error(error);
                reject(error);
            });    
        })
        .catch(error => {
            console.error(error);
            reject(error);
        });

        // const articlePage = await axios.get(article.url);
        // articlePages.push(articlePage.data);
        // article.pageData = articlePage.data;

        /* setTimeout(() => {
          console.log(article.url);
          // gemerate random text of 10 characters
          article.pageData = Math.random().toString(36).substring(2, 12);
          resolve();
        }, 3000);*/

        // const delay = ms => new Promise(res => setTimeout(res, ms));
        // delay(5000);
        // console.log(article.url);    
    });
}

app.use('/news', async (req, res) => {
    axios.get('http://newsapi.org/v2/top-headlines?sources=cnn&apiKey=e5d6cfd4bf1b439c81f158a186abe945')
      .then(async function(response) {
        
        async function getArticlesSummaries(articles){
            let promises = [];
            articles.forEach(async article => {
                promises.push(getArticleSummary(article));
            });
            return Promise.all(promises).catch((err) => {
                console.log(err);
                throw err;
              });
        }


        try {
            // await getArticleSummary(response.data.articles[0]);
            await getArticlesSummaries(response.data.articles);
            console.log(response.data.articles);
            res.send(response.data.articles);       
            }
        catch (err){
            console.log(err);
        }
      });
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});