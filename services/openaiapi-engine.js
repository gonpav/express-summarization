
require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');

async function getCompletion (prompt, max_tokens, temperature){
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
            temperature: temperature,
            max_tokens: max_tokens,
            // top_p: 1.0,
            // frequency_penalty: 0.5,
            // presence_penalty: 0.0,
            // stop: ['You:'],
        })
        .then(response => {
            if (response.data.choices[0].finish_reason !== "stop"){
                // This is an error when "finish_reason" is not "stop". Return error message
                let partialContent = response.data;
                try {
                    partialContent = JSON.stringify(response.data, null, 2)
                } catch (e) {                    
                }
                reject(new Error(`The OpenAI completion API did not finish properly. Finish reason: "${response.data.choices[0].finish_reason}".\nPartially returned content:\n${partialContent}`));
            }
            resolve(response);    
        })
        .catch(error => {
            console.error(error.response.data.error.message);
            reject(error.response.data.error);
        });    
    });
}

async function getChatCompletion (messages, max_tokens, temperature){
    return new Promise((resolve, reject) => {

        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        const modelEngine = "gpt-3.5-turbo";
        const summariesPromises = openai.createChatCompletion({
            model: modelEngine,
            messages: messages,
            temperature: temperature,
            max_tokens: max_tokens,
            // top_p: 1.0,
            // frequency_penalty: 0.5,
            // presence_penalty: 0.0,
            // stop: ['You:'],
        })
        .then(response => {
            if (response.data.choices[0].finish_reason !== "stop"){
                // This is an error when "finish_reason" is not "stop". Return error message
                let partialContent = response.data;
                try {
                    partialContent = JSON.stringify(response.data, null, 2)
                } catch (e) {                    
                }
                reject(new Error(`The OpenAI completion API did not finish properly. Finish reason: "${response.data.choices[0].finish_reason}".\nPartially returned content:\n${partialContent}`));
            }
            resolve(response);    
        })
        .catch(error => {
            console.error(error.response.data.error.message);
            reject(error.response.data.error);
        });    
    });
}

module.exports = { getCompletion, getChatCompletion } ;