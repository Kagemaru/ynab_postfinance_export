// ==UserScript==
// @name        Postfinance CSV Export
// @namespace   Kagemaru
// @include     https://www.postfinance.ch/ap/ba/fp/html/e-finance/assets
// @version     3.0.8
// @grant       none
// @updateURL   https://github.com/Kagemaru/ynab_postfinance_export/raw/master/ynab_postfinance_export.user.js
// ==/UserScript==
// Function definitions
function createGenerateButton() {
    let input = document.createElement("input");
    input.type = "button";
    input.value = "YNAB Export";
    input.className = "btn";
    input.style.setProperty('margin-left', '8px');
    input.onclick = createExportButton;

    $("input[name='data']")[0].parentNode.append(input);
}

function createExportButton() {
    const csv = createCSV();
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const filename = "ynab-" + year + "-" + month + "-" + day + ".csv";

    // create a temporary download link
    let input = document.createElement("a");
    input.setAttribute('href', 'data:text/csv;charset=UTF-8,' + encodeURIComponent(csv));
    input.setAttribute('download', filename);
    input.style.display = 'none';

    // ...and click it to trigger the download
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

function createCSV() {
    // acquire the data computed by the Post
    let result = JSON.parse($("input[name='data']")[0].value)

    // process the content
    result = result.filter(row => row.length === 6).map((row, index) => index > 0 ? sanitizeRow(row) : createHeader());

    // join the results into a single string
    return result.join("\n");
}

function createHeader() {
    return 'Date,Payee,Category,Memo,Outflow,Inflow';
}

function sanitizeRow(row) {
    const date = row[4].replace(/(.*)-(.*)-(.*)/, '$3.$2.$1'); //Valutadatum statt Buchungsdatum
    const payee = '"' + row[1].replace(/\"/gi, '').replace(/\r\n?|\n/gi, ' ') + '"';
    const category = '';
    const memo = '';
    const outflow = row[3].replace(/-(.*)/, '$1');
    const inflow = row[2];

    let line = [];
    line.push(date);
    line.push(payee);
    line.push(category);
    line.push(memo);
    line.push(outflow);
    line.push(inflow);

    return line.join(',');
}

/* waitForKeyElements():  A handy, utility function that
 * does what it says.
 */
function waitForKeyElements(
    selectorTxt,    /* Required: The jQuery selector string that
                        specifies the desired element(s).
                    */
    actionFunction, /* Required: The code to run when elements are
                        found. It is passed a jNode to the matched
                        element.
                    */
    bWaitOnce,      /* Optional: If false, will continue to scan for
                        new elements even after the first match is
                        found.
                    */
    iframeSelector  /* Optional: If set, identifies the iframe to
                        search.
                    */
) {
    var targetNodes, btargetsFound;

    if (typeof iframeSelector == "undefined")
        targetNodes = $(selectorTxt);
    else
        targetNodes = $(iframeSelector).contents()
            .find(selectorTxt);

    if (targetNodes && targetNodes.length > 0) {
        /*--- Found target node(s).  Go through each and act if they
            are new.
        */
        targetNodes.each(function () {
            var jThis = $(this);
            var alreadyFound = jThis.data('alreadyFound') || false;

            if (!alreadyFound) {
                //--- Call the payload function.
                actionFunction(jThis);
                jThis.data('alreadyFound', true);
            }
        });
        btargetsFound = true;
    }
    else {
        btargetsFound = false;
    }

    //--- Get the timer-control variable for this selector.
    var controlObj = waitForKeyElements.controlObj || {};
    var controlKey = selectorTxt.replace(/[^\w]/g, "_");
    var timeControl = controlObj[controlKey];

    //--- Now set or clear the timer as appropriate.
    if (btargetsFound && bWaitOnce && timeControl) {
        //--- The only condition where we need to clear the timer.
        clearInterval(timeControl);
        delete controlObj[controlKey]
    }
    else {
        //--- Set a timer, if needed.
        if (!timeControl) {
            timeControl = setInterval(function () {
                waitForKeyElements(selectorTxt,
                    actionFunction,
                    bWaitOnce,
                    iframeSelector
                );
            },
                500
            );
            controlObj[controlKey] = timeControl;
        }
    }
    waitForKeyElements.controlObj = controlObj;
}

// Main entry point
waitForKeyElements("input[name='data']", createGenerateButton);
