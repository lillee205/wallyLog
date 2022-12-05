
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

$(function(){
    search("")
    fillInTable()
    filterBtn = $("#filter")
    filterBtn.click(toggleFilters)
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
		val = val.replaceAll(/\s+/g, '_');
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
		console.log(indexToColName)
		rowChildren = this.children
		// we only look at columns equipType, location, and status
		for (let i = 2; i < rowChildren.length - 1; i++) {
		    
		    cellVal = rowChildren[i].innerHTML.replaceAll(" ", "_")
		    if (indexToColName[i] == "Equipment Type") {
			equipType = appliedFilters["Equipment Type"]
			for (const filter in equipType) {
			    // if filter is turned on and cell does not match filter
			    if (equipType[filter] == true && cellVal == filter) {
				// hide row
				this.style.display = "none"
				continue
			    }
			}
		    }
		    else if (indexToColName[i] == "Location") {
			locs = appliedFilters["Location"]
			for (const filter in locs) {
			    // if filter is turned on and cell does not match filter

			    if (locs[filter] == true  && cellVal != filter) {
				// hide row
				this.style.display = "none"
				continue
			    }
			}
		    }
		    else if (indexToColName[i] == "Status") {
			status = appliedFilters["Status"]
			for (const filter in status) {
			    // if filter is turned on and cell does not match filter
			    if (equipType[status] == true && cellVal != filter) {
				// hide row
				this.style.display = "none"
				continue
			    }
			}
		    }
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
    Swal.fire({
	title: 'Filters',
	html:
	`<h4>Equipment Type</h4>
	 <div id = "equipment">
           ${getInputHtml(equipmentTypes)}
         </div>
         <h4>Location</h4>
         <div id = "location">
           ${getInputHtml(locations)}
         </div>
         <h4>Status</h4>
         <div id = "status">
           <span style="white-space: nowrap;"><input type = "checkbox" id = "good" name = "good">
           <label for = "good">Good</label></span><br>
           <span style="white-space: nowrap;"><input type = "checkbox" id = "error" name = "error">
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
	    console.log(appliedFilters)
	    search("")
	    //$("#searchBar").value = ""
	}
    })
}


function getInputHtml(set) {
    htmlStr = ""
    set.forEach( element => {
	// replace underscores with white space
	itemVal  = element.replaceAll('_', ' ')
	htmlStr += `
        <span style="white-space: nowrap;"><input type = "checkbox" id = "${element}" name = "${element}">
        <label for = "${element}">${itemVal}</label></span><br>
        `
    })
    return htmlStr
}


function noFiltersApplied() {
    length = Object.keys(appliedFilters).length
    if (length == 0) {
	return true
    }
    // returns true if every element in appliedFilters is false
    for (const category in appliedFilters) {
	for (const filter in appliedFilters[category]) {
	    // if filter is true
	    if (appliedFilters[category][filter]) {
		return false
	    }
	}
    }
    return true

}
