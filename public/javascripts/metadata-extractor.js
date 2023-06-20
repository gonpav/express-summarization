// On document load 

document.addEventListener('DOMContentLoaded', function() {
    var el = document.getElementById("label1"); 
    el.textContent = "JS script DOMContentLoaded called " + new Date().getTime();

    var select = document.getElementById("dropdown2");
    for(var i = 0; i < 3; i++) {
        var el = document.createElement("option");
        el.textContent = 'Some text ' + i.toString();
        el.value = el.textContent;
        select.appendChild(el);
    }   
    // var el = document.getElementById("label3"); 
    // el.textContent = "JS script window.onload called";
    /* axios.get('url1') // Replace 'url1' with the actual url from where you want to fetch the data for dropdown1
        .then(function (response) {
            var select = document.getElementById("dropdown1");
            for(var i = 0; i < response.data.length; i++) {
                var opt = response.data[i];
                var el = document.createElement("option");
                el.textContent = opt;
                el.value = opt;
                select.appendChild(el);
            }
        })
        .catch(function (error) {
            console.log(error);
        });*/    
});

function dropDownOnChange(selectElement) {
    if (selectElement.value === "") {
        selectElement.classList.add("dropdown-placeholder");
    } else {
        selectElement.classList.remove("dropdown-placeholder");
    }
}
