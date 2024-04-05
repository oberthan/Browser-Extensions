// Function to replace the HR elements
function replaceHRElements() {
  const hrElements = document.querySelectorAll('hr.s2SkemaDivider');
  hrElements.forEach(hr => {
    hr.style.top = mapTimeToRange() + 'em';
    hr.style.setProperty('color', 'red');
    hr.color = 'red';
    hr.style.setProperty('z-index', '1');
    console.log("Changed an element.");
  });
  replaceSkemaElements();
}
function replaceSkemaElements() {

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

      if (inList){

        console.log("Farve findes i forvejen.")
      } else {
        chrome.runtime.sendMessage({ type: 'saveColor', seed: hold, color: randomColor });
        console.log("Farve findes ikke og er derfor blevet gemt.")
      }

     
      div.style.setProperty('background-color', randomColor);
      div.querySelector('div.s2skemabrikcontent').style.setProperty('color', generateContrastColor(randomColor))
      console.log("Changed an color with seed " + hold);
      const A = div.parentElement;
      A.style.setProperty('box-shadow', 'rgba(0, 0, 0, 1) 0px 0px 5px 0px');
      A.style.setProperty('border-radius', '5px');
      A.style.setProperty('transform', 'translateY(1px)');

      if (A.classList.contains('s2cancelled')){
        div.style.setProperty('box-shadow','inset rgba(100, 0, 0, 0.5) 0px 0px 15px 10px');
        A.style.setProperty('box-shadow', 'rgba(0, 0, 0, 1) 0px 0px 0px 0px');
        A.style.setProperty('border-left', 'solid 5px #ff1d00');
      }
    });




  });

  const now = new Date();
  const day = now.getDay();
  const skemaTabel = document.getElementById('s_m_Content_Content_SkemaMedNavigation_skema_skematabel')
  if (skemaTabel){
  const SkemaKolonne = skemaTabel.querySelector('tbody').querySelectorAll('tr')[3].querySelectorAll('td')[day];
  SkemaKolonne.style.setProperty('border-color', 'crimson');
  SkemaKolonne.style.setProperty('border-width', '3px');
  SkemaKolonne.querySelector('hr').style.setProperty('z-index', '0');
  SkemaKolonne.querySelector('div.s2skemabrikcontainer').style.setProperty('background-color', 'coral');
  }

  const moduleBgs = skemaTabel.querySelectorAll('div.s2module-bg')
  moduleBgs.forEach(Bg => {
    Bg.style.setProperty('background-color', 'rgba(256, 256, 256, 0.5)');
  })
  
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
  const random = function() {
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

function mapTimeToRange() {
  // Get the current time
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Convert time to decimal format (e.g., 8:15 -> 8.25, 15:30 -> 15.5)
  let currentTime = hours + minutes / 60;

  // Define the time range and corresponding mapped values
  const startTime = 8; // 8:15 in decimal format
  const endTime = 16.583; // 15:30 in decimal format
  const minValue = 0;
  const maxValue = 32.727;

  // Check if the current time is within the specified range
  currentTime = Math.max(currentTime, startTime);
  currentTime = Math.min(currentTime, endTime);
  // Map the current time to the specified range
  const mappedValue = minValue + ((currentTime - startTime) / (endTime - startTime)) * (maxValue - minValue);
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
      const holdFolder = doc.getElementById("s_m_Content_Content_FolderTreeView").querySelectorAll("div")[2]
      

      // Return the extracted data
      return doc;
  } catch (error) {
      // Handle errors
      console.error('Error scraping website:', error);
      return null;
  }
}



// Run the function when the DOM is loaded

replaceHRElements();


setInterval(replaceHRElements, 60000);
