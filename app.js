const moods = {
    Happy: "😊",
    Sad: "😢",
    Excited: "🤩",
    Tired: "😴",
    Angry: "😠",
    Confused: "😕",
    Neutral: "😐"
  };
  
  const moodScores = {
    Happy: 5,
    Excited: 5,
    Neutral: 3,
    Confused: 2,
    Tired: 1,
    Sad: 1,
    Angry: 0
  };
  
  let moodHistory = JSON.parse(localStorage.getItem("moodHistory")) || {
    all: [],
    day: {},
    week: {},
    month: {},
    year: {}
  };
  
  const moodButtonsDiv = document.getElementById("mood-buttons");
  const emojiDiv = document.getElementById("emoji");
  const historyContent = document.getElementById("historyContent");
  
  const sections = {
    tracker: document.getElementById("tracker"),
    history: document.getElementById("history")
  };
  
  // Helper functions for date keys
  function getDayKey(date) {
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
  }
  
  function getWeekKey(date) {
    // Get year + week number (ISO week)
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
    const yearStart = new Date(tempDate.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
    return `${tempDate.getFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
  }
  
  function getMonthKey(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`; // YYYY-MM
  }
  
  function getYearKey(date) {
    return `${date.getFullYear()}`; // YYYY
  }
  
  // Create mood buttons dynamically
  for (const mood in moods) {
    const button = document.createElement("button");
    button.innerHTML = `${moods[mood]} ${mood}`;
    button.onclick = () => selectMood(mood);
    moodButtonsDiv.appendChild(button);
  }
  
  // Select mood and store in categorized buckets with animation
  function selectMood(mood) {
    const emoji = moods[mood];
    emojiDiv.textContent = emoji;
    emojiDiv.style.display = "block";
  
    // Popup animation
    emojiDiv.classList.remove("popup-animate");
    void emojiDiv.offsetWidth; // Trigger reflow to restart animation
    emojiDiv.classList.add("popup-animate");
  
    const timestamp = Date.now();
    const entry = { mood, emoji, time: timestamp };
    const date = new Date(timestamp);
  
    // Add to all list
    moodHistory.all.unshift(entry);
    if (moodHistory.all.length > 100) moodHistory.all.pop();
  
    // Add to day bucket
    const dayKey = getDayKey(date);
    if (!moodHistory.day[dayKey]) moodHistory.day[dayKey] = [];
    moodHistory.day[dayKey].push(entry);
  
    // Add to week bucket
    const weekKey = getWeekKey(date);
    if (!moodHistory.week[weekKey]) moodHistory.week[weekKey] = [];
    moodHistory.week[weekKey].push(entry);
  
    // Add to month bucket
    const monthKey = getMonthKey(date);
    if (!moodHistory.month[monthKey]) moodHistory.month[monthKey] = [];
    moodHistory.month[monthKey].push(entry);
  
    // Add to year bucket
    const yearKey = getYearKey(date);
    if (!moodHistory.year[yearKey]) moodHistory.year[yearKey] = [];
    moodHistory.year[yearKey].push(entry);
  
    // Save updated data
    localStorage.setItem("moodHistory", JSON.stringify(moodHistory));
  
    updateAnalysis();
  }
  
  // Calculate average score for an array of mood entries
  function calculateAverage(moods) {
    if (!moods || moods.length === 0) return null;
    const total = moods.reduce((sum, m) => sum + (moodScores[m.mood] ?? 3), 0);
    return total / moods.length;
  }
  
  // Get label for average mood score
  function getAverageMoodLabel(score) {
    if (score >= 4.5) return "Very Happy 😊";
    if (score >= 3.5) return "Happy 🙂";
    if (score >= 2.5) return "Neutral 😐";
    if (score >= 1.5) return "Tired 😴";
    if (score >= 0.5) return "Sad 😢";
    return "Angry 😠";
  }
  
  // Update the tracker tab with average mood for the past week
  function updateAnalysis() {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = moodHistory.all.filter(m => m.time >= oneWeekAgo);
  
    const avg = calculateAverage(recent);
    if (avg === null) {
      emojiDiv.insertAdjacentHTML("afterend", '<p id="analysis">No mood data for the past week.</p>');
    } else {
      let analysisDiv = document.getElementById("analysis");
      if (!analysisDiv) {
        analysisDiv = document.createElement("p");
        analysisDiv.id = "analysis";
        emojiDiv.insertAdjacentElement("afterend", analysisDiv);
      }
      const label = getAverageMoodLabel(avg);
      analysisDiv.textContent = `Your average mood this week: ${label} (Score: ${avg.toFixed(2)})`;
    }
  }
  
  // Switch visible tab
  function switchTab(tab) {
    for (const key in sections) {
      sections[key].classList.toggle("active", key === tab);
    }
    if (tab === "history") {
      showHistoryTab("day");
    }
    // Update active class on tab buttons
    document.querySelectorAll(".tab").forEach(button => {
      button.classList.toggle("active", button.textContent.includes(tab.charAt(0).toUpperCase() + tab.slice(1)));
    });
  }
  
  // Show history based on selected period
  function showHistoryTab(period) {
    // Update sub-tab active classes
    document.querySelectorAll(".sub-tabs button").forEach(btn => {
      btn.classList.toggle("active", btn.id === `tab-${period}`);
    });
  
    let entriesForPeriod = [];
  
    switch (period) {
      case "day":
        entriesForPeriod = Object.values(moodHistory.day).flat();
        break;
      case "week":
        entriesForPeriod = Object.values(moodHistory.week).flat();
        break;
      case "month":
        entriesForPeriod = Object.values(moodHistory.month).flat();
        break;
      case "year":
        entriesForPeriod = Object.values(moodHistory.year).flat();
        break;
      default:
        entriesForPeriod = moodHistory.all;
    }
  
    if (!entriesForPeriod || entriesForPeriod.length < 3) {
      historyContent.innerHTML = `<p><strong>Not enough mood data for this period.</strong></p>`;
      return;
    }
  
    const avg = calculateAverage(entriesForPeriod);
    const label = getAverageMoodLabel(avg);
  
    const listItems = entriesForPeriod
      .map(entry => {
        const dt = new Date(entry.time);
        return `<li>${entry.mood} ${entry.emoji} - ${dt.toLocaleString()}</li>`;
      })
      .join("");
  
    historyContent.innerHTML = `
      <p><strong>Average Mood:</strong> ${label} (Score: ${avg.toFixed(2)})</p>
      <ul>${listItems}</ul>
    `;
  }
  
  // Clear all mood history
  function clearHistory() {
    if (confirm("Are you sure you want to clear all mood history?")) {
      moodHistory = {
        all: [],
        day: {},
        week: {},
        month: {},
        year: {}
      };
      localStorage.removeItem("moodHistory");
      emojiDiv.textContent = "";
      emojiDiv.style.display = "none";
      historyContent.innerHTML = "<p>Mood history cleared.</p>";
      const analysisDiv = document.getElementById("analysis");
      if (analysisDiv) analysisDiv.textContent = "No mood data for the past week.";
    }
  }
  
  // Initialize buttons and listeners
  document.getElementById("clear-history-btn").addEventListener("click", clearHistory);
  
  document.querySelectorAll(".tab").forEach(button => {
    button.addEventListener("click", () => {
      if (button.textContent.includes("Tracker")) switchTab("tracker");
      else if (button.textContent.includes("History")) switchTab("history");
    });
  });
  
  document.querySelectorAll(".sub-tabs button").forEach(button => {
    button.addEventListener("click", () => {
      const period = button.id.replace("tab-", "");
      showHistoryTab(period);
    });
  });
  
  // On load, show tracker and update analysis
  switchTab("tracker");
  updateAnalysis();
  