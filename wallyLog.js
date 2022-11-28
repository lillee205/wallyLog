const apiKey = "AIzaSyBU4O5E3Hz0em8D3YcedKqgQnc95_iL6yU"
const spreadsheetId = "1tYlGsOo136XFfn03VXM10ZxexXvNslL1NnWRn3XotHY"

let cleanData;
$(function(){
    searchBar("")
    fillInTable()
    filterBtn = $("#filter")
    filterBtn.click(toggleFilters);
})

function fillInTable() {
// fill in site with spreadsheet info as soon as site loads

    $.get({
	url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A%3AZ?key=${apiKey}`,
	json: true,
    }, (data) => {
	let cleanData = data.values // contents of google sheet

	// create header of table
	let table = document.getElementById("inventoryTable")
	let headers = cleanData[0]
	let row = table.createTHead().insertRow(-1)
	for (let i = 0; i < headers.length; i++){
	    cell = row.insertCell(-1)
	    cell.outerHTML = "<th>" + cleanData[0][i] + "</th>"
	}
	// loop through all rows and add info to table
	tbody = table.createTBody()
	for (let i = 1; i < cleanData.length - 1; i++) {
	    let row = tbody.insertRow(-1)
	    for (let j = 0; j < cleanData[i].length; j++) {
		let cell = row.insertCell(-1)
		val = cleanData[i][j]
		if (val == "")
		    cell.innerHTML = "n/a"
		else
		    cell.innerHTML = val
	    }
	}
    })
}

function searchBar(val) {
    if (val == "") { // if empty, show everything
	$("tbody").children().each(function() {
	    this.style.display = "table-row"
	})
    }
    else { // otherwise, search for items which have val as a substring
	$("tbody").children().each(function(){
	    let barcodeName = this.children[0].innerHTML.toLowerCase()
	    let machineNum = this.children[1].innerHTML
	    // convert val to lowercase since case is irrelevant
	    val = val.toLowerCase()
	    // if val is found as substr in either barcode or machine #
	    if (barcodeName.search(val) != -1 || machineNum.search(val) != -1) {
		// show row
		this.style.display = "table-row";
	    } else{
		
		// hide row
		this.style.display = "none";
	    }
	});
    }

}

function toggleFilters() {
    // if currently hidden, toggle filters as viewable
    Swal.fire({
	title: 'Error!',
	text: 'Do you want to continue',
	icon: 'error',
	confirmButtonText: 'Cool'
    })
}

