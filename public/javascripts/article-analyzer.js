let newsSources = null;   
let articles = null; 

// On document load 
document.addEventListener('DOMContentLoaded', function() {

    axios
    .get('/newssources')
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
    updateArticleMetadata();   

    // add and select placeholder if required
    if (selectValue !== ""){
        axios
        .get(`/articles/${selectValue}`)
        .then(async response => {
            if(response && response.data){
                articles = response.data;
                console.log(`Articles foudn: ${articles.length}`);
                for(let i = -1; i < articles.length; i++) {
                    // console.log(articles[i]);
                    const el = document.createElement("option");
                    el.textContent = (i === -1) ? "Select article" : articles[i].title;
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
    document.getElementById("label3").innerHTML = article ? `<b>Url</b>: ${article.link}` : null;
    document.getElementById("label4").innerHTML = article ? `<b>Snippet</b>: ${article.contentData}` : null;

    if (article) {
        tippy(document.getElementById("label4"), {
            content: article.contentData ? article.contentData : article.contentSnippet,
            allowHTML: true,
            placement: 'right'
        });
    }

    document.getElementById("textArea2").innerText = article ? `${article.contentData}` : null;
    // document.getElementById("textArea3").innerText = article ? `${article.contentData}` : null;
}

function updateArticleMetadata(){
    console.log('reset Article MetaData area');
}

function dropDownOnChange(selectElement) {
    
    if (selectElement.id === "dropdown1") { resetArticlesList( selectElement.value); }
    if (selectElement.id === "dropdown2") { updateArticleData( selectElement.value); }

    // Select right styles for drop-down
    if (selectElement.value === "") {
        selectElement.classList.add("dropdown-placeholder");
    } else {
        selectElement.classList.remove("dropdown-placeholder");
    }
}
