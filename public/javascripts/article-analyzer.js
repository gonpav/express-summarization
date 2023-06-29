let newsSources = null;   
let articles = null; 

// On document load 
document.addEventListener('DOMContentLoaded', function() {
    enableAnalyzeButton (false);
    axios.get('/newssources')
        .then(async response => {
            if(response && response.data){
                newsSources = response.data;
                const select = document.getElementById("dropdown1")
                for(let i = 0; i < newsSources.length; i++) {
                    const el = document.createElement("option");
                    const ns = newsSources[i]; 
                    el.textContent = ns.name;
                    el.value = ns.id;
                    select.appendChild(el);
                }  
            }
        })
        .catch(error => {
            console.log(error);
        });    
});

function resetArticlesList(selectValue){

    // Delete all options in element with id === dropdown2
    const select = document.getElementById("dropdown2");
    select.classList.add("dropdown-placeholder");
    while (select.options.length > 0) {
        select.remove(0);
    }    
    // reset UI
    articles = null;
    updateArticleData(null);

    // add and select placeholder if required
    if (selectValue !== ""){
        axios.get(`/articles/newssource/${selectValue}`)
            .then(async response => {
                if(response && response.data){
                    articles = response.data;
                    console.log(`Articles foudn: ${articles.length}`);
                    for(let i = -1; i < articles.length; i++) {
                        // console.log(articles[i]);
                        const el = document.createElement("option");
                        el.textContent = (i === -1) ? "Select article" : getArticleTitleForList(articles[i]);
                        el.value = (i === -1) ? "" : articles[i].link;
                        el.selected = (i === -1) ? true : false;
                        select.appendChild(el);
                    }
                }
            })
            .catch(error => {
                console.log(error);
            });    
    }
    else {
        // stay with reset UI
    }    
}

function updateArticleData(selectValue){
    const article = (articles && selectValue) ? articles.find(x => x.link === selectValue) : null;
   
    document.getElementById("label1").innerHTML = article ? `<b>Title</b>: ${article.title}` : null;
    document.getElementById("label2").innerHTML = article ? `<b>Published on</b>: ${article.pubDate}` : null;
    document.getElementById("label3").innerHTML = article ? `<b>Url</b>: <a href="${article.link}" target="_blank" class="text-blue-500 underline">${article.link}</a>` : null;
    document.getElementById("label4").innerHTML = article ? `<b>Snippet</b>: ${article.contentData}` : null;

    if (article) {
        document.getElementById("copyContentBtn").classList.remove('hidden');
        tippy(document.getElementById("label4"), {
            content: article.contentData ? article.contentData : article.contentSnippet,
            allowHTML: true,
            placement: 'right'
        });
    }
    else {
        document.getElementById("copyContentBtn").classList.add('hidden');        
    }

    enableAnalyzeButton(article != null);
    fetchArticleMetadata(article);   
}

function fetchArticleMetadata(article){

    if (article && article.lastAnalysisDate){
        const articleId = article.id;
        enableAnalyzeButton(false);
        axios.get(`/articles/metadata/${articleId}`)
            .then(async response => {

                updateArticleMetadata(articleId, response.data, true);

                // enable loadSourcesBtn button
                enableAnalyzeButton(true);
            })
            .catch(error => {
                console.log(error);
                enableAnalyzeButton(true);
            });  
    }
    else {
        var jsonOutput = document.getElementById('jsonOutput').textContent = "";
        updateArticleMetadataVersions(null,null);
    }
}

function updateArticleMetadata(articleId, responseData, updatePrompt){
    var jsonOutput = document.getElementById('jsonOutput');
    // If error happened then show it and exit
    if (responseData.error) {
        jsonOutput.textContent = responseData.error; // JSON.stringify(responseData.error, null, 2);
        return;        
    }
    const metadata = responseData.data;

    // Save metadata information locally
    const index = articles.findIndex(x => x.id === articleId);
    articles[index].metadata = metadata;

    // Get the latest metadata and show it in the prompt (if showPrompt) and jsonOutput area
    let mostRecentMetadata = metadata.reduce((mostRecent, current) => {
        return (mostRecent.queryDate > current.queryDate) ? mostRecent : current;
    });

    updateArticleMetadataVersions(articles[index], mostRecentMetadata.queryDate);
    updateArticleMetadataResult(articles[index], mostRecentMetadata.queryDate)
}

function updateArticleMetadataVersions(article, selectedDate) {

    const select = document.getElementById("dropdown3");
    // Delete all options in element with id === dropdown2
    while (select.options.length > 0) {
        select.remove(0);
    } 
    if (!article || !article.metadata) {
        return;
    }
    // Sort here ????
    let selectedOption = null;
    for(let i = 0; i < article.metadata.length; i++) {
        const el = document.createElement("option");
        const md = article.metadata[i]; 
        el.textContent = md.queryDate;
        el.value = md.queryDate;
        select.appendChild(el);

        if (selectedDate === md.queryDate) {
            selectedOption = el;
        }
    }  
    if (selectedOption) { 
        selectedOption.selected = true;
    }
}

function updateArticleMetadataResult (article, queryDate) {
    let mostRecentMetadata = article.metadata.find(x => x.queryDate === queryDate);

    const jsonResponse = JSON.stringify(mostRecentMetadata.result, null, 2);

    // Update Json Output area
    var jsonOutput = document.getElementById('jsonOutput');
    jsonOutput.textContent = jsonResponse;   
    if (mostRecentMetadata.result.choices){            
        jsonOutput.textContent += "\n";
        jsonOutput.textContent += mostRecentMetadata.result.choices[0].text.trim();
        //jsonOutput.textContent += JSON.stringify(mostRecentMetadata.result.choices[0].text.trim(), null, 2);
    }
    
    jsonOutput.textContent ? document.getElementById("copyMetadataBtn").classList.remove('hidden') : document.getElementById("copyMetadataBtn").classList.add('hidden');

    // Update Prompt area
    if (mostRecentMetadata.prompt) {
        document.getElementById('textArea').value = mostRecentMetadata.prompt;
    }  
}

function dropDownOnChange(selectElement) {
    
    if (selectElement.id === "dropdown1") { resetArticlesList( selectElement.value); }
    if (selectElement.id === "dropdown2") { updateArticleData( selectElement.value); }
    
    if (selectElement.id === "dropdown3") { 
        const article = getSelectedArticle();
        updateArticleMetadataResult( article, selectElement.value); 
    }
    else {
        // Select right styles for drop-down
        if (selectElement.value === "") {
            selectElement.classList.add("dropdown-placeholder");
        } else {
            selectElement.classList.remove("dropdown-placeholder");
        }
    }
}

function enableAnalyzeButton(enable) {
    // bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded
    const btn = document.getElementById("btnAnalyze");
    btn.disabled = !enable;
    if(enable) {
        btn.className = 'bg-blue-500 text-white font-bold py-2 px-4 rounded'; 
    }
    else {
        btn.className = 'bg-blue-500 text-white font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed';
    }
}

function getSelectedArticle () {
    const articlesDropDown = document.getElementById('dropdown2');
    const selectValue = articlesDropDown.value;   
    const article = (articles && selectValue) ? articles.find(x => x.link === selectValue) : null;    
    return article;
}

function getArticleTitleForList(article){
    return article.lastAnalysisDate ? "** " + article.title : article.title;
}

document.getElementById('btnAnalyze').onclick = () => {

    // Get the value of textarea by id
    const prompt = document.getElementById('textArea').value;
    var max_tokens = Number(document.getElementById('txtMaxTokens').value); 
    if (!prompt || prompt == ""|| !max_tokens) {
      alert("Please enter Prompt and Max Tokens value");
      return false;
    }

    enableAnalyzeButton(false);

    const article = getSelectedArticle();

    // Submit the value using POST request and POST endpoint
    axios.post(`/articles/analyze/${article.id}`, { text: prompt, max_tokens: max_tokens })
        .then(async response => {

            
            if (response.data && response.data.article) {
                // Update article with server information
                const index = articles.findIndex(x => x.link === article.link);
                articles[index] = response.data.article;
                
                // Update text in articlis DropDown to reflect changes
                const articlesDropDown = document.getElementById('dropdown2');
                const selectedOption = articlesDropDown.options[articlesDropDown.selectedIndex];
                selectedOption.text = getArticleTitleForList(response.data.article);
            }        
            
            // Udpate article metadata
            updateArticleMetadata(article.id, response.data, false);

            // enable loadSourcesBtn button
            enableAnalyzeButton(true);
        })
        .catch(error => {
            console.log(error);
            enableAnalyzeButton(true);
        });  
};

document.getElementById('btnNamedEntities').onclick = () => {

    // Get the value of textarea by id
    enableAnalyzeButton(false);

    const article = getSelectedArticle();

    // Submit the value using POST request and POST endpoint
    axios.get(`/articles/namedentities/${article.id}`)
        .then(async response => {
        

            // enable loadSourcesBtn button
            enableAnalyzeButton(true);
        })
        .catch(error => {
            console.log(error);
            enableAnalyzeButton(true);
        });  
};

document.getElementById('copyContentBtn').onclick = () => {

    const article = getSelectedArticle();
    navigator.clipboard.writeText(article.contentData);
};


document.getElementById('copyMetadataBtn').onclick = () => {

    var jsonOutput = document.getElementById('jsonOutput');
    navigator.clipboard.writeText(jsonOutput.textContent);
};
