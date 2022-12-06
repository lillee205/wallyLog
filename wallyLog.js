
const apiKey = "AIzaSyBU4O5E3Hz0em8D3YcedKqgQnc95_iL6yU"
const spreadsheetId = "1tYlGsOo136XFfn03VXM10ZxexXvNslL1NnWRn3XotHY"
// raw data from csv
let cleanData
// set of unique equipment types in data set
let equipmentTypes = new Set()
// set of unique locations in data set
let locations = new Set()
// keeps track of what filters are applied
let appliedFilters = {}

// indexToColName[i] will give the ith column's name. (0-indexed)
let indexToColName = {}

// main body code, initialization
$(function(){
    fillInTable()
    filterBtn = $("#filter")
    // opens filter menu when you click button
    filterBtn.click(toggleFilters)
    
    // initialize appliedFilters; set every filter to false 
    appliedFilters = {"Status": {Good: false, Error: false}}
    appliedFilters["Location"] = {}
    for (const loc of locations) {
	appliedFilters["Location"][loc] = false
    }
    appliedFilters["Equipment Type"] = {}
    for (const equip of equipmentTypes) {
	appliedFilters["Equipment Type"][equip] = false
    }
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
	    indexToColName[i] = cleanData[0][i]
	}
	
	// loop through all rows and add info to table
	tbody = table.createTBody()
	for (let i = 1; i < cleanData.length - 1; i++) {
	    let row = tbody.insertRow(-1)
	    for (let j = 0; j < 6; j++) {
		let cell = row.insertCell(-1)
		val = cleanData[i][j]

		// if cell is empty on sheet, have the cell contain white space
		if (val == "" || val == undefined) {
		    val = "&nbsp"
		}
		cell.innerHTML = val

		// keep track of unique equipment types & locations
		val = val.replaceAll(/\s+/g, '_') // replace whitespace with underscores
		                                  // so that val can be used as a variable name later
		if (indexToColName[j] == "Equipment Type") {
		    equipmentTypes.add(val)
		}
		else if (indexToColName[j] == "Location") {
		    locations.add(val)
		}
	    }
	}
    })
}

function search(val, filters = appliedFilters) {
    // given value in search bar and filters, filter csv table rows
    if (val == "") { // if empty and no filters, show everything
	if (noFiltersApplied()) {
	    console.log("no filters applied")
	    $("tbody").children().each( function() {
		this.style.display = "table-row"
	    })
	} else {
	    console.log("filtering...")
	    $("tbody").children().each(function() {
		rowChildren = this.children
		let show = true
		// we only look at columns equipType, location, and status
		for (let i = 2; i < rowChildren.length - 1; i++) {
		    cellVal = rowChildren[i].innerHTML.replaceAll(" ", "_")
		    if (!(showRow(indexToColName[i], cellVal))) {
			this.style.display = "none"
			show = false
			break;
		    }
		}
		if (show) {
		    this.style.display = "table-row"
		}
	    })
	}
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
    let goodChecked = appliedFilters["Status"]["Good"]
    let errorChecked = appliedFilters["Status"]["Error"]
    console.log(appliedFilters)
    Swal.fire({
	title: 'Filters',
	html:
	`<h4>Equipment Type</h4>
	 <div id = "equipment">
           ${getInputHtml("Equipment Type", equipmentTypes)}
         </div>
         <h4>Location</h4>
         <div id = "location">
           ${getInputHtml("Location", locations)}
         </div>
         <h4>Status</h4>
         <div id = "status">
           <span style="white-space: nowrap;"><input type = "checkbox" id = "good" name = "good" ${goodChecked ? 'checked' : ''}>
           <label for = "good">Good</label></span><br>
           <span style="white-space: nowrap;"><input type = "checkbox" id = "error" name = "error" ${errorChecked ? 'checked' : ''}>
           <label for = "error">Error</label></span><br>
         </div>

        `,
	showCloseButton: true,
	showCancelButton: false,
	focusConfirm: false,
	showConfirmButton: true,
	showClass: {
	    backdrop: 'swal2-noanimation', // disable backdrop animation
	    popup: '',                     // disable popup animation
	    icon: ''                       // disable icon animation
	},
	focusConfirm: false,
	// handle what data we will send when promise is resolved
	preConfirm: () => {
	    pop = Swal.getPopup()
	    filtersLoc = []
	    locations.forEach(element => {
		filtersLoc.push(element)
	    })
	    filtersEquip = []
	    equipmentTypes.forEach(element => {
		filtersEquip.push(element)
	    })
	    // create a dictionary that has elements status, location, and equipment
	    // each element has its own sub dictionary where it checks if certain values are true. 
	    const good = pop.querySelector('#good').checked
	    const error = pop.querySelector('#error').checked
	    let result = {"Status": {Good: good, Error: error}}
	    result["Location"] = {}
	    for (const loc of filtersLoc) {
		console.log(loc)
		result["Location"][loc] = (pop.querySelector("#" + loc)).checked
	    }
	    result["Equipment Type"] = {}
	    for (const equip of filtersEquip) {
		result["Equipment Type"][equip] = pop.querySelector("#" + equip).checked
	
	    }
	    return result
	}
    }).then((result) => {
	// if confirm button has been clicked
	if (result.isConfirmed) {
	    appliedFilters = result.value
	    console.log("Searching in progress")
	    console.log("Updated filters: ")
	    console.log(appliedFilters)
	    search("")
	    //$("#searchBar").value = ""
	}
    })
}


function getInputHtml(setName, set) {
    htmlStr = ""
    set.forEach(element => {
	// replace underscores with white space
	itemVal  = element.replaceAll('_', ' ')
	let checked = appliedFilters[setName][element]
	console.log(checked)
	htmlStr += `
        <span style="white-space: nowrap;"><input type = "checkbox" id = "${element}" name = "${element}" ${checked ? 'checked' : ''}>
        <label for = "${element}">${itemVal}</label></span><br>
        `
    })
    return htmlStr
}


function noFiltersApplied() {
    // returns true if every element in appliedFilters is false
    for (const category in appliedFilters) {
	// if every value in appliedFilters[category] is not false, return false
	if (Object.values(appliedFilters[category]).every(value => !value)) {
	    return false
	}
    }
    return true

}

function showRow(colName, cellVal) {
    // returns true if we show this category
    // returns false if we do not
    elems = appliedFilters[colName]
    // if every filter in this category is false, then we don't need to consider this category
    if (Object.values(elems).every(value => !value)) {
	return true
    }
    // if there exists a filter that is true and the value of the cell also matches that filter, return true
    for (const filter in elems) {
	if (elems[filter]  && cellVal == filter) {
	    return true
	}
    }
    return false
}
