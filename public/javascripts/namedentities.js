let apiData = [];
let sortKeys = {
    value: '',
    name: '',
    count: ''
};

// On document load 
document.addEventListener('DOMContentLoaded', function() {

    axios.get('/namedentities')
        .then(response => {
            apiData = response.data.map(item => ({
                name: item.name,
                value: item.value,
                count: item.articleIds.length,
                articles: item.articleIds
            }));
            updateTable();
        })
        .catch(error => {
            console.log(error);
        });    
});

function sortTable(key) {
    // If clicked column was sorted before, toggle direction
    if (sortKeys[key]) {
        sortKeys[key] = sortKeys[key] === 'asc' ? 'desc' : 'asc';
    } else {
        // Otherwise, sort in ascending order
        sortKeys[key] = 'asc';
    }

    apiData.sort((a, b) => {
        let compareA = a[key];
        let compareB = b[key];

        // If sorting by 'name' or 'value', ignore case
        if (key === 'name' || key === 'value') {
            compareA = compareA.toLowerCase();
            compareB = compareB.toLowerCase();
        }

        if (compareA > compareB) {
            return sortKeys[key] === 'asc' ? 1 : -1;
        } else if (compareA < compareB) {
            return sortKeys[key] === 'asc' ? -1 : 1;
        } else {
            return 0;
        }
    });

    updateTable();
}

function updateTable() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    for (let item of apiData) {
        let row = document.createElement('tr');
        row.innerHTML = `
            <td class="border px-4 py-2">${item.value}</td>
            <td class="border px-4 py-2">${item.name}</td>
            <td class="border px-4 py-2">${item.count}</td>
            <td class="border px-4 py-2">
                ${item.articles.map((articleId, index) => 
                    `<a href="#" class="text-blue-600 hover:text-red-800 hover:underline" onclick="openArticle('${articleId}'); return false;">a${index+1}</a>`
                ).join(', ')}
            </td>
        `;
        tableBody.appendChild(row);
    }

    // Update total count
    const totalCount = document.getElementById('totalCount');
    totalCount.textContent = `Total count: ${apiData.length}`;    
}

function openArticle(articleId) {
    axios.get(`/articles/${articleId}`)
        .then(response => {
            if (response.data && response.data.link) {
                window.open(response.data.link, '_blank');
            } else {
                console.error('No URL returned from /article/ endpoint.');
            }
        }).catch(error => {
            console.error('Error fetching article URL:', error);
        });
}