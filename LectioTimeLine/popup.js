// Retrieve stored data from Chrome's local storage
chrome.storage.local.get(null, (data) => {

  // Get the colorList element from popup.html
  const colorList = document.getElementById('colorList');
  const selectSeed = document.getElementById('selectSeed');

  // Iterate over the stored data
  for (const [seed, color] of Object.entries(data)) {
    // Create a list item for each seed-color pair

    if (seed.charAt(seed.length - 1) !== '_'){
    if (data[seed + '_']){
      const listItem = document.createElement('li');
      listItem.textContent = `Hold: ${seed}, Farve: ${color}`;
      listItem.style.backgroundColor = color;
      listItem.style.color = contrastTextColor(color);

      // Append the list item to the colorList
      colorList.appendChild(listItem);

    }
    const selectOption = document.createElement('option');
    selectOption.value = seed;
    selectOption.text = seed;

    selectSeed.appendChild(selectOption);
  }
  }

});

function saveSeedColor(){
    const color = document.getElementById('seedInput').value;
    const seed = document.getElementById('selectSeed').value;
    const fromHex = hexToRgb(color);
    const rgbString = 'rgb(' + fromHex.r + ', ' + fromHex.g + ', ' + fromHex.b + ')';
    console.log("Saving color " + rgbString + " with seed " + seed);
    chrome.runtime.sendMessage({ type: 'saveColor', seed: seed, color: rgbString });
    chrome.runtime.sendMessage({ type: 'isColorChanged', seed: seed + '_', changed: true});
    
    document.location.reload();
}
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

function contrastTextColor(rgbColor){
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

function ResetStorage(){
  chrome.storage.local.clear();
  document.location.reload();
}

document.getElementById('saveButton').addEventListener('click', saveSeedColor);
document.getElementById('resetButton').addEventListener('click', ResetStorage);
