async function loadCSV() {
    const response = await fetch("calls.csv");
    const text = await response.text();

    const rows = text.trim().split("\n");

    return rows.slice(1).map(row => {
        const [date, minutes] = row.split(",");
        return {
            date: new Date(date.trim()),
            minutes: parseFloat(minutes)
        };
    }).sort((a, b) => a.date - b.date);
}

// --- STATS CALCULATION ---
function computeStats(data) {
    const totalCalls = data.length;
    const totalMinutes = data.reduce((sum, d) => sum + d.minutes, 0);
    const avgCall = totalMinutes / totalCalls;
    const longestCall = Math.max(...data.map(d => d.minutes));

    // --- CURRENT STREAK ---
    let streak = 1;
    let maxStreak = 1;

    for (let i = data.length - 1; i > 0; i--) {
        const diff = (data[i].date - data[i - 1].date) / (1000 * 60 * 60 * 24);

        if (diff === 1) {
            streak++;
            maxStreak = Math.max(maxStreak, streak);
        } else {
            break; // only current streak
        }
    }

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const dayTotals = Array(7).fill(0);
    const dayCounts = Array(7).fill(0);

    data.forEach(d => {
        const day = d.date.getDay();
        dayTotals[day] += d.minutes;
        dayCounts[day]++;
    });

    // compute averages
    const dayAverages = dayTotals.map((total, i) =>
        dayCounts[i] ? total / dayCounts[i] : 0
    );

    // find best day
    const bestDayIndex = dayAverages.indexOf(Math.max(...dayAverages));
    const favoriteDay = days[bestDayIndex];

    return {
        totalCalls,
        totalMinutes,
        avgCall,
        longestCall,
        streak,
        totalHours: totalMinutes / 60,
        favoriteDay
    };
}

// --- UPDATE UI ---
function updateStatsUI(stats) {
    document.getElementById("totalTime").textContent =
        `${stats.totalMinutes.toFixed(0)} min`;

    document.getElementById("favoriteDay").textContent =
        stats.favoriteDay;

    document.getElementById("avgCall").textContent =
        `${stats.avgCall.toFixed(1)} min`;

    document.getElementById("longestCall").textContent =
        `${stats.longestCall.toFixed(0)} min`;

    document.getElementById("streak").textContent =
        `${stats.streak} days`;

    document.getElementById("totalHours").textContent =
        `${stats.totalHours.toFixed(1)} hrs`;
}

// --- CHART ---
function createChart(data) {
    const labels = data.map(d =>
        d.date.toLocaleDateString()
    );

    const values = data.map(d => d.minutes);

    const ctx = document.getElementById("callsChart");

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Minutes",
                data: values,
                backgroundColor: "#7C170D",
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: "rgba(20, 26, 69, 0.1)"
                    },
                    ticks: {
                        color: "#141A45"
                    }
                },
                x: {
                    ticks: {
                        color: "#141A45"
                    }
                }
            }
        }
    });
}

// --- INIT ---
loadCSV().then(data => {
    const stats = computeStats(data);
    updateStatsUI(stats);
    createChart(data);
});