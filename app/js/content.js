const endpoint = "http://127.0.0.1:5000/";
const descriptions = {
  "Sneaking": "Obscures information to coerce users into actions they wouldn't normally take.",
  "Urgency": "Creates artificial deadlines to make things appear more desirable.",
  "Misdirection": "Deceptively guides users towards one choice over another.",
  "Social Proof": "Gives the false impression that an action or product is approved by others.",
  "Scarcity": "Increases the perceived value of something by making it seem limited in availability.",
  "Obstruction": "Makes an action more difficult to discourage users from doing it.",
  "Forced Action": "Compels users to complete extra, unrelated tasks for a seemingly simple action.",
};

function scrape() {
  // Check if the website has already been analyzed
  if (document.getElementById("insite_count")) {
    return;
  }

  // Aggregate all DOM elements on the page
  let elements = segments(document.body);
  let filtered_elements = elements.map((element) => element.innerText.trim().replace(/\t/g, " ")).filter(Boolean);

  // Post to the web server
  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokens: filtered_elements }),
  })
    .then((resp) => resp.json())
    .then((data) => {
      data = data.replace(/'/g, '"');
      const json = JSON.parse(data);
      let dp_count = 0;

      for (let i = 0; i < elements.length; i++) {
        const text = elements[i].innerText.trim().replace(/\t/g, " ");

        if (text.length > 0 && json.result[i] !== "Not Dark") {
          highlight(elements[i], json.result[i]);
          dp_count++;
        }
      }

      // Store the number of dark patterns
      const insiteCount = document.createElement("div");
      insiteCount.id = "insite_count";
      insiteCount.value = dp_count;
      insiteCount.style.opacity = 0;
      insiteCount.style.position = "fixed";
      document.body.appendChild(insiteCount);

      sendDarkPatterns(dp_count);
    })
    .catch((error) => {
      alert(error);
      console.error(error.stack);
    });
}

function highlight(element, type) {
  element.classList.add("insite-highlight");

  const body = document.createElement("span");
  body.classList.add("insite-highlight-body");

  // Header
  const header = document.createElement("div");
  header.classList.add("modal-header");
  const headerText = document.createElement("h1");
  headerText.innerHTML = type + " Pattern";
  header.appendChild(headerText);
  body.appendChild(header);

  // Content
  const content = document.createElement("div");
  content.classList.add("modal-content");
  content.innerHTML = descriptions[type];
  body.appendChild(content);

  element.appendChild(body);
}

function sendDarkPatterns(number) {
  chrome.runtime.sendMessage({
    message: "update_current_count",
    count: number,
  });
}

// Event listener for messages from the background script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === "analyze_site") {
    scrape();
  } else if (request.message === "popup_open") {
    const insiteCountElement = document.getElementById("insite_count");
    if (insiteCountElement) {
      sendDarkPatterns(insiteCountElement.value);
    }
  }
});
