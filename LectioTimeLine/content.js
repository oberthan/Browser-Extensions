// Function to replace the HR elements
function replaceHRElements() {
    const hrElements = document.querySelectorAll('hr.s2SkemaDivider');
    hrElements.forEach(hr => {
        hr.style.top = mapTimeToRange(hr) + 'em';
        hr.style.setProperty('color', 'red');
        hr.color = 'red';
        hr.style.setProperty('z-index', '1');

    });
    ChangeLooks();
    replaceSkemaElements();

}

function changeSkemabrikker() {
    const skemaBrikker = document.querySelectorAll('div.s2skemabrikInnerContainer');
    skemaBrikker.forEach(div => {

        const klasseHold = div.querySelector('div.s2skemabrikcontent').querySelector('span').textContent.split(' ');
        const hold = klasseHold.length > 1 ? klasseHold[1] : klasseHold[0];
        let randomColor = generateRandomColor(hold);

        chrome.storage.local.get(null, (data) => {
            // Get the colorList element from popup.html
            let inList = false;
            for (const [seed, color] of Object.entries(data)) {

                if (seed === hold) {
                    inList = true;
                    randomColor = color;
                }
            }

            if (inList) {


            } else {
                chrome.runtime.sendMessage({type: 'saveColor', seed: hold, color: randomColor});
                chrome.runtime.sendMessage({type: 'isColorChanged', seed: seed + '_', changed: false});
            }


            div.style.setProperty('background-color', randomColor);
            div.querySelector('div.s2skemabrikcontent').style.setProperty('color', generateContrastColor(randomColor))

            const A = div.parentElement;
            A.style.setProperty('box-shadow', 'rgba(0, 0, 0, 1) 0px 0px 5px 0px');
            A.style.setProperty('border-radius', '5px');
            A.style.setProperty('transform', 'translateY(1px)');
            A.style.setProperty('transition', '0.1s');
            A.setAttribute('onmouseover', "this.style.scale='1.1'");
            A.setAttribute('onmouseout', "this.style.scale='1'");
            A.style.setProperty('border-left', 'solid 2px #ffffff00');

            if (A.classList.contains('s2cancelled')) {
                div.style.setProperty('box-shadow', 'inset rgba(100, 0, 0, 0.5) 0px 0px 15px 10px');
                A.style.setProperty('box-shadow', 'rgba(0, 0, 0, 1) 0px 0px 0px 0px');
                A.style.setProperty('border-left', 'solid 5px #ff1d00');
            }
            if (A.classList.contains('s2changed')) {
                A.style.setProperty('border-left', 'solid 5px #00ff00');
            }
        });


    });
}

function findNReplaceWeek(skemaTabel, dayOfMonth, month) {
    const dateColumns = skemaTabel.children[0].children[1].children;
    for (var i = 1; i < dateColumns.length; i++) {
        var indhold = dateColumns[i].textContent;

        indhold = indhold.split('(')[1];
        indhold = indhold.split(')')[0];
        indhold = indhold.split('/');

        var colDay = indhold[0];
        var colMonth = indhold[1];

        if (colDay === `${dayOfMonth}` && colMonth === `${month}`) {
            const SkemaKolonner = skemaTabel.querySelector('tbody').querySelectorAll('tr')[3].querySelectorAll('td')

            const SkemaKolonne = SkemaKolonner[i];
            SkemaKolonne.style.setProperty('border-color', 'crimson');
            SkemaKolonne.style.setProperty('border-width', '3px');
            SkemaKolonne.querySelector('hr').style.setProperty('z-index', '0');
            SkemaKolonne.querySelector('div.s2skemabrikcontainer').style.setProperty('background-color', 'coral');

        }

    }
}

async function extracted() {
    let mainContentContainer = document.querySelector('.ls-content-container');
    let unbookedContainer = document.createElement('div');
    mainContentContainer.insertBefore(unbookedContainer, mainContentContainer.children[1]);
    let header = document.createElement('h3');
    unbookedContainer.appendChild(header);
    header.innerText = "Lokaler der ikke er booket:";
    let searching = document.createElement('h4');
    searching.innerText = 'Søger efter lokaler...';
    unbookedContainer.appendChild(searching);


    console.log('Added the Unbooked Container');

    let listOfRooms = document.getElementsByClassName('ls-columnlist mod-onechild')[0].childNodes;

    for (const room of listOfRooms) {
        if (room.nodeType !== 1) continue;
        const a = room.querySelector('a');
        const link = a.getAttribute('href');
        const number = a.querySelector('.findskema-symbol').innerText;

        if (number.charAt(0) < '0' || number.charAt(0) > '9') continue;

        let isBooked = false;
        await scrapeWebsite(link).then(doc => {

            doc.querySelectorAll('.s2brik').forEach(el => {
                const tooltip = el.getAttribute('data-tooltip');

                // 2. Extract the date/time string (e.g., "20/1-2026 14:30 til 15:30")
                const timeMatch = tooltip.match(/(\d{1,2}\/\d{1,2}-\d{4})\s(\d{2}:\d{2})\stil\s(\d{2}:\d{2})/);

                if (timeMatch) {
                    const [_, dateStr, startTime, endTime] = timeMatch;

                    // 3. Convert Lectio format (DD/MM-YYYY) to standard JS format (YYYY-MM-DD)
                    const [day, month, year] = dateStr.split(/[\/-]/);
                    const startStr = `${year}-${month}-${day} ${startTime}:00`
                    const start = new Date(startStr);
                    const end = new Date(`${year}-${month}-${day} ${endTime}`);
                    const now = new Date();

                    // 4. Compare
                    if (now >= start && now <= end) {
                        isBooked = true;
                        //console.log(timeMatch);
                        console.log(`Status: You should be in this class ${number} right now.`);
                    } else if (now < start) {
                        //console.log(`Status: This class starts in the future (at ${startTime} on ${dateStr}).`);
                    } else {
                        //console.log("Status: This class has already ended.");
                    }
                }
            });
        }).then(_ => {
            if (!isBooked) {
                let element = document.createElement('p');
                unbookedContainer.appendChild(element);
                element.textContent = number;
            }
        });

    }
    console.log("Done?");
    searching.remove()
}

function replaceSkemaElements() {
    changeSkemabrikker();

    const now = new Date();

    const dayOfMonth = now.getDate();
    const month = now.getMonth() + 1;
    const skemaTabel = document.getElementById('s_m_Content_Content_SkemaMedNavigation_skema_skematabel')
    if (skemaTabel) {
        findNReplaceWeek(skemaTabel, dayOfMonth, month);

        //Set the background of the tabel to half-transparent
        const moduleBgs = skemaTabel.querySelectorAll('div.s2module-bg')
        moduleBgs.forEach(Bg => {
            Bg.style.setProperty('background-color', 'rgba(256, 256, 256, 0.5)');
        });
    }


    if (window.location.href.split('/')[5].split('.')[0] === 'beskeder2') {
        var ting = document.querySelector('span.aspNetDisabled');
        var checkBox = document.createElement('input');
        checkBox.type = 'checkbox';
        checkBox.id = 'spoergCheckBox';

        var spoergLabel = document.createElement('label');
        spoergLabel.textContent = 'Filtrer Spørgeskemaer';
    }

    if (window.location.href.split('/')[5] === 'aktivitet') {
        const hold = document.querySelector('a.s2skemabrik').children[0].children[0].children[0].innerText;

        const PrintAktivititetArea = document.getElementById('PrintAktivititetArea');
        PrintAktivititetArea.style.setProperty('max-width', '1270px')

        console.log(hold);
        findDocumentlistIdFromTeam(hold).then(holdDocId => {
            console.log("Resultat fra funktionskaldet er " + holdDocId);

            const currentUrl = window.location.href;
            // Split the URL by '/'
            const parts = currentUrl.split('/');
            // Get the first three parts and join them back together

            const urlSuffix = holdDocId ? `?folderid=${holdDocId}` : '';
            const modifiedUrl = parts.slice(0, 5).join('/') + '/DokumentOversigt.aspx' + urlSuffix;

            const sideList = document.querySelectorAll('ul.ls-toc-side-list')[0];

            const documentElement = document.createElement('li');

            const aHref = document.createElement('a');
            aHref.href = modifiedUrl;
            aHref.style.setProperty('vertical-align', 'middle');
            const textSuffix = holdDocId ? ' (' + hold + ')' : '';
            aHref.textContent = `Dokumenter${textSuffix}`;

            const template = document.createElement('template');
            template.innerHTML = '<img alt="" src="/lectio/img/doc.gif" class="noborder">';
            const result = template.content.children;
            const div1 = document.createElement('div');
            const div2 = document.createElement('div');
            div1.appendChild(result[0]);
            div2.appendChild(aHref);

            documentElement.appendChild(div1);
            documentElement.appendChild(div2);
            sideList.appendChild(documentElement);

            const contentParent = document.querySelector('div.ls-texteditor-paper-container');
            contentParent.style.setProperty('display', 'flex');
            const documentsContent = document.createElement('div');
            documentsContent.classList.add('ls-paper');
            documentsContent.style.setProperty('margin-left', '20px');
            documentsContent.style.setProperty('width', '25%');
            documentsContent.style.setProperty('padding', '10px');
            documentsContent.style.setProperty('position', 'relative');
            contentParent.appendChild(documentsContent);

            const overskrift = document.createElement('a');
            documentsContent.appendChild(overskrift);

            overskrift.textContent = 'Dokumenter';
            overskrift.style.fontSize = '22px';
            overskrift.style.marginBottom = '15px';

            const listDocs = document.createElement('ul');
            listDocs.style.marginTop = '10px';
            listDocs.id = 'list-for-documents';
            const upperList = document.createElement('div');
            upperList.style.overflowY = 'auto';
            upperList.style.overflowX = 'hidden';
            upperList.style.maxHeight = '65%';

            upperList.appendChild(listDocs);
            documentsContent.appendChild(upperList);

            const divideLine = document.createElement('hr');
            divideLine.style.bottom = '30%';
            divideLine.style.position = 'absolute';
            divideLine.style.width = '90%';
            documentsContent.appendChild(divideLine);

            const lowerList = document.createElement('div');
            lowerList.style.overflow = 'auto';
            lowerList.style.bottom = '0';
            lowerList.style.position = 'absolute';
            lowerList.style.height = '30%';
            lowerList.style.width = '95%';
            documentsContent.appendChild(lowerList);
            DrawDocumentsFromUrl(modifiedUrl);


            const lowerUL = document.createElement('ul')
            lowerList.appendChild(lowerUL);
            scrapeWebsite(modifiedUrl).then(doc => {
                const holdFolder = doc.querySelector(`[lec-node-id="${holdDocId}"]`);
                if (holdFolder) {
                    const viewContainers = holdFolder.querySelectorAll('[lec-role="treeviewnodecontainer"]');


                    const stNodeContainer = holdFolder.children[0];
                    const stNode = stNodeContainer.querySelector('a.TreeNode');
                    stNode.style.setProperty('display', 'flex');

                    // node.href = `javascript:DrawDocumentsFromUrl("${parts.slice(0, 5).join('/') + '/DokumentOversigt.aspx?folderid=' + Container.attributes.getNamedItem('lec-node-id').value} ")`;
                    stNode.href = '#';
                    stNode.addEventListener('click', function (event) {
                        event.preventDefault();
                        DrawDocumentsFromUrl(`${parts.slice(0, 5).join('/') + '/DokumentOversigt.aspx?folderid=' + holdFolder.attributes.getNamedItem('lec-node-id').value}`)
                    });
                    const liE1 = document.createElement('li');
                    liE1.appendChild(stNode);
                    lowerUL.appendChild(liE1);

                    viewContainers.forEach(Container => {
                        const nodeContainer = Container.children[0];
                        const node = nodeContainer.querySelector('a.TreeNode');
                        node.style.setProperty('display', 'flex');

                        // node.href = `javascript:DrawDocumentsFromUrl("${parts.slice(0, 5).join('/') + '/DokumentOversigt.aspx?folderid=' + Container.attributes.getNamedItem('lec-node-id').value} ")`;
                        node.href = '#';
                        node.addEventListener('click', function (event) {
                            event.preventDefault();
                            DrawDocumentsFromUrl(`${parts.slice(0, 5).join('/') + '/DokumentOversigt.aspx?folderid=' + Container.attributes.getNamedItem('lec-node-id').value}`)
                        });

                        node.style.setProperty('margin-bottom', 'auto');
                        const chevron = nodeContainer.querySelector('img.TreeNode-chevron');
                        if (chevron) {

                            const liE = document.createElement('li');
                            const hDiv = document.createElement('div');
                            liE.appendChild(hDiv);
                            hDiv.style.display = 'flex';

                            lowerUL.appendChild(liE);
                            hDiv.appendChild(chevron);
                            hDiv.appendChild(node);
                        } else {
                            lowerUL.appendChild(node);

                        }

                    });
                }
            });

        });

        var something = document.getElementById('s_m_Content_Content_tocAndToolbar_outerContentContainer');
        var iframe = document.createElement('iframe');

        downloadDoc = fetch('https://www.lectio.dk/lectio/681/lc/65068616345/res/65068633086').then(x => iframe.src = x.response, console.log(x));

        something.appendChild(iframe);


    }
    if (window.location.href.split('/')[5].split('.')[0] === 'FindSkema') {
        extracted();

    }

}

function DrawDocumentsFromUrl(url) {

    console.log("Drawing Documents on list");
    const listDocs = document.getElementById('list-for-documents');
    const childsOfList = listDocs.childNodes;
    const listLength = childsOfList.length;
    for (let i = 0; i < listLength; i++) {
        listDocs.removeChild(childsOfList[0]);
    }

    scrapeWebsite(url).then(doc => {
        console.log(doc);
        const docGridView = doc.getElementById('s_m_Content_Content_DocumentGridView_ctl00');
        if (docGridView) {
            const docContainer = docGridView.children
            if (docContainer) {
                const documents = docContainer[0].children;
                if (documents) {
                    // documents = documents.slice(1);

                    for (let i = 1; i < documents.length; i++) {
                        const listItem = document.createElement('li');
                        const listText = document.createElement('a');
                        listItem.appendChild(listText);
                        listDocs.appendChild(listItem);

                        if (i < documents.length - 1) {
                            const divider = document.createElement('hr');
                            listDocs.appendChild(divider);
                        }
                        const link = documents[i].children[1].children[0].href;
                        const text = documents[i].children[1].children[0].textContent;

                        listText.href = link;
                        listText.textContent = text;
                        listItem.style.marginBottom = '5px';

                    }

                }
            }
        }
    });

}

function generateRandomColor(seed) {
    // Ensure seed is a string
    seed = seed.toString();

    // Initialize hash value
    let hash = 0;

    // Generate hash from seed
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Function to generate random number based on hash
    const random = function () {
        const x = Math.sin(hash++) * 10000;
        return x - Math.floor(x);
    };

    // Generate random color components
    const r = Math.floor(random() * 255);
    const g = Math.floor(random() * 255);
    const b = Math.floor(random() * 255);

    // Construct CSS color string
    const color = `rgb(${r}, ${g}, ${b})`;

    return color;
}

function invertColor(rgbColor) {
    // Parse the RGB color string to extract individual color components
    const regex = /rgb\((\d+), (\d+), (\d+)\)/;
    const match = rgbColor.match(regex);

    // Check if the color string matches the expected format
    if (match) {
        // Extract color components (red, green, blue)
        const red = parseInt(match[1]);
        const green = parseInt(match[2]);
        const blue = parseInt(match[3]);

        // Calculate inverted color components
        const invertedRed = 255 - red;
        const invertedGreen = 255 - green;
        const invertedBlue = 255 - blue;

        // Construct and return the inverted color string in RGB format
        return `rgb(${invertedRed}, ${invertedGreen}, ${invertedBlue})`;
    }
}

function generateContrastColor(rgbColor) {
    // Parse the RGB color string to extract individual color components
    const regex = /rgb\((\d+), (\d+), (\d+)\)/;
    const match = rgbColor.match(regex);

    // Check if the color string matches the expected format
    if (match) {
        // Extract color components (red, green, blue)
        const red = parseInt(match[1]);
        const green = parseInt(match[2]);
        const blue = parseInt(match[3]);

        // Calculate relative luminance
        const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;

        // Determine the appropriate text color based on luminance
        const textColor = luminance > 0.5 ? 'black' : 'white';

        return textColor;

    } else {
        // If the input color format is invalid, return null
        return null;
    }
}

function mapTimeToRange(hrElement) {
    // Get the current time
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Convert time to decimal format (e.g., 8:15 -> 8.25, 15:30 -> 15.5)
    let currentTime = hours + minutes / 60;

    var masterContainer = hrElement.parentElement.parentElement.parentElement;
    var moduleInfos = masterContainer.children[0].children[0].querySelectorAll('div.s2module-info');
    var firstTime = moduleInfos[0].children[0].textContent.split('modul')[1].split(' ')[0];
    var firstDist = moduleInfos[0].style.top;
    var secondTime = moduleInfos[4].children[0].textContent.split('modul')[1].split(' ')[0];
    var secondDist = moduleInfos[4].style.top;

    // Define the time range and corresponding mapped values
    const startTime = Number(firstTime.split(':')[0]) + (Number(firstTime.split(':')[1]) / 60); // 8:15 in decimal format
    const endTime = Number(secondTime.split(':')[0]) + (Number(firstTime.split(':')[1]) / 60); // 15:30 in decimal format
    const minValue = Number(firstDist.split('em')[0]);
    const maxValue = Number(secondDist.split('em')[0]);

    // Check if the current time is within the specified range
    // currentTime = Math.max(currentTime, startTime);
    // currentTime = Math.min(currentTime, endTime);
    // Map the current time to the specified range
    var mappedValue = minValue + ((currentTime - startTime) / (endTime - startTime)) * (maxValue - minValue);
    mappedValue = Math.max(mappedValue, 0);

    var colHeight = masterContainer.children[0].height.split('em')[0];
    mappedValue = Math.min(mappedValue, colHeight);

    return mappedValue.toFixed(3); // Round to 3 decimal places

}

async function scrapeWebsite(url) {
    try {
        // Fetch HTML content from the specified URL
        const response = await fetch(url);
        const html = await response.text();

        // Parse the HTML string into a DOM document
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract data from the DOM document
        const data = {};

        // Example: Get text content of all <h1> elements
        // const holdFolder = doc.getElementById("s_m_Content_Content_FolderTreeView").querySelectorAll("div")[2];


        // Return the extracted data

        return doc;
    } catch (error) {
        // Handle errors
        console.error('Error scraping website:', error);
        return null;
    }
}

async function findDocumentlistIdFromTeam(team) {

    try {
        const currentUrl = window.location.href;

        // Split the URL by '/'
        const parts = currentUrl.split('/');

        // Get the first three parts and join them back together
        const modifiedUrl = parts.slice(0, 5).join('/');
        const doc = await scrapeWebsite(modifiedUrl + '/DokumentOversigt.aspx');
        const holdFolder = doc.getElementById("s_m_Content_Content_FolderTreeView").children[2];
        const holdList = holdFolder.children[1].children;
        const holdet = Array.from(holdList, item => item).filter(function (hold) {
            return hold.querySelector('div.TreeNode-title').textContent == team;
        });
        // const holdet = holdList.filter(function(hold) {
        //   return hold.querySelector('div.TreeNode-title').textContent == team;
        // });

        if (holdet.length > 0) {
            const holdDocId = holdet[0].attributes.getNamedItem('lec-node-id').value;

            return holdDocId;
        }

    } catch (error) {
        console.error('Error scraping website:', error);
        return null;
    }
}

function ChangeLooks() {

    chrome.storage.local.get(null, (data) => {
        // Get the colorList element from popup.html
        if (data['darkTheme_'] === true) {

            ChangePropertyByClass('H1, .h1', 'color', 'white', true);
            ChangePropertyByClass('H2, .h2', 'color', 'white', true);
            ChangePropertyByClass('H3, .h3', 'color', 'white', true);

            ChangePropertyByClass('masterbody', 'background-color', '#4b4b4b');

            ChangePropertyByClass('ls-master-container1', 'background-color', 'transparent');

            ChangePropertyByClass('.buttonlink a', 'color', '#7fbeff', true);
            ChangePropertyByClass('.ls-subnav-active a', 'color', '#ff1100', true);

            ChangePropertyByClass('A[href]', 'color', '#2992ff', true);
            ChangePropertyByClass('tooltip', 'color', '#2992ff');

            ChangePropertyByClass('maintitle', 'color', 'white');

            if (window.location.href.split('/')[5] === 'aktivitet') {
                ChangePropertyByClass('ls-std-inline-block', 'color', 'white');
            } else {
                ChangePropertyByClass('ls-content', 'color', 'white');
            }

            ChangePropertyByClass('islandContent', 'background-color', '#3d3d3d')
            ChangePropertyByClass('island', 'border', 'none');
            ChangePropertyByClass('island', 'box-shadow', '0.2em 0.2em 1em rgba(0, 0, 0, 0.5)');

            ChangePropertyByClass('s2skema', 'background-color', 'transparent');

            ChangePropertyByClass('s2skemabrikcontainer', 'background-color', 'transparent');

            ChangePropertyByClass('s2infoHeader', 'background-color', '#ffcc001c');
            ChangePropertyByClass('s2infoHeader', 'color', 'white');

            ChangePropertyByClass('s2module-info', 'color', 'white');

            ChangePropertyByClass('.separationCell, .separationCell TD, .separationCell TH', 'background-color', 'transparent', true);
            ChangePropertyByClass('ls-table-layout1', 'background-color', 'transparent');


            ChangePropertyByClass('ls-questionnaire-question', 'background-color', '#2c2c2c');

            // ChangePropertyByClass('s2skema', 'border', 'none');

            ChangePropertyByClass('.s2skema TD, .s2skema TH', 'border', 'none', true)

            if (window.location.href.split('/')[5].split('.')[0] === 'SkemaNy') {

                var weekHeader = document.querySelector('tr.s2weekHeader').children[0];
                weekHeader.style.setProperty('border-top-right-radius', '10px');
                weekHeader.style.setProperty('border-top-left-radius', '10px');
                replaceSkemaElements();
            }


        }
    });

}

function ChangePropertyByClass(targetClass, property, value, query = false) {
    if (query) {
        var element = document.querySelectorAll(targetClass);
    } else {
        var element = document.getElementsByClassName(targetClass);
    }
    // Loop through each element and change its CSS properties
    for (var i = 0; i < element.length; i++) {
        element[i].style.setProperty(property, value);
    }
}

// Run the function when the DOM is loaded

replaceHRElements();

if (window.location.href.split('/')[5].split('.')[0] === 'SkemaNy') {
    setInterval(replaceHRElements, 60000);
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === "updateColors") {
        console.log('Content.js recieved message.')
        replaceHRElements(); // Call the function defined in content.js
    }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === 'GetCurrentUrl') {
        return document.location.href;
    }
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === "updateTheme") {

        chrome.storage.local.get(null, (data) => {
            // Get the colorList element from popup.html
            if (data['darkTheme_'] === true) {


                ChangeLooks(); // Call the function defined in content.js

            } else {
                window.location.reload();
            }
        });
    }
});
