const amountDropdown = document.getElementById("amount-history-dropdown");
const amountInput = document.getElementById("amount");
const rateText = document.getElementById("exchange-rate");
const finalAmountText = document.getElementById("final-amount");
const convertBtn = document.getElementById("convert-btn");
const swapIcon = document.querySelector(".exchange-icon");
const updateTimeText = document.getElementById("update-time");
const copyBtn = document.getElementById("copy-btn");

const fromDropdown = document.getElementById("from-dropdown");
const toDropdown = document.getElementById("to-dropdown");
const fromSelectBox = fromDropdown.querySelector(".select-box");
const toSelectBox = toDropdown.querySelector(".select-box");
const fromText = document.getElementById("from-text");
const toText = document.getElementById("to-text");
const fromFlag = document.getElementById("from-flag");
const toFlag = document.getElementById("to-flag");
const fromOptions = document.getElementById("from-options");
const toOptions = document.getElementById("to-options");
const fromSearch = document.getElementById("from-search");
const toSearch = document.getElementById("to-search");

const chartSection = document.getElementById("chart-section");
const viewChartBtn = document.getElementById("view-chart-btn");
const chartTooltip = document.getElementById("chart-tooltip");
const tooltipRate = document.getElementById("tooltip-rate");
const tooltipDate = document.getElementById("tooltip-date");
const tabBtns = document.querySelectorAll(".tab-btn");

let myChart = null;
let activePeriod = "1d"; // Default chart tab
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

let savedFrom = localStorage.getItem("savedFrom") || "USD";
let savedTo = localStorage.getItem("savedTo") || "INR";

// ==========================================
// 2. UI & DROPDOWN LOGIC
// ==========================================
const updateUI = (type, currCode) => {
  let countryCode = countryList[currCode] || "US";
  if (type === "from") {
    savedFrom = currCode;
    localStorage.setItem("savedFrom", currCode);
    fromText.innerText = currCode;
    fromFlag.src = `https://flagcdn.com/48x36/${countryCode.toLowerCase()}.png`;
  } else {
    savedTo = currCode;
    localStorage.setItem("savedTo", currCode);
    toText.innerText = currCode;
    toFlag.src = `https://flagcdn.com/48x36/${countryCode.toLowerCase()}.png`;
  }
};

// --- POPULATE OPTIONS (UPDATED FORMAT) ---
const populateOptions = (ulElement, type) => {
  ulElement.innerHTML = "";
  for (let currCode in countryList) {
    let countryCode = countryList[currCode];
    let countryName = currCode;
    try {
      countryName = regionNames.of(countryCode);
    } catch (e) {}

    let li = document.createElement("li");

    // FIX: Currency Code pehle, phir dash (-), phir Country Name
    li.innerHTML = `<img src="https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png" style="width: 20px;"> <strong>${currCode}</strong> <span style="color: #8892b0; margin-left: 5px; font-size: 0.9em;">- ${countryName}</span>`;

    li.dataset.search = `${countryName.toLowerCase()} ${currCode.toLowerCase()}`;

    li.addEventListener("click", () => {
      updateUI(type, currCode);
      fromDropdown.classList.remove("active");
      toDropdown.classList.remove("active");
      getExchangeRate();
      if (chartSection.classList.contains("show")) renderChart(activePeriod);
    });
    ulElement.appendChild(li);
  }
};

const filterList = (query, ulElement) => {
  let lis = ulElement.querySelectorAll("li");
  lis.forEach((li) => {
    li.style.display = li.dataset.search.includes(query) ? "flex" : "none";
  });
};

fromSearch.addEventListener("keyup", (e) => {
  filterList(e.target.value.toLowerCase(), fromOptions);
  if (e.key === "Enter") {
    let first = Array.from(fromOptions.querySelectorAll("li")).find(
      (li) => li.style.display !== "none",
    );
    if (first) first.click();
  }
});

toSearch.addEventListener("keyup", (e) => {
  filterList(e.target.value.toLowerCase(), toOptions);
  if (e.key === "Enter") {
    let first = Array.from(toOptions.querySelectorAll("li")).find(
      (li) => li.style.display !== "none",
    );
    if (first) first.click();
  }
});

fromSelectBox.addEventListener("click", (e) => {
  e.stopPropagation();
  fromDropdown.classList.toggle("active");
  toDropdown.classList.remove("active");
  fromSearch.value = "";
  filterList("", fromOptions);
  if (fromDropdown.classList.contains("active")) fromSearch.focus();
});

toSelectBox.addEventListener("click", (e) => {
  e.stopPropagation();
  toDropdown.classList.toggle("active");
  fromDropdown.classList.remove("active");
  toSearch.value = "";
  filterList("", toOptions);
  if (toDropdown.classList.contains("active")) toSearch.focus();
});

// Click outside to close Dropdowns and Chart
// --- GLOBAL CLICK LISTENER: Ab sirf Dropdowns ko band karega ---
document.addEventListener("click", (e) => {
  // Sirf From aur To dropdowns ko band karne ka logic rakha hai
  if (!fromDropdown.contains(e.target)) {
    fromDropdown.classList.remove("active");
  }
  if (!toDropdown.contains(e.target)) {
    toDropdown.classList.remove("active");
  }

  // CHART wala "Click Outside to Close" logic yahan se HATA diya gaya hai.
  // Ab chart tabhi band hoga jab aap "Hide Chart" button par click karenge.
});

// ==========================================
// 3. MAIN CONVERSION LOGIC
// ==========================================
// --- MAIN CONVERSION LOGIC (WITH SKELETON LOADER) ---
const getExchangeRate = async () => {
  let amountVal = amountInput.value;
  if (amountVal === "" || amountVal <= 0) {
    amountVal = 1;
  }

  // 1. LOADER CHALU KAREIN (Puraana text hatakar skeleton class lagayein)
  rateText.innerText = " ";
  finalAmountText.innerText = " ";
  updateTimeText.innerText = " ";
  copyBtn.style.display = "none";

  // Skeleton classes add karna
  rateText.classList.add("skeleton", "skeleton-rate");
  finalAmountText.classList.add("skeleton", "skeleton-amount");
  updateTimeText.classList.add("skeleton", "skeleton-time");

  try {
    const URL = `https://currency-converter-pro-1.onrender.com/api/currency/rates/${savedFrom}`;
    let response = await fetch(URL);
    let data = await response.json();

    let rate = data.rates[savedTo];
    let finalAmount = (amountVal * rate).toFixed(2);

    let formatInputVal = new Intl.NumberFormat("en-IN").format(amountVal);
    let formatFinalVal = new Intl.NumberFormat("en-IN").format(finalAmount);

    // 2. DATA AANE KE BAAD LOADER BAND KAREIN
    rateText.classList.remove("skeleton", "skeleton-rate");
    finalAmountText.classList.remove("skeleton", "skeleton-amount");
    updateTimeText.classList.remove("skeleton", "skeleton-time");

    // Asli Data Dikhayein
    rateText.innerText = `1 ${savedFrom} = ${rate.toFixed(2)} ${savedTo}`;
    finalAmountText.innerText = `${formatInputVal} ${savedFrom} = ${formatFinalVal} ${savedTo}`;

    copyBtn.setAttribute("data-amount", finalAmount);
    copyBtn.style.display = "block";

    // --- NAYA CODE: KHAAI BOX HONE PAR DATABASE MEIN SAVE NAHI HOGA ---
    if (amountInput.value !== "") {
      const conversionData = {
        fromCurrency: savedFrom,
        toCurrency: savedTo,
        amount: parseFloat(amountVal),
        convertedAmount: parseFloat(finalAmount),
      };

      fetch("https://currency-converter-pro-1.onrender.com/api/currency/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(conversionData),
      })
        .then(() => fetchHistory()) // Data save hote hi history update
        .catch((error) => console.error("Error saving data:", error));
    }

    let dateObj = new Date(data.time_last_update_utc);
    updateTimeText.innerText = `${dateObj.toLocaleString("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "numeric" })} UTC`;
  } catch (error) {
    // Error aane par bhi skeleton hata do aur error message dikhao
    rateText.classList.remove("skeleton", "skeleton-rate");
    finalAmountText.classList.remove("skeleton", "skeleton-amount");
    updateTimeText.classList.remove("skeleton", "skeleton-time");

    rateText.innerText = "Error fetching data!";
    console.error(error);
  }
};

swapIcon.addEventListener("click", () => {
  let temp = savedFrom;
  updateUI("from", savedTo);
  updateUI("to", temp);
  getExchangeRate();
  if (chartSection.classList.contains("show")) renderChart(activePeriod);
});

// ==========================================
// KEYBOARD NAVIGATION & AUTO-SUGGEST LOGIC
// ==========================================
let currentFocus = -1; // Keyboard arrow kahan par hai, wo yaad rakhega

// TYPING KARTE WAQT SMART FILTER
amountInput.addEventListener("input", (e) => {
  currentFocus = -1; // Naya type karte hi keyboard selection reset ho jayega
  let typedValue = e.target.value.trim();

  amountDropdown.classList.add("active");
  amountInput.classList.add("active");

  if (typedValue === "") {
    renderDropdownSuggestions(globalHistoryData.slice(0, 5));
  } else {
    let filteredRecords = globalHistoryData.filter((record) =>
      String(record.amount).startsWith(typedValue),
    );
    renderDropdownSuggestions(filteredRecords.slice(0, 5));
  }
});

// KEYBOARD ARROWS & ENTER LOGIC
amountInput.addEventListener("keydown", (e) => {
  let items = amountDropdown.querySelectorAll(".history-item");

  if (e.key === "ArrowDown") {
    e.preventDefault(); // Input box ke andar cursor hilne se rokna
    currentFocus++;
    addActiveHighlight(items);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    currentFocus--;
    addActiveHighlight(items);
  } else if (e.key === "Enter") {
    e.preventDefault(); // Form submit hone ya page refresh hone se rokna

    // Agar dropdown khula hai aur keyboard se kuch select kiya hua hai
    if (currentFocus > -1 && amountDropdown.classList.contains("active")) {
      if (items[currentFocus]) items[currentFocus].click(); // Uspar JS ke through click karwa do
      currentFocus = -1; // Select hone ke baad reset
    }
    // Agar normally amount likh kar direct Enter dabaya hai
    else {
      handleConversion();
      amountDropdown.classList.remove("active");
      amountInput.classList.remove("active");
      amountInput.blur(); // Keyboard band karne ke liye (Mobile focus)
    }
  }
});

// Helper Functions: Keyboard ke arrows ko highlight karne ke liye
function addActiveHighlight(items) {
  if (!items || items.length === 0) return;

  // Pehle purani highlight hatao
  for (let i = 0; i < items.length; i++) {
    items[i].classList.remove("highlight");
  }

  // List ke end par pahuchne par wapas upar/neeche bhejna
  if (currentFocus >= items.length) currentFocus = 0;
  if (currentFocus < 0) currentFocus = items.length - 1;

  // Naye item ko highlight karo
  items[currentFocus].classList.add("highlight");

  // MAGIC: Agar list lambi hai, toh arrow press karne par list auto-scroll hogi
  items[currentFocus].scrollIntoView({ block: "nearest" });
}

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(copyBtn.getAttribute("data-amount"));
  copyBtn.classList.replace("fa-copy", "fa-check");
  copyBtn.style.color = "#64ffda";
  setTimeout(() => {
    copyBtn.classList.replace("fa-check", "fa-copy");
    copyBtn.style.color = "#a8b2d1";
  }, 1500);
});

// --- GOOGLE STYLE DOTTED LINE PLUGIN (SMOOTH FIX) ---
// --- GOOGLE STYLE DOTTED LINE PLUGIN (SMOOTH & Y-AXIS FIX) ---
// --- GOOGLE STYLE DOTTED LINE PLUGIN (PERFECT SYNC FIX) ---
const verticalLinePlugin = {
  id: "verticalLine",
  // Yahan se 'beforeEvent' hata diya gaya hai taaki mouse ki jagah data focus me rahe
  afterDraw: (chart) => {
    // Agar chart par koi data point active hai
    if (chart.tooltip?._active?.length) {
      const activePoint = chart.tooltip._active[0];

      // FIX: Dotted line aur Tooltip ko exact usi 'Dot' ki jagah par lock kar diya
      const x = activePoint.element.x;
      const y = activePoint.element.y;
      const yAxis = chart.scales.y;
      const ctx = chart.ctx;

      // Dotted line draw karna
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.moveTo(x, yAxis.top);
      ctx.lineTo(x, yAxis.bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#8892b0";
      ctx.stroke();
      ctx.restore();

      // Floating Label ko update karna
      chartTooltip.style.display = "block";
      chartTooltip.style.left = `${x}px`;
      chartTooltip.style.top = `${y + 45}px`;

      // Data show karna
      const index = activePoint.index;
      tooltipRate.innerText = chart.data.datasets[0].data[index];
      tooltipDate.innerText = chart.data.labels[index];
    } else {
      chartTooltip.style.display = "none"; // Mouse hatane par hide
    }
  },
};

// Fetch Historical Data from Frankfurter API (Smart Update)
const fetchHistoricalData = async (period) => {
  let endDate = new Date().toISOString().split("T")[0];
  let date = new Date();

  if (period === "1m") date.setMonth(date.getMonth() - 1);
  else if (period === "1y") date.setFullYear(date.getFullYear() - 1);
  else if (period === "5y") date.setFullYear(date.getFullYear() - 5);
  else if (period === "5d") date.setDate(date.getDate() - 5);
  else date.setDate(date.getDate() - 7);

  let startDate = date.toISOString().split("T")[0];

  // Frankfurter API sirf in 30+ currencies ko support karti hai
  const supportedCurrencies = [
    "AUD",
    "BGN",
    "BRL",
    "CAD",
    "CHF",
    "CNY",
    "CZK",
    "DKK",
    "EUR",
    "GBP",
    "HKD",
    "HUF",
    "IDR",
    "ILS",
    "INR",
    "ISK",
    "JPY",
    "KRW",
    "MXN",
    "MYR",
    "NOK",
    "NZD",
    "PHP",
    "PLN",
    "RON",
    "SEK",
    "SGD",
    "THB",
    "TRY",
    "USD",
    "ZAR",
  ];

  try {
    // Agar dono me se koi ek currency API me nahi hai, toh direct dummy data dikhao bina error ke
    if (
      !supportedCurrencies.includes(savedFrom) ||
      !supportedCurrencies.includes(savedTo)
    ) {
      throw new Error("Currency pair not supported by free API.");
    }

    const res = await fetch(
      `https://api.frankfurter.app/${startDate}..${endDate}?from=${savedFrom}&to=${savedTo}`,
    );

    // Agar server data na de paye
    if (!res.ok) throw new Error("API Limit or issue");

    const data = await res.json();
    const labels = Object.keys(data.rates).map((d) => {
      let dt = new Date(d);
      return dt.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: period.includes("y") ? "numeric" : undefined,
      });
    });
    const rates = Object.values(data.rates).map((val) => val[savedTo]);
    return { labels, rates };
  } catch (e) {
    // Bina laal error (CORS) generate kiye, chup-chaap Dummy Data bhej dega
    return {
      labels: ["05 Apr", "06 Apr", "07 Apr", "08 Apr", "09 Apr", "10 Apr"],
      rates: [92.1, 92.5, 93.1, 92.8, 93.24, 92.81],
    };
  }
};

const renderChart = async (period = "1d") => {
  const canvas = document.getElementById("historicalChart");
  const ctx = canvas.getContext("2d");
  if (myChart) myChart.destroy();

  const historicalData = await fetchHistoricalData(period);

  let gradient = ctx.createLinearGradient(0, 0, 0, 250);
  gradient.addColorStop(0, "rgba(100, 255, 218, 0.3)");
  gradient.addColorStop(1, "rgba(100, 255, 218, 0)");

  myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: historicalData.labels,
      datasets: [
        {
          data: historicalData.rates,
          borderColor: "#64ffda",
          backgroundColor: gradient,
          fill: true,
          borderWidth: 2,
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "#64ffda",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      // intersect: false ensures hover works anywhere on the chart vertically
      interaction: { mode: "index", intersect: false },
      scales: {
        x: {
          display: true, // Dates wapas dikhane ke liye
          grid: { display: false },
          ticks: { color: "#8892b0", font: { size: 9 }, maxRotation: 0 },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: {
            color: "#8892b0",
            font: { size: 9 },
            maxTicksLimit: 5, // FIX: Google ki tarah strictly 5 lines/numbers aayenge
          },
        },
      },
    },
    plugins: [verticalLinePlugin],
  });
};

tabBtns.forEach((btn) => {
  btn.addEventListener("click", async () => {
    document.querySelector(".tab-btn.active").classList.remove("active");
    btn.classList.add("active");
    activePeriod = btn.dataset.period;
    await renderChart(activePeriod);
  });
});

viewChartBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  chartSection.classList.toggle("show");
  if (chartSection.classList.contains("show")) {
    viewChartBtn.innerHTML = '<i class="fa-solid fa-angle-up"></i> Hide Chart';
    setTimeout(() => renderChart(activePeriod), 250);
  } else {
    viewChartBtn.innerHTML =
      '<i class="fa-solid fa-chart-line"></i> View 7-Day Trend';
    chartTooltip.style.display = "none";
  }
});

// ==========================================
// 5. INITIALIZE ON LOAD
// ==========================================
window.addEventListener("load", () => {
  populateOptions(fromOptions, "from");
  populateOptions(toOptions, "to");
  updateUI("from", savedFrom);
  updateUI("to", savedTo);
  getExchangeRate();
  fetchHistory();
});

// 1. Input par click karte hi dropdown aur input dono merge ho jayenge
amountInput.addEventListener("click", (e) => {
  e.stopPropagation();
  amountDropdown.classList.add("active");
  amountInput.classList.add("active"); // NAYA: Input ko active karo taaki border gayab ho
});

// 2. Screen par kahin bhi aur click karne par dropdown band
document.addEventListener("click", (e) => {
  if (!amountDropdown.contains(e.target) && e.target !== amountInput) {
    amountDropdown.classList.remove("active");
    amountInput.classList.remove("active"); // NAYA: Wapas normal gol input
  }
});

// ==========================================
// 6. FETCH HISTORY, AUTO-SUGGEST & DROPDOWN
// ==========================================
let globalHistoryData = []; // Database ki saari history memory me save rakhne ke liye

// SUGGESTION RENDER KARNE KA HELPER FUNCTION
const renderDropdownSuggestions = (records) => {
  if (!amountDropdown) return;
  amountDropdown.innerHTML = "";

  if (records.length === 0) {
    let div = document.createElement("div");
    div.classList.add("history-item");
    div.innerHTML = `<span style="color: #8892b0; font-style: italic;">No matching record found</span>`;
    amountDropdown.appendChild(div);
    return;
  }

  records.forEach((record) => {
    let div = document.createElement("div");
    div.classList.add("history-item");
    div.innerHTML = `<span>${record.amount} ${record.fromCurrency} ➔ ${record.toCurrency}</span>`;

    div.addEventListener("click", () => {
      amountInput.value = record.amount;
      amountDropdown.classList.remove("active");
      amountInput.classList.remove("active"); // Merge hatao

      amountInput.blur(); // NAYA: Mobile me keyboard turant band karne ke liye
      getExchangeRate(); // NAYA: Turant conversion function call kar do
    });

    amountDropdown.appendChild(div);
  });
};

// TYPING KARTE WAQT SMART FILTER (AUTO-SUGGEST)
amountInput.addEventListener("input", (e) => {
  let typedValue = e.target.value.trim();

  // Type karte waqt dropdown open aur merged color me rakho
  amountDropdown.classList.add("active");
  amountInput.classList.add("active");

  if (typedValue === "") {
    // Khali hone par default aakhiri 5 dikhao
    renderDropdownSuggestions(globalHistoryData.slice(0, 5));
  } else {
    // Jo type kiya hai, waisa same amount history me se dhundho (Filter)
    let filteredRecords = globalHistoryData.filter((record) =>
      String(record.amount).startsWith(typedValue),
    );
    // Matching wale max 5 dikhao
    renderDropdownSuggestions(filteredRecords.slice(0, 5));
  }
});

// MAIN FETCH FUNCTION
const historyList = document.getElementById("history-list");
const fetchHistory = async () => {
  try {
    let response = await fetch(
      "https://currency-converter-pro-1.onrender.com/api/currency/history",
    );
    let data = await response.json();

    if (historyList) historyList.innerHTML = "";

    if (data.length === 0) {
      if (historyList)
        historyList.innerHTML = `<li style="color: #8892b0; text-align: center; border: none; background: transparent;">No recent conversions.</li>`;
      return;
    }

    // Saara ulta data global array me save kar liya auto-suggest ke liye
    globalHistoryData = data.reverse();

    // --- 1. HISTORY LIST BHARNA (Neeche wale dabbe ke liye) ---
    if (historyList) {
      globalHistoryData.forEach((record) => {
        let li = document.createElement("li");
        let formattedAmount = new Intl.NumberFormat("en-IN").format(
          record.amount,
        );
        let formattedConverted = new Intl.NumberFormat("en-IN").format(
          record.convertedAmount,
        );
        let dateObj = new Date(record.timestamp);
        let timeString = `${dateObj.getHours()}:${String(dateObj.getMinutes()).padStart(2, "0")}`;

        li.innerHTML = `
            <span><strong>${formattedAmount} ${record.fromCurrency}</strong> = ${formattedConverted} ${record.toCurrency}</span>
            <span class="history-time">${timeString}</span>
        `;
        historyList.appendChild(li);
      });
    }

    // --- 2. STEP C: DROPDOWN BHARNA (Sirf Top 5 Default load ke liye) ---
    renderDropdownSuggestions(globalHistoryData.slice(0, 5));
  } catch (error) {
    console.error("History load error:", error);
  }
};

window.addEventListener("load", fetchHistory);

// ==========================================
// 9. SMART AI INPUT HANDLER (REAL BACKEND LINKED)
// ==========================================
const processAIQuery = async (queryText) => {
  // Loader dikhao
  rateText.innerText = " ";
  finalAmountText.innerText = " ";
  rateText.classList.add("skeleton", "skeleton-rate");
  finalAmountText.classList.add("skeleton", "skeleton-amount");
  copyBtn.style.display = "none";

  try {
    // 1. Apne Spring Boot backend ko text bhejo
    const response = await fetch(
      "https://currency-converter-pro-1.onrender.com/api/currency/smart-convert",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText }),
      },
    );

    const data = await response.json();

    // Loader hatao
    rateText.classList.remove("skeleton", "skeleton-rate");
    finalAmountText.classList.remove("skeleton", "skeleton-amount");

    if (data.error) {
      rateText.innerText = "AI could not understand. Try again.";
      return;
    }

    // 2. AI ke data se screen ke dropdowns aur box automatically set karo
    updateUI("from", data.from);
    updateUI("to", data.to);
    amountInput.value = data.amount; // Ensure karna tumhare input box ka id 'amount' hai, to yahan amountInput use ho

    // 3. Ab asli rate convert karne wala function chala do taaki wo history me add ho jaye
    getExchangeRate();
  } catch (error) {
    rateText.classList.remove("skeleton", "skeleton-rate");
    finalAmountText.classList.remove("skeleton", "skeleton-amount");
    rateText.innerText = "Error connecting to AI Backend";
    console.error(error);
  }
};

const handleConversion = () => {
  let val = amountInput.value.trim();
  // Check: Agar string me koi bhi letter (A-Z, a-z) hai
  if (/[a-zA-Z]/.test(val)) {
    processAIQuery(val); // Text hai toh AI function chalao
  } else {
    getExchangeRate(); // Sirf number hai toh purana function chalao
  }
};

// ==========================================
// 10. CONVERT BUTTON CLICK EVENT (Jo missing tha)
// ==========================================
convertBtn.addEventListener("click", (e) => {
  e.preventDefault();
  handleConversion(); // Naya function call kiya
  if (chartSection.classList.contains("show")) renderChart(activePeriod);
});

// Mic aur Input box ko pakdo
const micBtn = document.getElementById("micBtn");
const aiInputBox = document.getElementById("aiInputBox");

// Browser ka Speech API check karo
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = "en-IN"; // Indian English aur Hinglish achhe se pakadta hai

  micBtn.addEventListener("click", () => {
    recognition.start();
    micBtn.innerText = "🔴"; // Jab sun raha ho to laal dikhe
    aiInputBox.placeholder = "Listening...";
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    aiInputBox.value = transcript; // Jo bola wo text box me daal do
    micBtn.innerText = "🎤"; // Wapas normal mic ban jao

    // Yahan tera AI convert wala function automatic call karwa de
    // Example: processAIQuery(transcript);
    processAIQuery(transcript);
  };

  recognition.onerror = (event) => {
    console.error("Mic Error: ", event.error);
    micBtn.innerText = "🎤";
    aiInputBox.placeholder = "Error. Try again.";
  };
} else {
  micBtn.style.display = "none"; // Agar purana browser hai jisme mic nahi chalta, to button hide kar do
  console.log("Speech Recognition not supported in this browser.");
}
  