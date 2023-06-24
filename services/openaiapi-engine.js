
require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');

async function getCompletion (prompt, max_tokens){
    return new Promise((resolve, reject) => {
        // Make a short summary of the text using GPT-3.
        // text = "This code creates an Express app with a /news endpoint that accepts a url query parameter. When a request is made to this endpoint, it uses axios to make an HTTP GET request to the specified URL. ";

        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        const modelEngine = "text-davinci-003";
        const summariesPromises = openai.createCompletion({
            model: modelEngine,
            prompt: prompt,
            temperature: 0.5,
            max_tokens: max_tokens,
            // top_p: 1.0,
            // frequency_penalty: 0.5,
            // presence_penalty: 0.0,
            // stop: ['You:'],
        })
        .then(response => {
            // const summary = response.data.choices[0].text.trim();
            // article.summary = summary;
            // console.log(summary);
            resolve(response);    
        })
        .catch(error => {
            console.error(error.response.data.error.message);
            reject(error.response.data.error);
        });    
    });
}

module.exports = { getCompletion } ;